const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../Models/User");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

// Configurer Nodemailer avec votre mot de passe d'application
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fonction pour envoyer l'email de vérification
const sendVerificationEmail = (email, token) => {
  const verificationUrl = `http://localhost:5000/api/verify/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Please verify your email address",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verificationUrl}">${verificationUrl}</a>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending email:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

// Route d'inscription
const validRoles = ["student", "teacher"];

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // ✅ Validate role
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Role must be either 'student' or 'teacher'." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must contain uppercase, lowercase, a number, a special character, and be at least 8 characters long." });
    }

    // Generate a unique salt
    const salt = crypto.randomBytes(16).toString("hex");

    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password + salt, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      salt,
      role,
      verificationToken,
    });

    await newUser.save();

    sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: "Signup successful. Please check your email for verification." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Route de vérification de l'email
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    user.isVerified = true;
    user.verificationToken = null; // Invalider le token
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
