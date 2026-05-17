const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const validatePassword = require("../utils/validatePassword");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// --------------------------------------------------------------------------
// Google OAuth
// --------------------------------------------------------------------------
// @desc    Google OAuth
// @route   POST /api/users/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        provider: "google",
        isGoogleUser: true
      });
    } else {
      // Merge logic: Update existing user to Google user
      user.isGoogleUser = true;
      user.provider = "google";
      // Only update avatar if not already set (or prioritize Google)
      if (!user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isGoogleUser: user.isGoogleUser,
        role: user.role
      },
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(400).json({ success: false, message: "Google authentication failed" });
  }
};

// --------------------------------------------------------------------------
// Registration
// --------------------------------------------------------------------------
// @desc    Register user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    // Validate password policy on registration
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordCheck.errors,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    let avatar = undefined;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      avatar = `data:${req.file.mimetype};base64,${b64}`;
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      avatar
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: signToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isGoogleUser: user.isGoogleUser
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "User already exists with this email or phone" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// --------------------------------------------------------------------------
// Login
// --------------------------------------------------------------------------
// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
exports.authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        token: signToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isGoogleUser: user.isGoogleUser
        },
      });
    } else {
      // Intentionally vague message to prevent user enumeration
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------------------------------
// Profile
// --------------------------------------------------------------------------
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      res.json({
        success: true,
        user
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      if (req.body.address) {
        try {
          // Handle stringified address if coming from FormData
          const address = typeof req.body.address === 'string' 
            ? JSON.parse(req.body.address) 
            : req.body.address;
          user.address = { ...user.address, ...address };
        } catch (e) {
          console.error("Error parsing address:", e);
        }
      }
      
      if (req.file) {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const b64Avatar = `data:${req.file.mimetype};base64,${b64}`;
        console.log("Replacing avatar with base64 string");
        user.avatar = b64Avatar;
      } else {
        console.log("No file received in request");
      }

      if (req.body.password) {
        // Enforce password policy on profile updates too
        const passwordCheck = validatePassword(req.body.password);
        if (!passwordCheck.valid) {
          return res.status(400).json({
            success: false,
            message: "Password does not meet security requirements",
            errors: passwordCheck.errors,
          });
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          isGoogleUser: updatedUser.isGoogleUser
        },
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------------------------------
// Forgot Password — Generates Cryptographically Secure Reset Token
// --------------------------------------------------------------------------
// @desc    Request password reset via email link
// @route   POST /api/users/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Return success even if user not found — prevents user enumeration attacks
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // 1. Generate a cryptographically secure random token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash the token before storing in DB (so even if DB is compromised, tokens are safe)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Store hashed token + expiry (5 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;

    // Clear any leftover OTP fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save({ validateBeforeSave: false });

    // 4. Build the reset URL (raw token goes in the link, NOT the hashed one)
    const clientBaseUrl = process.env.CLIENT_URL;
    const resetUrl = `${clientBaseUrl}/reset-password/${resetToken}`;

    // 5. Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️  EMAIL NOT CONFIGURED - Cannot send reset email");
      return res.status(500).json({
        success: false,
        message: "Email service is not configured. Please contact support.",
      });
    }

    // 6. Send the reset email
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request — Kala Agalya Herbals",
        message: `You requested a password reset for your Kala Agalya Herbals account. Please click the button in the HTML version of this email or use the provided link to set a new password.\n\nThis link expires in 5 minutes. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0b03; border: 1px solid #78350f; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #78350f 0%, #451a03 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #fbbf24; font-size: 24px; margin: 0 0 8px 0; letter-spacing: 2px;">KALA AGALYA HERBALS</h1>
              <p style="color: #d4a050; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 3px;">Password Reset Request</p>
            </div>
            <div style="padding: 32px 24px;">
              <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Hello <strong style="color: #fbbf24;">${user.name}</strong>,
              </p>
              <p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to reset the password for your account. Click the button below to create a new password:
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ca8a04, #b45309); color: #000; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; padding: 16px 48px; border-radius: 12px; text-decoration: none;">
                  Reset Password
                </a>
              </div>
              <div style="background: #1a1408; border: 1px solid #78350f33; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">⏱ This link expires in <strong style="color: #fbbf24;">5 minutes</strong></p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">🔒 If you didn't request this, please ignore this email. Your account is safe.</p>
              </div>
            </div>
            <div style="background: #0a0804; padding: 16px 24px; text-align: center; border-top: 1px solid #78350f33;">
              <p style="color: #4b5563; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
                Protected • Encrypted • Secure
              </p>
            </div>
          </div>
        `,
      });

      res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (emailErr) {
      // If email fails, clean up the token from the database
      console.error("Password reset email failed:", emailErr);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, message: "Email could not be sent. Please try again later." });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------------------------------
// Reset Password — Token-Based with Password Policy Enforcement
// --------------------------------------------------------------------------
// @desc    Reset password using the token from the email link
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  const { password } = req.body;

  // 1. Validate the raw token parameter exists
  if (!req.params.resettoken) {
    return res.status(400).json({ success: false, message: "Reset token is required" });
  }

  // 2. Enforce password policy
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({
      success: false,
      message: "Password does not meet security requirements",
      errors: passwordCheck.errors,
    });
  }

  // 3. Hash the incoming raw token to match the stored hashed version
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  try {
    // 4. Find user with matching token AND token must not be expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please request a new password reset link.",
      });
    }

    // 5. Set the new password (will be hashed by the pre-save hook in User model)
    user.password = password;

    // 6. Destroy the token immediately — single use only
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------------------------------
// Legacy OTP-based routes (kept for backward compatibility)
// --------------------------------------------------------------------------
// @desc    Verify OTP
// @route   POST /api/users/verifyotp
// @access  Public
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    res.status(200).json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Reset password (OTP context)
// @route   POST /api/users/resetpasswordotp
// @access  Public
exports.resetPasswordOTP = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired session" });
    }

    // Enforce password policy
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordCheck.errors,
      });
    }

    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      token: signToken(user._id),
      message: "Password reset successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------------------------------
// Admin
// --------------------------------------------------------------------------
// @desc    Get all users (for Admin)
// @route   GET /api/users/admin/all
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort("-createdAt");
    console.log("Admin fetching users. Avatars found:", users.map(u => u.avatar));
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
