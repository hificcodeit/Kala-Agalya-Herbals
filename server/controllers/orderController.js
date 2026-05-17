const Order = require("../models/Order");
const crypto = require("crypto");

/**
 * Standard Order Creation (from Checkout)
 */
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({
        ...req.body,
        paymentStatus: "PENDING",
        orderStatus: "Pending"
    });
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get PhonePe V2 Auth Token
 */
async function getPhonePeToken() {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const isProd = process.env.PHONEPE_ENV === "PRODUCTION";
  
  const authUrl = isProd 
    ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/identity-manager/v1/oauth/token";

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(`PhonePe Auth failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

/**
 * Initiate PhonePe Payment (from Payment Page)
 */
exports.initiatePhonePe = async (req, res) => {
  try {
    const { orderId } = req.body;

    // ── 1. Validate required env vars ────────────────────────────────────
    const missingVars = ["PHONEPE_MERCHANT_ID", "PHONEPE_CLIENT_ID", "PHONEPE_CLIENT_SECRET", "CLIENT_URL"]
      .filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      console.error("PhonePe: Missing env vars:", missingVars);
      return res.status(500).json({ success: false, message: `Missing server config: ${missingVars.join(", ")}` });
    }

    // ── 2. Load order ────────────────────────────────────────────────────
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // ── 3. Build IDs & amount ────────────────────────────────────────────
    const merchantOrderId = "T" + order._id.toString();
    const amountInPaise = Math.round(order.totalAmount * 100);
    if (!amountInPaise || amountInPaise <= 0) {
      return res.status(400).json({ success: false, message: "Order total amount is invalid" });
    }

    // ── 4. Build payload for V2 Checkout ─────────────────────────────────
    let clientUrl = process.env.CLIENT_URL.replace(/\/$/, "");
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantOrderId: merchantOrderId,
      amount: amountInPaise,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment for order",
        merchantUrls: {
          redirectUrl: `${clientUrl}/success?transactionId=${merchantOrderId}`
        }
      }
    };

    // ── 5. Get OAuth Token and Call PhonePe ──────────────────────────────
    const token = await getPhonePeToken();
    const isProd = process.env.PHONEPE_ENV === "PRODUCTION";
    const checkoutUrl = isProd 
      ? "https://api.phonepe.com/apis/pg/checkout/v2/pay"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

    const response = await fetch(checkoutUrl, {
      method: "POST",
      headers: {
        "Content-Type" : "application/json",
        "Authorization": `O-Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    let data;
    try { data = JSON.parse(rawText); } catch(e) {
      return res.status(500).json({ success: false, message: "PhonePe returned non-JSON: " + rawText.slice(0, 300) });
    }

    // ── 6. Return result ─────────────────────────────────────────────────
    // V2 typically returns { redirectUrl: "...", state: "..." } at root or inside data
    const redirectUrl = data.redirectUrl || (data.data && data.data.redirectUrl);
    
    if (response.ok && redirectUrl) {
      await Order.findByIdAndUpdate(orderId, { paymentId: merchantOrderId });
      return res.json({ success: true, redirectUrl });
    }

    // PhonePe returned failure
    console.error("PhonePe refused payment:", JSON.stringify(data));
    return res.status(400).json({
      success: false,
      message: data.message || "Init failed",
      code: data.code || response.status,
      phonePeData: data
    });

  } catch (err) {
    console.error("PhonePe Initiation Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Config Check — verify PhonePe env vars are loaded (safe diagnostic)
 */
exports.phonePeConfigCheck = (req, res) => {
  const vars = ["PHONEPE_CLIENT_ID", "PHONEPE_CLIENT_SECRET", "PHONEPE_ENV", "CLIENT_URL"];
  const result = {};
  vars.forEach(v => {
    const val = process.env[v];
    if (!val) result[v] = "❌ MISSING";
    else if (v.includes("SECRET")) result[v] = "✅ SET (hidden)";
    else result[v] = "✅ " + val;
  });

  const isProd = process.env.PHONEPE_ENV === "PRODUCTION";
  result["COMPUTED_PHONEPE_PAY_URL"] = isProd 
    ? "https://api.phonepe.com/apis/pg/checkout/v2/pay"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

  res.json({ env: result });
};

/**
 * Check Status
 */
exports.checkStatus = async (req, res) => {
    try {
        const { merchantTransactionId } = req.params;
        const merchantOrderId = merchantTransactionId; // V2 uses merchantOrderId
        
        const token = await getPhonePeToken();
        const isProd = process.env.PHONEPE_ENV === "PRODUCTION";
        
        // Build V2 status URL
        const checkUrl = isProd 
          ? `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantOrderId}/status`
          : `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order/${merchantOrderId}/status`;
    
        const response = await fetch(checkUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `O-Bearer ${token}`
          }
        });
    
        const data = await response.json();
        
        // V2 State is usually inside the main object or data.state
        const state = data.state || (data.data && data.data.state);
    
        if (response.ok && (state === "COMPLETED" || state === "SUCCESS")) {
          const orderId = merchantOrderId.startsWith("T") ? merchantOrderId.slice(1) : merchantOrderId;
          await Order.findByIdAndUpdate(orderId, {
            paymentStatus: "PAID",
            paymentId: data.orderId || merchantOrderId
          });
          res.json({ success: true, message: "Payment Verified" });
        } else {
          res.json({ success: false, message: data.message || "Payment not completed" });
        }
    
    } catch (error) {
        console.error("Status Check Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get order by ID (public — for invoice on success page)
 */
exports.getOrderById = async (req, res) => {
  try {
    const rawId = req.params.id;
    const orderId = rawId.startsWith("T") ? rawId.slice(1) : rawId;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get logged-in user's orders
 */
exports.getUserOrders = async (req, res) => {
  try {
    const email = req.user?.email;
    console.log("[getUserOrders] Fetching orders for email:", email);
    if (!email) {
      return res.status(400).json({ success: false, message: "User email not found in token" });
    }
    const orders = await Order.find({ "customer.email": email }).sort({ createdAt: -1 });
    console.log("[getUserOrders] Found", orders.length, "orders");
    res.json({ success: true, orders });
  } catch (err) {
    console.error("[getUserOrders] ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Customer update order status (Only used for Confirm Delivery)
 */
exports.updateOrderStatusCustomer = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Customers can only mark orders as Delivered" });
    }

    const order = await Order.findOne({ _id: req.params.id, "customer.email": req.user.email });
    if (!order) return res.status(404).json({ success: false, message: "Order not found or unauthorized" });

    order.orderStatus = "Delivered";
    order.updatedAt = Date.now();
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
