const express = require("express");
const router = express.Router();
const { createOrder, initiatePhonePe, checkStatus, phonePeCallback, getOrderById, getUserOrders, updateOrderStatusCustomer, phonePeConfigCheck } = require("../controllers/orderController");
const userAuth = require("../middleware/userAuth");

// User routes (protected)
router.post("/", userAuth, createOrder);
router.post("/initiate-phonepe", userAuth, initiatePhonePe);
router.get("/phonepe-config-check", phonePeConfigCheck); // Diagnostic: visit in browser
router.get("/my-orders", userAuth, getUserOrders);
router.put("/:id/customer-status", userAuth, updateOrderStatusCustomer);

// PhonePe server-to-server callback — NO auth (PhonePe POSTs directly from their servers)
router.post("/phonepe/callback", phonePeCallback);

// Public / system routes
router.get("/status/:merchantTransactionId", checkStatus);
// Public — no auth needed (used by Success page to fetch order for invoice)
router.get("/:id", getOrderById);

module.exports = router;
