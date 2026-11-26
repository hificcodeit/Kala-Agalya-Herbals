const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateChatReply } = require("../services/chatbotService");

/**
 * Optionally authenticate the user if a valid Bearer token is provided.
 * Guests are still allowed to chat without a token.
 */
async function resolveOptionalUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    if (!token || token === "null" || token === "undefined") return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return null;
    const user = await User.findById(decoded.id).select("name email phone").lean();
    return user || null;
  } catch {
    return null;
  }
}

exports.chatHealth = (req, res) => {
  res.json({
    success: true,
    configured: Boolean(process.env.GEMINI_API_KEY?.trim())
  });
};

exports.handleChat = async (req, res) => {
  try {
    const { message, history, language } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message."
      });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please keep it under 1000 characters."
      });
    }

    const user = await resolveOptionalUser(req);
    const result = await generateChatReply({
      message,
      history,
      language: typeof language === "string" ? language : "English",
      user
    });

    res.json({
      success: true,
      reply: result.reply,
      toolsUsed: result.toolsUsed
    });
  } catch (err) {
    console.error("[Chatbot Error]:", err);
    const status = err.statusCode || err.status || 500;
    const isRateLimit = status === 429;
    res.status(isRateLimit ? 429 : status >= 400 && status < 500 ? status : 500).json({
      success: false,
      message: isRateLimit
        ? "Our herbal assistant is busy right now. Please try again in a few seconds or reach us on WhatsApp (+91 7338758727)."
        : "Unable to connect to the assistant right now. Please try again or contact +91 7338758727."
    });
  }
};
