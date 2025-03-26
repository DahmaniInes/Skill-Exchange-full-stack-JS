const express = require("express");
const {
  getUserProfile,
  updateProfile,
  updatePassword,
  uploadCV,
  deleteCV,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  addSkill,
  deleteSkill,
  updatePrivacySettings,
  getProfileRecommendations
} = require("../Controllers/profileController");

const { register } = require("../Controllers/register");
const { login } = require("../Controllers/login");
const { upload } = require("../Config/multerConfig");
const authMiddleware = require("../middleware/authMiddleware");
const verifySession = require("../middleware/verifySession");

const router = express.Router();

// Routes existantes
router.get("/me", verifySession, getUserProfile);
router.put("/me/password", authMiddleware, updatePassword);
router.put("/profile", authMiddleware, upload.single("profilePicture"), updateProfile);

// Routes CV
router.post("/upload-cv", authMiddleware, upload.single("cv"), uploadCV);
router.delete("/delete-cv", authMiddleware, deleteCV);

// Routes d'authentification
router.post("/register", register);
router.post("/login", login);

// Nouvelles routes pour expériences
router.post("/experiences", authMiddleware, addExperience);
router.delete("/experiences/:experienceId", authMiddleware, deleteExperience);

// Nouvelles routes pour formations
router.post("/educations", authMiddleware, addEducation);
router.delete("/educations/:educationId", authMiddleware, deleteEducation);

// Nouvelles routes pour compétences
router.post("/skills", authMiddleware, addSkill);
router.delete("/skills/:skillId", authMiddleware, deleteSkill);

// Routes pour les paramètres de confidentialité et recommandations
router.put("/privacy-settings", authMiddleware, updatePrivacySettings);
router.get("/profile-recommendations", authMiddleware, getProfileRecommendations);

module.exports = router;