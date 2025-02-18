// authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../Models/User");
const router = express.Router();

// Route for sign-up
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Check if the email is already used
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "This email is already in use." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  await newUser.save();
  res.status(200).json({ message: "Signup successful." });
});

module.exports = router;
