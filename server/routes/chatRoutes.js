const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { handleChat, chatHealth } = require("../controllers/chatController");

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 35,
  message: {
    success: false,
    message: "Too many chat messages in a short time. Please wait a few minutes or message us on WhatsApp (+91 7338758727)."
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.get("/health", chatHealth);
router.post("/", chatLimiter, handleChat);

module.exports = router;
