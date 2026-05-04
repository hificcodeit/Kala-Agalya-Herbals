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
 * Initiate PhonePe Payment (from Payment Page)
 */
exports.initiatePhonePe = async (req, res) => {
  try {
    const { orderId } = req.body;

    // ── 1. Validate required env vars ────────────────────────────────────
    const missingVars = ["PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY", "PHONEPE_SALT_INDEX", "PHONEPE_API_URL"]
      .filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      console.error("PhonePe: Missing env vars:", missingVars);
      return res.status(500).json({ success: false, message: `Missing server config: ${missingVars.join(", ")}` });
    }

    // ── 2. Load order ────────────────────────────────────────────────────
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // ── 3. Build IDs & amount ────────────────────────────────────────────
    // PhonePe requires: alphanumeric + hyphens/underscores, max 38 chars
    // Prefix with 'T' so it's never purely numeric
    const merchantTransactionId = "T" + order._id.toString();

    const rawId = (order.customer.email || order.customer.name || "user");
    const merchantUserId = "U" + rawId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 29);

    const amountInPaise = Math.round(order.totalAmount * 100);
    if (!amountInPaise || amountInPaise <= 0) {
      console.error("PhonePe: Invalid amount. totalAmount =", order.totalAmount);
      return res.status(400).json({ success: false, message: "Order total amount is invalid (zero or missing)" });
    }

    // ── 4. Build payload ─────────────────────────────────────────────────
    // Fix CLIENT_URL — if it's still localhost, use the real domain
    let clientUrl = (process.env.CLIENT_URL || "https://www.kalaagalyaherbals.in").replace(/\/$/, "");
    if (clientUrl.includes("localhost")) {
      clientUrl = "https://www.kalaagalyaherbals.in";
    }
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId,
      amount: amountInPaise,
      redirectUrl: `${clientUrl}/success?transactionId=${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      mobileNumber: order.customer.phone || undefined,
      paymentInstrument: { type: "PAY_PAGE" }
    };
    // Only include callbackUrl if it is defined
    if (process.env.PHONEPE_CALLBACK_URL) {
      payload.callbackUrl = process.env.PHONEPE_CALLBACK_URL;
    }

    // ── 5. Sign the payload ──────────────────────────────────────────────
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const stringToHash  = base64Payload + "/pg/v1/pay" + process.env.PHONEPE_SALT_KEY;
    const sha256        = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerifyHeader = sha256 + "###" + process.env.PHONEPE_SALT_INDEX;

    // ── 6. Build endpoint URL ────────────────────────────────────────────
    let baseUrl = process.env.PHONEPE_API_URL.replace(/\/$/, "");
    if (baseUrl.endsWith("/pg/v1/pay")) {
      baseUrl = baseUrl.replace(/\/pg\/v1\/pay$/, "");
    }
    // Auto-correct my previous bad advice if they set it to /apis/pg
    if (baseUrl === "https://api.phonepe.com/apis/pg") {
      baseUrl = "https://api.phonepe.com/apis/hermes";
    }
    const phonePeUrl = baseUrl + "/pg/v1/pay";

    // ── 7. Debug logs (visible in Render dashboard) ──────────────────────
    console.log("=== PhonePe Initiation ===");
    console.log("  Merchant ID       :", process.env.PHONEPE_MERCHANT_ID);
    console.log("  Salt Index        :", process.env.PHONEPE_SALT_INDEX);
    console.log("  Final URL         :", phonePeUrl);
    console.log("  Amount (paise)    :", amountInPaise);
    console.log("  merchantTxnId     :", merchantTransactionId);
    console.log("  merchantUserId    :", merchantUserId);
    console.log("  Payload (decoded) :", JSON.stringify(payload));

    // ── 8. Call PhonePe ──────────────────────────────────────────────────
    const response = await fetch(phonePeUrl, {
      method: "POST",
      headers: {
        "Content-Type" : "application/json",
        "X-VERIFY"     : xVerifyHeader,
        "accept"       : "application/json"
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const rawText = await response.text();
    console.log("PhonePe HTTP status:", response.status);
    console.log("PhonePe raw response:", rawText);

    let data;
    try { data = JSON.parse(rawText); }
    catch(e) {
      return res.status(500).json({ success: false, message: "PhonePe returned non-JSON: " + rawText.slice(0, 300) });
    }

    // ── 9. Return result ─────────────────────────────────────────────────
    if (data.success && data.data && data.data.instrumentResponse) {
      // Update the order with the transaction ID we used
      await Order.findByIdAndUpdate(orderId, { paymentId: merchantTransactionId });
      return res.json({
        success: true,
        redirectUrl: data.data.instrumentResponse.redirectInfo.url
      });
    }

    // PhonePe returned failure — surface the full details
    console.error("PhonePe refused payment:", JSON.stringify(data));
    return res.status(400).json({
      success: false,
      message: data.message || "Init failed",
      code: data.code || null,
      phonePeData: data.data || null
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
  const vars = ["PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY", "PHONEPE_SALT_INDEX", "PHONEPE_API_URL", "PHONEPE_CALLBACK_URL", "CLIENT_URL"];
  const result = {};
  vars.forEach(v => {
    const val = process.env[v];
    if (!val) result[v] = "❌ MISSING";
    else if (v.includes("SALT_KEY")) result[v] = "✅ SET (hidden)";
    else result[v] = "✅ " + val;
  });

  // Show the computed final URL that will actually be called
  let rawUrl = (process.env.PHONEPE_API_URL || "").replace(/\/$/, "");
  if (rawUrl.endsWith("/pg/v1/pay")) {
    rawUrl = rawUrl.replace(/\/pg\/v1\/pay$/, "");
  }
  if (rawUrl === "https://api.phonepe.com/apis/pg") {
    rawUrl = "https://api.phonepe.com/apis/hermes";
  }
  result["COMPUTED_PHONEPE_PAY_URL"] = rawUrl ? rawUrl + "/pg/v1/pay" : "❌ Cannot compute (PHONEPE_API_URL missing)";

  let clientUrl = process.env.CLIENT_URL || "";
  if (!clientUrl || clientUrl.includes("localhost")) {
    result["CLIENT_URL_WARNING"] = "⚠️ CLIENT_URL is localhost or missing — redirects will fail! Set it to https://www.kalaagalyaherbals.in";
  }

  res.json({ env: result });
};

/**
 * Check Status
 */
exports.checkStatus = async (req, res) => {
    try {
        const { merchantTransactionId } = req.params;
        const merchantId = process.env.PHONEPE_MERCHANT_ID;
        const saltKey = process.env.PHONEPE_SALT_KEY;
        const saltIndex = process.env.PHONEPE_SALT_INDEX;
    
        const stringToHash = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + saltKey;
        const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
        const xVerifyHeader = sha256 + "###" + saltIndex;
    
        // Normalize the base URL
        let baseUrl = process.env.PHONEPE_API_URL.replace(/\/$/, "");
        if (baseUrl.endsWith("/pg/v1/pay")) {
            baseUrl = baseUrl.replace(/\/pg\/v1\/pay$/, "");
        }
        if (baseUrl === "https://api.phonepe.com/apis/pg") {
            baseUrl = "https://api.phonepe.com/apis/hermes";
        }
        const checkUrl = `${baseUrl}/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    
        const response = await fetch(checkUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": xVerifyHeader,
            "X-MERCHANT-ID": merchantId,
            "accept": "application/json"
          }
        });
    
        const data = await response.json();
    
        if (data.success && data.code === "PAYMENT_SUCCESS") {
          await Order.findByIdAndUpdate(merchantTransactionId, {
            paymentStatus: "PAID",
            paymentId: data.data.transactionId
          });
          res.json({ success: true, message: "Payment Verified" });
        } else {
          res.json({ success: false, message: data.message });
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
    const order = await Order.findById(req.params.id);
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
    const email = req.user.email;
    const orders = await Order.find({ "customer.email": email }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
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
