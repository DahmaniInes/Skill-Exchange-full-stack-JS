const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const roadmapController = require('../Controllers/roadmapController');
const verifySession = require("../middleware/verifySession");

// Vérification des paramètres pour les IDs
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID invalide' });
  }
  next();
});

router.param('skillId', (req, res, next, skillId) => {
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    return res.status(400).json({ success: false, message: 'Skill ID invalide' });
  }
  next();
});

router.param('userId', (req, res, next, userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'User ID invalide' });
  }
  next();
});

router.param('stepIndex', (req, res, next, stepIndex) => {
  const stepIndexNum = parseInt(stepIndex, 10);
  if (isNaN(stepIndexNum) || stepIndexNum < 0) {
    return res.status(400).json({ success: false, message: 'Index d\'étape invalide' });
  }
  req.stepIndex = stepIndexNum; // Stocker la valeur convertie pour une utilisation ultérieure
  next();
});

// Routes pour les roadmaps
router.post('/generate', verifySession, roadmapController.generatePersonalizedRoadmap); // Générer une roadmap
router.get('/by-skill/:skillId', verifySession, roadmapController.getRoadmapBySkillId); // Récupérer une roadmap par skillId
router.get('/user', verifySession, roadmapController.getUserRoadmaps); // Récupérer toutes les roadmaps d'un utilisateur
router.get('/:id', verifySession, roadmapController.getRoadmapById); // Récupérer une roadmap par ID
router.put('/:id/update-with-feedback', verifySession, roadmapController.updateRoadmapWithAIFeedback); // Mettre à jour une roadmap avec feedback
router.put('/:id/update-step/:stepIndex', verifySession, roadmapController.updateRoadmapStep); // Mettre à jour une étape d'une roadmap
router.delete('/:id', verifySession, roadmapController.deleteRoadmap); // Supprimer une roadmap

module.exports = router;