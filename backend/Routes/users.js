var express = require("express");
var bcrypt = require("bcryptjs");
var User = require("../Models/User");

var router = express.Router();
const verifyToken = require('../middleware/verifySession');


const jwt = require('jsonwebtoken');

router.post("/login", async (req, res) => {
  console.log("Login request received");
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  if (!user.password) {
    console.error("User found but password is undefined for email:", email);
    return res.status(500).json({ message: "Account error. Please contact support." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Create a JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // Send token in response
  res.json({ message: "Login successful", token, user: { isTOTPEnabled: user.isTOTPEnabled }});
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

module.exports = router;
