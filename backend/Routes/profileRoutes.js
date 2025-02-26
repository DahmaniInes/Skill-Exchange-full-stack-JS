const express = require("express");
const {
  getUserProfile,
  updateProfile,
  updatePassword,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  updateSocialLinks,
  updateSkills,
  uploadCV, // Gardé une seule fois
  addRating,
  toggleProfilePrivacy,
  getPublicProfile
} = require("../Controllers/profileController");
const { register} = require("../Controllers/register");
const { login} = require("../Controllers/login");

const authMiddleware = require("../middleware/authMiddleware");
const { uploadImage, uploadCV: uploadMulterCV } = require("../middleware/uploadMiddleware"); // Assurez-vous d'importer les bons middlewares

const router = express.Router();

// 📌 Routes protégées par `authMiddleware`
router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, uploadImage.single("profilePicture"), updateProfile);
router.put("/me/password", authMiddleware, updatePassword);
router.put("/me/privacy", authMiddleware, toggleProfilePrivacy);
router.put("/profile", authMiddleware, uploadImage.single("profilePicture"), updateProfile);

//  Route publique pour consulter un profil
router.get("/public/:id", getPublicProfile);

//  Route pour uploader un CV
router.post("/upload-cv", authMiddleware, uploadMulterCV.single("cv"), uploadCV);
// Route d'inscription
router.post('/register', register);

// Route de connexion
router.post('/login', login);

module.exports = router;
