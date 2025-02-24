const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const sgMail = require('@sendgrid/mail'); // Import SendGrid
const dotenv = require("dotenv");

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Set API key

const router = express.Router();

// Send verification email
const sendVerificationEmail = (email, token) => {
  const verificationUrl = `http://localhost:5000/api/verify/${token}`;

  const msg = {
    to: email,
    from: 'hibalouhibii@gmail.com', // Use a verified SendGrid email
    subject: 'Verify Your Email Address',
    text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
    html: `<strong>Please verify your email by clicking on the following link: <a href="${verificationUrl}">${verificationUrl}</a></strong>`,
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log('Verification email sent to:', email);
    })
    .catch(error => {
      console.error('Error sending email:', error);
    });
};

// Sign-up route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "This email is already in use." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a verification token
  const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Create new user
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  await newUser.save();

  // Send verification email
  sendVerificationEmail(email, verificationToken);

  res.status(200).json({ message: "Signup successful. Please check your email for verification." });
});

// Verify email route
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  });
});

module.exports = router;
