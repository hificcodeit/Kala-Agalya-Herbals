const Order = require("../models/Order");
const crypto = require("crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cache = require("../utils/cache");

const PHONEPE_TOKEN_CACHE_KEY = "phonepe_auth_token";

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
  // Return cached token if still valid (cache for 25 minutes, token usually valid 30 min)
  const cached = cache.get(PHONEPE_TOKEN_CACHE_KEY);
  if (cached) return cached;

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

  // Cache token for 25 minutes
  cache.set(PHONEPE_TOKEN_CACHE_KEY, data.access_token, 25 * 60);
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

        // ── DIAGNOSTIC LOG: See full PhonePe response in Railway logs ──────
        console.log("[checkStatus] PhonePe HTTP status:", response.status);
        console.log("[checkStatus] PhonePe raw response:", JSON.stringify(data, null, 2));
        
        // V2 State can be at root or nested — check all known locations
        const state = data.state 
          || (data.data && data.data.state)
          || (data.paymentDetails && data.paymentDetails[0] && data.paymentDetails[0].state);

        console.log("[checkStatus] Resolved state:", state, "| merchantOrderId:", merchantOrderId);
    
        if (response.ok && (state === "COMPLETED" || state === "SUCCESS" || state === "PAYMENT_SUCCESS")) {
          const orderId = merchantOrderId.startsWith("T") ? merchantOrderId.slice(1) : merchantOrderId;
          console.log("[checkStatus] Updating order to PAID, orderId:", orderId);
          await Order.findByIdAndUpdate(orderId, {
            paymentStatus: "PAID",
            paymentDate: new Date(),
            paymentId: data.orderId || merchantOrderId
          });
          res.json({ success: true, message: "Payment Verified" });
        } else {
          console.log("[checkStatus] Payment NOT verified. state:", state, "| data.message:", data.message);
          res.json({ success: false, message: data.message || "Payment not completed" });
        }
    
    } catch (error) {
        console.error("Status Check Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PhonePe Webhook / Callback Handler
 * PhonePe POSTs to this endpoint after every payment (success or failure).
 * Event: checkout.order.completed / checkout.order.failed
 */
exports.phonePeCallback = async (req, res) => {
  try {
    console.log("[phonePeCallback] Received callback from PhonePe");
    console.log("[phonePeCallback] Body:", JSON.stringify(req.body, null, 2));

    const body = req.body || {};

    // PhonePe checkout event structure:
    // { event: "checkout.order.completed", payload: { merchantOrderId, orderId, state, ... } }
    const event = body.event || "";
    const payload = body.payload || body.data || body;

    const merchantOrderId =
      payload.merchantOrderId ||
      payload.transactionId ||
      body.merchantOrderId;

    // Determine if payment is successful from the event name OR the state field
    const isSuccess =
      event === "checkout.order.completed" ||
      payload.state === "COMPLETED" ||
      payload.state === "SUCCESS" ||
      payload.state === "PAYMENT_SUCCESS" ||
      body.state === "COMPLETED";

    console.log("[phonePeCallback] event:", event, "| merchantOrderId:", merchantOrderId, "| isSuccess:", isSuccess);

    if (!merchantOrderId) {
      console.warn("[phonePeCallback] No merchantOrderId found in callback body");
      return res.status(200).json({ success: false, message: "No merchantOrderId" });
    }

    if (isSuccess) {
      const orderId = merchantOrderId.startsWith("T")
        ? merchantOrderId.slice(1)
        : merchantOrderId;

      // Only update if still PENDING (avoid duplicate updates)
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== "PAID") {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "PAID",
          paymentDate: new Date(),
          paymentId: payload.orderId || body.orderId || merchantOrderId
        });
        console.log("[phonePeCallback] ✅ Order", orderId, "marked as PAID via webhook");
      } else if (order && order.paymentStatus === "PAID") {
        console.log("[phonePeCallback] Order", orderId, "already PAID — skipping duplicate update");
      }
    } else {
      console.log("[phonePeCallback] event:", event, "— no PAID update needed");
    }

    // PhonePe expects a 200 OK — always send it
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[phonePeCallback] Error:", err);
    // Still respond 200 so PhonePe doesn't retry endlessly
    res.status(200).json({ success: false, message: err.message });
  }
};

/**
 * Get order by ID (public — for invoice on success page)
 */
exports.getOrderById = async (req, res) => {
  try {
    const rawId = req.params.id;
    const orderId = rawId.startsWith("T") ? rawId.slice(1) : rawId;
    const { token } = req.query;

    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ orderId: orderId });
    }

    let isWhatsAppOrder = false;
    // If not found in website orders, check WhatsApp orders
    if (!order) {
      const WhatsAppOrder = require("../models/WhatsAppOrder");
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await WhatsAppOrder.findById(orderId);
      } else {
        order = await WhatsAppOrder.findOne({ orderId: orderId }) || await WhatsAppOrder.findOne({ invoiceNumber: orderId });
      }
      if (order) isWhatsAppOrder = true;
    }

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Check if requester is authenticated admin (always bypass expiry for admin preview/download)
    let isAdmin = false;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      try {
        const authToken = req.headers.authorization.split(" ")[1];
        const decodedAdmin = jwt.verify(authToken, process.env.JWT_SECRET);
        if (decodedAdmin && decodedAdmin.id) isAdmin = true;
      } catch (e) {}
    }

    // For WhatsApp orders viewed publicly by customer, enforce the 20-minute timed security link
    if (isWhatsAppOrder && !isAdmin) {
      if (!token) {
        return res.status(401).json({
          success: false,
          securityProtected: true,
          message: "A secure verification link is required to view this invoice. Please click the official link sent to your WhatsApp number."
        });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.orderId !== order.orderId && decoded.invoiceNumber !== order.invoiceNumber) {
          return res.status(403).json({
            success: false,
            message: "Security verification failed for this invoice link."
          });
        }
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(410).json({
            success: false,
            expired: true,
            orderId: order.orderId,
            message: "This invoice link has expired for your privacy & security (valid for 20 minutes). Please request a fresh link on WhatsApp."
          });
        }
        return res.status(401).json({
          success: false,
          message: "Invalid or expired security token."
        });
      }
    }

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
    if (!email) {
      return res.status(400).json({ success: false, message: "User email not found in token" });
    }
    const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      $or: [
        { "customer.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") } },
        ...(req.user._id ? [{ "customer.userId": req.user._id }, { userId: req.user._id }] : [])
      ]
    };
    const orders = await Order.find(query).sort({ createdAt: -1 });
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
