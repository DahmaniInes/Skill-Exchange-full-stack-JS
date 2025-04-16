var express = require("express");
var bcrypt = require("bcryptjs");
var User = require("../Models/User");
const nodemailer = require("nodemailer");
var router = express.Router();
const verifyToken = require('../middleware/verifySession');


const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/login", async (req, res) => {
  console.log("Login request received");
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password || !user.salt) {
      console.error("User found but password or salt is missing for:", email);
      return res.status(500).json({ message: "Account error. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password + user.salt, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const token = jwt.sign({ userId: user._id, userRole: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: {
        isTOTPEnabled: user.isTOTPEnabled
      },
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout",verifyToken, (req, res) => {
  // Just inform the client to delete the token
  res.json({ message: "Logged out - Please remove the token from storage" });
});






// Get Authenticated User Profile
router.get("/profile", verifyToken, async (req, res) => {
  const user = await User.findById(req.userId); // Use `req.userId` from header
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
});

// User Registration
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ firstName, lastName, email, password: hashedPassword });
  await user.save();
  res.send("User registered successfully");
});

// Verify if session is active
router.get("/verify-session", verifyToken, (req, res) => {
  res.json({ success: true, message: "Session is active", userId: req.userId });
});

router.post("/request-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before using OTP login." });
    }

    // Check if a valid OTP is already in progress
    const now = new Date();
    if (user.otpHash && user.otpExpires && user.otpExpires > now) {
      return res.status(409).json({
        message: "An OTP has already been sent and is still valid. Please check your email or wait for it to expire.",
        expiresAt: user.otpExpires, // optional: for frontend countdown
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otpHash = otpHash;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0;
    await user.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your Login OTP",
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    };
    transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("OTP request error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});


router.post("/login-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpires) {
      return res.status(400).json({ message: "No active OTP found" });
    }

    if (new Date() > user.otpExpires) {
      user.otpHash = null;
      user.otpExpires = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: "OTP expired" });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otpHash);
    if (!isOtpValid) {
      user.otpAttempts += 1;

      // Invalidate OTP after 3 failed attempts
      if (user.otpAttempts >= 3) {
        user.otpHash = null;
        user.otpExpires = null;
        user.otpAttempts = 0;
        await user.save();
        return res.status(403).json({
          message: "Too many incorrect OTP attempts. OTP has been invalidated. Please request a new one.",
        });
      }

      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP success
    user.otpHash = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    const token = jwt.sign({ userId: user._id, userRole: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "OTP login successful", token, role: user.role });
  } catch (err) {
    console.error("OTP login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
