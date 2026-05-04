const express = require("express");
const router = express.Router();
const { createOrder, initiatePhonePe, checkStatus, getOrderById, getUserOrders, updateOrderStatusCustomer, phonePeConfigCheck } = require("../controllers/orderController");
const userAuth = require("../middleware/userAuth");

// User routes
router.post("/", createOrder);
router.post("/initiate-phonepe", initiatePhonePe);
router.get("/phonepe-config-check", phonePeConfigCheck); // Diagnostic: visit in browser
router.get("/my-orders", userAuth, getUserOrders);
router.put("/:id/customer-status", userAuth, updateOrderStatusCustomer);

// Public / system routes
router.get("/status/:merchantTransactionId", checkStatus);
router.get("/:id", getOrderById); // Public — for invoice

module.exports = router;
