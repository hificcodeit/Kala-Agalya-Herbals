const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/users");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config (Memory Storage for Base64)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public
router.post("/register", upload.single("avatar"), userController.registerUser);
router.post("/login", userController.authUser);
router.post("/google", userController.googleAuth);
router.post("/forgotpassword", userController.forgotPassword);
router.post("/verifyotp", userController.verifyOTP);
router.post("/resetpasswordotp", userController.resetPasswordOTP);
router.put("/resetpassword/:resettoken", userController.resetPassword);

// Private
router.get("/profile", userAuth, userController.getUserProfile);
router.put("/profile", userAuth, upload.single("avatar"), userController.updateUserProfile);

// Admin only
router.get("/admin/all", adminAuth, userController.getAllUsers);

module.exports = router;
