const { GoogleGenAI, Type, createPartFromFunctionResponse } = require("@google/genai");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const WhatsAppOrder = require("../models/WhatsAppOrder");
const Query = require("../models/Query");
const cache = require("../utils/cache");

const PRODUCTS_PROMPT_CACHE_KEY = "chatbot_products_summary";
const PRODUCTS_PROMPT_TTL = 300; // 5 minutes

// Ordered fastest/most reliable first; avoids 404/503 retries where possible
const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest"
].filter(Boolean);

const STORE_KNOWLEDGE = `
You are "Agalya", the friendly, fast AI Customer Support Assistant for **Kala Agalya Herbals**.

### Brand & Store Information
- **Brand:** Kala Agalya Herbals — 100% Naturopathy & Organic Herbal Hair Oil, founded in Chennai by herbalist Kala Agalya (women-led, Made in India, cruelty-free).
- **Address:** Ayyapakkam, Chennai, Tamil Nadu, India – 600077.
- **Customer Care Hours:** Monday – Saturday, 9:00 AM to 6:00 PM IST.
- **Phone / WhatsApp:** +91 7338758727
- **Email:** kalaagalyaherbals@gmail.com
- **Key Ingredients (18+ rare herbs in pure coconut oil):** Amla (strengthens roots), Hibiscus (prevents hair fall), Aloe Vera (natural conditioner), Neem (dandruff control), Coconut Oil (deep nourishment), Vetiver (cooling effect), Fenugreek (prevents shedding), Henna (natural conditioning/color), Curry Leaves (rich in iron), Black Cumin (anti-inflammatory), Rose Petals (scalp soothing), Pearl Onion (growth booster), False Daisy / Bhringraj (rejuvenation), Rosemary (circulation), Tanner's Cassia (antibacterial).
- **Chemical-Free Promise:** Zero parabens, sulfates, mineral oils, artificial fragrances, or preservatives.
- **How to Use:** Gently massage a small amount into the scalp and hair roots with fingertips for 5–10 minutes. Leave on for at least 30–60 minutes (or overnight) before washing with a mild/herbal cleanser. Always do a small patch test before first use if you have sensitive skin.
- **Medical Disclaimer:** For severe medical scalp conditions (e.g., alopecia, psoriasis, fungal infection, or open wounds), advise consulting a dermatologist or doctor.

### Shipping Charges & Delivery Policy (Official Rates)
- **Tamil Nadu:** ₹30 (Estimated 2–4 business days)
- **Puducherry:** ₹40 (Estimated 3–5 business days)
- **South India (Andhra Pradesh, Telangana, Kerala, Karnataka):** ₹75 (Estimated 3–6 business days)
- **Rest of India (all other states & UTs):** ₹165 (Estimated 5–10 business days)
- **Processing Time:** Orders are processed within 1–3 business days. Pan-India delivery across almost every pin code.
- **Payments:** Online payment via PhonePe (UPI, cards, netbanking) at checkout, plus WhatsApp ordering support.

### Refund & Return Policy
- **Mandatory Requirement:** A continuous, uncut **package opening video** from parcel seal opening is strictly required to claim any refund or replacement.
- **Eligible Cases:** Damaged during transit (with opening video), wrong product delivered, tampered package, manufacturing defect, or product leakage.
- **Not Eligible:** Missing clear opening video, opened/used product, broken seal, change of mind, personal dislike, or courier delays.
- **How to Request:** Contact us via WhatsApp/Phone (+91 7338758727), email (kalaagalyaherbals@gmail.com), or submit a support ticket in this chat.

### Assistant Rules
1. Answer product, price, stock, ingredient, shipping, and policy questions directly using the Live Store Catalog and Shipping Rates provided in this prompt (no extra tool wait needed).
2. For order status/tracking:
   - Call \`track_order\`.
   - If the customer is NOT logged in, ask for **both** their Order ID (8-digit or invoice/transaction ID) AND their registered 10-digit phone number or email before sharing order status. Never fabricate order data or expose full street addresses.
3. If the customer wants a callback, wants to report a damaged/missing parcel, asks for bulk/wholesale pricing, or has an unresolved issue, offer to create a support ticket using \`submit_support_query\` (collect Name, 10-digit Phone, optional Email, and Message).
4. Stay strictly focused on Kala Agalya Herbals, hair care, orders, and store policies. Politely decline unrelated topics (e.g., coding, politics, general trivia).
5. Keep answers concise, warm, and easy to scan (use short bullet points when listing prices, steps, or policies).
`;

const toolDeclarations = [
  {
    name: "track_order",
    description: "Look up customer order status, payment status, items, and courier tracking details. For logged-in users, orderId is optional (returns recent orders if omitted). For guests, both orderId and phoneOrEmail verification are required.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: {
          type: Type.STRING,
          description: "The 8-digit order ID (e.g. '12345678') or invoice number."
        },
        phoneOrEmail: {
          type: Type.STRING,
          description: "Customer's registered 10-digit phone number or email address for verification."
        }
      }
    }
  },
  {
    name: "submit_support_query",
    description: "Create a customer support ticket in the Kala Agalya Herbals admin dashboard so the team can follow up by phone or email.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Customer full name." },
        phone: { type: Type.STRING, description: "Customer 10-digit phone number." },
        email: { type: Type.STRING, description: "Customer email address (optional)." },
        message: { type: Type.STRING, description: "Summary of the customer's question, issue, or request." }
      },
      required: ["name", "phone", "message"]
    }
  }
];

function sanitizeOrderSummary(order, isWhatsApp = false) {
  return {
    orderId: order.orderId,
    source: isWhatsApp ? "WhatsApp Order" : "Website Order",
    orderStatus: order.orderStatus || order.invoiceStatus || "Pending",
    paymentStatus: order.paymentStatus || "PAID",
    items: (order.items || []).map((i) => ({
      name: i.name,
      size: i.size,
      quantity: i.quantity,
      price: i.price
    })),
    shippingAmount: order.shippingAmount ?? 0,
    totalAmount: order.totalAmount,
    trackingNumber: order.trackingNumber || null,
    trackingUrl: order.trackingUrl || null,
    createdAt: order.createdAt
  };
}

function normalizePhone(val) {
  return String(val || "").replace(/\D/g, "").slice(-10);
}

async function getLiveCatalogText() {
  const cached = cache.get(PRODUCTS_PROMPT_CACHE_KEY);
  if (cached) return cached;

  try {
    if (mongoose.connection.readyState !== 1) {
      return "Catalog fallback: 100 ml (₹199, MRP ₹249), 200 ml (₹349, MRP ₹449), 500 ml (₹799, MRP ₹999).";
    }
    const products = await Product.find({ isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .select("name description category sizes")
      .lean();

    if (!products.length) {
      return "No active products found right now.";
    }

    const lines = products.map((p) => {
      const sizeText = (p.sizes || [])
        .map((s) => {
          const eff = s.offerPrice && s.offerPrice > 0 ? s.offerPrice : s.price;
          const mrpPart = s.mrp ? ` (MRP ₹${s.mrp})` : "";
          const stockPart = (s.stock ?? 0) > 0 ? "In Stock" : "Out of Stock";
          return `${s.size}: ₹${eff}${mrpPart} [${stockPart}]`;
        })
        .join(" | ");
      return `- **${p.name}** (${p.category || "Hair Oil"}): ${sizeText}. ${p.description ? p.description.slice(0, 160) : ""}`;
    });

    const summary = lines.join("\n");
    cache.set(PRODUCTS_PROMPT_CACHE_KEY, summary, PRODUCTS_PROMPT_TTL);
    return summary;
  } catch {
    return "Catalog fallback: 100 ml (₹199, MRP ₹249), 200 ml (₹349, MRP ₹449), 500 ml (₹799, MRP ₹999).";
  }
}

async function executeTool(name, args = {}, authUser = null) {
  switch (name) {
    case "track_order": {
      const rawOrderId = String(args.orderId || "").trim().replace(/^#/, "");
      const cleanOrderId = rawOrderId.startsWith("T") ? rawOrderId.slice(1) : rawOrderId;
      const verification = String(args.phoneOrEmail || "").trim();

      if (authUser && !cleanOrderId) {
        const escapedEmail = String(authUser.email || "").trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const orders = await Order.find({
          "customer.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") }
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();

        if (!orders.length) {
          return { found: false, message: "No website orders found under your logged-in account." };
        }
        return {
          found: true,
          orders: orders.map((o) => sanitizeOrderSummary(o, false))
        };
      }

      if (!cleanOrderId) {
        return {
          found: false,
          requiresVerification: true,
          message: "Please provide your Order ID and registered 10-digit phone number (or email) so I can check your order securely."
        };
      }

      let order = null;
      let isWhatsApp = false;
      if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
        order = await Order.findById(cleanOrderId).lean();
      } else {
        order = await Order.findOne({ orderId: cleanOrderId }).lean();
      }

      if (!order) {
        if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
          order = await WhatsAppOrder.findById(cleanOrderId).lean();
        } else {
          order =
            (await WhatsAppOrder.findOne({ orderId: cleanOrderId }).lean()) ||
            (await WhatsAppOrder.findOne({ invoiceNumber: cleanOrderId }).lean());
        }
        if (order) isWhatsApp = true;
      }

      if (!order) {
        return { found: false, message: `No order found matching ID "${cleanOrderId}".` };
      }

      const orderEmail = String(order.customer?.email || "").trim().toLowerCase();
      const orderPhones = [
        normalizePhone(order.customer?.phone),
        normalizePhone(order.customer?.altPhone),
        normalizePhone(order.customer?.mobileNumber),
        normalizePhone(order.customer?.whatsappNumber)
      ].filter((p) => p.length === 10);

      let authorized = false;
      if (authUser?.email && orderEmail && authUser.email.trim().toLowerCase() === orderEmail) {
        authorized = true;
      } else if (authUser?.phone && orderPhones.includes(normalizePhone(authUser.phone))) {
        authorized = true;
      } else if (verification) {
        const vLower = verification.toLowerCase();
        const vPhone = normalizePhone(verification);
        if ((orderEmail && vLower === orderEmail) || (vPhone.length === 10 && orderPhones.includes(vPhone))) {
          authorized = true;
        }
      }

      if (!authorized) {
        return {
          found: false,
          requiresVerification: true,
          message: "For your privacy, please share the 10-digit phone number or email address used on this order to verify ownership."
        };
      }

      return {
        found: true,
        order: sanitizeOrderSummary(order, isWhatsApp)
      };
    }

    case "submit_support_query": {
      const customerName = String(args.name || authUser?.name || "").trim();
      const phone = normalizePhone(args.phone || authUser?.phone);
      const email = String(args.email || authUser?.email || "").trim();
      const message = String(args.message || "").trim();

      if (!customerName || phone.length < 10 || !message) {
        return {
          submitted: false,
          error: "Customer name, a valid 10-digit phone number, and message are required to create a support ticket."
        };
      }

      const query = await Query.create({
        name: customerName,
        phone,
        email: email || undefined,
        message
      });

      return {
        submitted: true,
        ticketId: String(query._id).slice(-6).toUpperCase(),
        message: "Support ticket created successfully. Our team will contact you shortly."
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function buildSystemInstruction(language, authUser, catalogText) {
  const langLine = language && language.toLowerCase() !== "english"
    ? `\n### Language Preference\nThe customer's storefront language is set to **${language}**. Reply in **${language}** unless the customer writes in another language — always match their latest message language naturally.`
    : "\n### Language Preference\nReply in the same language the customer uses (English, Tamil, Hindi, Telugu, Kannada, Malayalam, etc.).";

  const authLine = authUser
    ? `\n### Session Context\nThe customer is logged in as **${authUser.name || "Customer"}** (${authUser.email}). You can look up their recent orders with \`track_order\` without extra verification.`
    : "\n### Session Context\nThe customer is browsing as a guest (not logged in).";

  return `${STORE_KNOWLEDGE}\n### Live Store Catalog\n${catalogText}${langLine}${authLine}`;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .filter((m) => m && typeof m.text === "string" && m.text.trim() && (m.role === "user" || m.role === "model"))
    .map((m) => ({
      role: m.role,
      parts: [{ text: m.text.trim().slice(0, 1200) }]
    }));
}

async function generateWithFallback(ai, contents, config) {
  let lastError;
  for (const model of DEFAULT_MODELS) {
    try {
      const perAttemptConfig = {
        ...config,
        abortSignal: AbortSignal.timeout(12000)
      };
      return await ai.models.generateContent({ model, contents, config: perAttemptConfig });
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || "");
      const status = err?.status || err?.statusCode;
      if (
        err?.name === "TimeoutError" ||
        err?.name === "AbortError" ||
        status === 404 ||
        status === 429 ||
        status === 503 ||
        /not found|not supported|unknown model|UNAVAILABLE|high demand|overloaded|RESOURCE_EXHAUSTED|timeout|aborted/i.test(msg)
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

exports.generateChatReply = async ({ message, history = [], language = "English", user = null }) => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GEMINI_API_Key || "").trim();
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not configured on the server.");
    err.statusCode = 503;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });
  const catalogText = await getLiveCatalogText();
  const contents = [
    ...sanitizeHistory(history),
    { role: "user", parts: [{ text: message.trim() }] }
  ];

  const config = {
    systemInstruction: buildSystemInstruction(language, user, catalogText),
    temperature: 0.35,
    maxOutputTokens: 550,
    tools: [{ functionDeclarations: toolDeclarations }]
  };

  const toolsUsed = [];
  let response = await generateWithFallback(ai, contents, config);

  for (let round = 0; round < 3; round++) {
    const calls = response.functionCalls;
    if (!calls || calls.length === 0) break;

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) {
      contents.push(modelContent);
    }

    const functionResponses = [];
    for (const call of calls) {
      toolsUsed.push(call.name);
      const result = await executeTool(call.name, call.args || {}, user);
      functionResponses.push(
        createPartFromFunctionResponse(call.id || call.name, call.name, result)
      );
    }

    contents.push({
      role: "user",
      parts: functionResponses
    });

    response = await generateWithFallback(ai, contents, config);
  }

  const reply = (response.text || "").trim() ||
    "I'm sorry, I couldn't generate a response right now. Please contact our team at +91 7338758727 or kalaagalyaherbals@gmail.com.";

  return { reply, toolsUsed };
};
