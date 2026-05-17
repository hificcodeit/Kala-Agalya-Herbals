const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Admin authentication routes
router.post("/login", adminController.login);
router.post("/create", adminController.createAdmin);
router.post("/forgot-password", adminController.forgotPassword);
router.post("/reset-password", adminController.resetPassword);

module.exports = router;
