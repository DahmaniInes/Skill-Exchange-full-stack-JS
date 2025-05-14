const express = require("express");
const router = express.Router();
const skillController = require("../Controllers/skillController");
const verifySession = require("../middleware/verifySession");
const { uploadSkill } = require("../middleware/upload");

// Ajouter un log pour vérifier l'importation
console.log("Imported uploadSkill:", uploadSkill);

// ------------------------- Routes publiques (sans authentification) -------------------------

// GET - Récupérer des données sur les compétences
router.get("/", skillController.getAllSkills); // Récupérer toutes les compétences
router.get("/available", skillController.getAvailableSkills); // Récupérer les compétences disponibles
router.get("/search", skillController.searchSkills); // Rechercher des compétences (auto-complétion)
router.get("/filter", skillController.getSkills); // Récupérer les compétences avec filtres et tri
router.get("/discussions/:skillId", skillController.getDiscussions); // Récupérer les discussions liées à une compétence

// GET - Routes spécifiques (avant les routes paramétrées)
router.get("/categories", verifySession, skillController.getCategories); // Récupérer les catégories disponibles

// GET - Routes paramétrées (placées après les routes spécifiques)
router.get("/:id", skillController.getSkillById); // Récupérer une compétence par ID

// ------------------------- Routes privées (avec authentification) -------------------------

// GET - Récupérer des données utilisateur spécifiques
router.get("/bookmark", verifySession, skillController.getBookmarks);
router.get("/complementary", verifySession, skillController.getComplementarySkills); // Récupérer les compétences complémentaires
router.get("/progress/:skillId", verifySession, skillController.getUserProgress); // Récupérer la progression d'un utilisateur pour une compétence
router.get("/roadmap/:skillId", verifySession, skillController.getRoadmapBySkill); // Récupérer une feuille de route pour une compétence

// POST - Créer ou ajouter des données
router.post(
  "/",
  verifySession,
  uploadSkill.single("image"), // Utilisation de uploadSkill pour les images des compétences
  skillController.createSkill
); // Créer une nouvelle compétence
router.post("/bookmark", verifySession, skillController.addBookmark);
router.post("/:id/rate", verifySession, skillController.rateSkill); // Noter une compétence
router.post("/:id/reviews/:reviewId/reply", verifySession, skillController.replyToReview); // Répondre à un avis
router.post("/discussions/:skillId", verifySession, (req, res, next) => {
  console.log(`Reached POST /discussions/:skillId route for skillId: ${req.params.skillId}`);
  next();
}, skillController.addDiscussion); // Ajouter une discussion pour une compétence

// PUT - Mettre à jour des données
router.put("/:id", verifySession, skillController.updateSkill); // Mettre à jour une compétence
router.put("/progress/:skillId", verifySession, skillController.updateUserProgress); // Mettre à jour la progression d'un utilisateur pour une compétence

// DELETE - Supprimer des données
router.delete("/bookmark", verifySession, skillController.removeBookmark);
router.delete("/:id", verifySession, skillController.deleteSkill); // Supprimer une compétence

module.exports = router;