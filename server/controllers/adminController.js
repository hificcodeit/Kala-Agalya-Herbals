const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Admin Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    
    // If password doesn't match
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      success: true,
      token: generateToken(admin._id),
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create Admin (for initial setup)
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      email,
      password: hashedPassword,
      name
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      token: generateToken(admin._id),
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin Forgot Password — Sends 6-digit OTP to admin email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      // Return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "If an admin account exists with that email, an OTP has been sent.",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash OTP before storing
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    // Store hashed OTP + 5 min expiry
    admin.resetPasswordOTP = hashedOTP;
    admin.resetPasswordOTPExpires = Date.now() + 5 * 60 * 1000;
    await admin.save();

    // Send OTP via email
    try {
      await sendEmail({
        email: admin.email,
        subject: "Admin Password Reset OTP — Kala Agalya Herbals",
        message: `Your admin password reset OTP is: ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0d0b03; border: 1px solid #78350f; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #78350f 0%, #451a03 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #fbbf24; font-size: 22px; margin: 0 0 8px 0; letter-spacing: 2px;">ADMIN PASSWORD RESET</h1>
              <p style="color: #d4a050; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 3px;">Kala Agalya Herbals</p>
            </div>
            <div style="padding: 32px 24px; text-align: center;">
              <p style="color: #d1d5db; font-size: 15px; margin: 0 0 24px 0;">
                Hello <strong style="color: #fbbf24;">${admin.name}</strong>, use the OTP below to reset your password:
              </p>
              <div style="background: #1a1408; border: 2px solid #78350f; border-radius: 12px; padding: 24px; margin: 24px 0; display: inline-block;">
                <span style="font-size: 36px; font-weight: 900; color: #fbbf24; letter-spacing: 8px; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">⏱ This OTP expires in <strong style="color: #fbbf24;">5 minutes</strong></p>
              <p style="color: #6b7280; font-size: 11px; margin: 8px 0 0 0;">🔒 If you didn't request this, please secure your account immediately.</p>
            </div>
            <div style="background: #0a0804; padding: 16px 24px; text-align: center; border-top: 1px solid #78350f33;">
              <p style="color: #4b5563; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Protected • Encrypted • Secure</p>
            </div>
          </div>
        `,
      });

      res.status(200).json({
        success: true,
        message: "If an admin account exists with that email, an OTP has been sent.",
      });
    } catch (emailErr) {
      console.error("Admin reset email failed:", emailErr);
      admin.resetPasswordOTP = undefined;
      admin.resetPasswordOTPExpires = undefined;
      await admin.save();
      return res.status(500).json({ success: false, message: "Email could not be sent. Please try again." });
    }
  } catch (error) {
    console.error("Admin forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Admin Reset Password — Verifies OTP and sets new password
exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  try {
    // Hash the incoming OTP to compare
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordOTP: hashedOTP,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new one." });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    admin.resetPasswordOTP = undefined;
    admin.resetPasswordOTPExpires = undefined;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
