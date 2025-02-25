const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
    pass: process.env.EMAIL_PASS, // Utilisez le mot de passe d'application ici
  },
});

// Fonction pour envoyer l'email de vérification
const sendVerificationEmail = (email, token) => {
  const verificationUrl = `http://localhost:5000/api/verify/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Please verify your email address",
    text: `Click on the link to verify your email: ${verificationUrl}`,
    html: `<p>Click on the link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
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
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Vérifier si l'email existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "This email is already in use." });
  }

  // Valider le mot de passe (doit avoir des majuscules, des minuscules, des chiffres, et être plus de 8 caractères)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: "Password must contain uppercase, lowercase, a number, a special character, and be at least 8 characters long." });
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);

  // Créer un token de vérification
  const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Créer un nouvel utilisateur
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });

  await newUser.save();

  // Envoyer l'email de vérification
  sendVerificationEmail(email, verificationToken);

  res.status(200).json({ message: "Signup successful. Please check your email for verification." });
});

// Route de vérification de l'email
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;

  // Vérifier le token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Marquer l'utilisateur comme vérifié
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  });
});

module.exports = router;
