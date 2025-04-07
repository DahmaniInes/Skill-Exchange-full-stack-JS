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
// URLs des avatars par défaut selon le genre
const DEFAULT_AVATARS = {
  male: "https://res.cloudinary.com/diahyrchf/image/upload/v1743254777/male-avatar_nbdjlv.jpg",
  female: "https://res.cloudinary.com/diahyrchf/image/upload/v1743116481/female-avatar_t28htw.jpg",
  default: "https://res.cloudinary.com/diahyrchf/image/upload/v1234567890/user-avatars/default-avatar.jpg"
};

// Vérification des URL
const isValidURL = (url) => {
  const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
  return !url || urlRegex.test(url);
};

// Route d'inscription (signup)
router.post("/signup", async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, phone, bio, location, role, gender,
      profilePicture, jobTitle, company, university, degree, cv, skills, experience, education, socialLinks
    } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    // Valider le mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase, a number, a special character, and be at least 8 characters long."
      });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un token de vérification d'email
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Vérifier les liens sociaux
    if (socialLinks) {
      for (const key in socialLinks) {
        if (!isValidURL(socialLinks[key])) {
          return res.status(400).json({ message: `Invalid URL for ${key}` });
        }
      }
    }

    // Vérifier l'image de profil et appliquer l'avatar par défaut selon le genre
    let validProfilePicture;
    if (profilePicture && isValidURL(profilePicture)) {
      validProfilePicture = profilePicture;
    } else {
      validProfilePicture = gender === "female" ? DEFAULT_AVATARS.female 
                        : gender === "male" ? DEFAULT_AVATARS.male 
                        : DEFAULT_AVATARS.default;
    }

    // Vérifier le CV
    const validCV = cv && isValidURL(cv) ? cv : null;

    // Création du nouvel utilisateur
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || null,
      bio: bio || "",
      location: location || "",
      role: role || "user",
      gender: gender || "other", // Valeur par défaut si non spécifié
      profilePicture: validProfilePicture,
      jobTitle: jobTitle || "",
      company: company || "",
      university: university || "",
      degree: degree || "",
      cv: validCV,
      isVerified: false,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      socialLinks: socialLinks || {},
    });

    await newUser.save();

    // Envoyer l'email de vérification
    sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: "Signup successful. Please check your email for verification." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during signup." });
  }
});
module.exports = router;
