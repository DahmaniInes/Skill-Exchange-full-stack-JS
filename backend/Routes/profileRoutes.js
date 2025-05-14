const express = require("express");
const router = express.Router();
const profileController = require("../Controllers/profileController");
const verifySession = require("../middleware/verifySession");

// Importez l'instance Multer pour les photos de profil
const { uploadProfile } = require("../middleware/upload");

// Ajouter un log pour vérifier l'importation
console.log("Imported uploadProfile:", uploadProfile);

router.get("/me", verifySession, profileController.getUserProfile); // Récupérer le profil
router.put(
  "/",
  verifySession,
  uploadProfile.single("profilePicture"), // Upload de profilePicture via Cloudinary
  profileController.updatePersonalInfo
); // Mettre à jour les informations personnelles (y compris socialLinks)
router.put("/password", verifySession, profileController.updatePassword); // Mettre à jour le mot de passe
router.post("/validate-password", verifySession, profileController.validatePassword); // Valider le mot de passe

// Routes pour gérer les compétences
router.get("/skills", verifySession, profileController.getSkills); // Récupérer les compétences
router.post("/skills", verifySession, profileController.addSkill); // Ajouter une compétence
router.delete("/skills/:skillId", verifySession, profileController.deleteSkill); // Supprimer une compétence

// Routes pour gérer les expériences
router.post("/experiences", verifySession, profileController.addExperience); // Ajouter une expérience
router.delete("/experiences/:experienceId", verifySession, profileController.deleteExperience); // Supprimer une expérience

// Routes pour gérer les formations
router.post("/educations", verifySession, profileController.addEducation); // Ajouter une formation
router.delete("/educations/:educationId", verifySession, profileController.deleteEducation); // Supprimer une formation

// Routes pour les paramètres de confidentialité et notifications
router.put("/privacy-settings", verifySession, profileController.updatePrivacySettings); // Mettre à jour les paramètres de confidentialité
router.put("/notifications", verifySession, profileController.updateNotificationPreferences); // Mettre à jour les préférences de notifications

// Route pour les recommandations de profil
router.get("/profile-recommendations", verifySession, profileController.getProfileRecommendations); // Récupérer les recommandations

module.exports = router;