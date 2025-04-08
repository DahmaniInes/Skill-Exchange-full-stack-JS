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
  getProfileRecommendations,
  validatePassword
} = require("../Controllers/profileController");

const { register } = require("../Controllers/register");
const { login } = require("../Controllers/login");
const { upload } = require("../Config/multerConfig");
const verifySession = require("../middleware/verifySession");

const router = express.Router();

// Routes existantes
router.get("/me", verifySession, getUserProfile);
router.put("/me/password", verifySession, updatePassword);
router.put("/profile", verifySession, upload.single("profilePicture"), updateProfile);
router.post("/me/validate-password", verifySession, validatePassword);
// Routes CV
router.post("/upload-cv", verifySession, upload.single("cv"), uploadCV);
router.delete("/delete-cv", verifySession, deleteCV);

// Routes d'authentification
router.post("/register", register);
router.post("/login", login);

// Nouvelles routes pour expériences
router.post("/experiences", verifySession, addExperience);
router.delete("/experiences/:experienceId", verifySession, deleteExperience);

// Nouvelles routes pour formations
router.post("/educations", verifySession, addEducation);
router.delete("/educations/:educationId", verifySession, deleteEducation);

// Nouvelles routes pour compétences
router.post("/skills", verifySession, addSkill);
router.delete("/skills/:skillId", verifySession, deleteSkill);

// Routes pour les paramètres de confidentialité et recommandations
router.put("/privacy-settings", verifySession, updatePrivacySettings);
router.get("/profile-recommendations", verifySession, getProfileRecommendations);

module.exports = router;