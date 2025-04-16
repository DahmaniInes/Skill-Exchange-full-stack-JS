const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Add this line
const roadmapController = require('../Controllers/roadmapController');
const verifySession = require("../middleware/verifySession");

// Déplacer la route POST en premier
router.post('/generate', verifySession, roadmapController.generatePersonalizedRoadmap);

// Ajouter une vérification de paramètre pour les IDs
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID invalide' });
  }
  next();
});

// Restructuration des routes
router.get('/by-skill/:skillId', verifySession, roadmapController.getRoadmapBySkillId);
router.get('/user/:userId', verifySession, roadmapController.getUserRoadmaps);
router.get('/:id', verifySession, roadmapController.getRoadmapById);
router.put('/:id/update-with-feedback', verifySession, roadmapController.updateRoadmapWithAIFeedback);
router.put('/:id/update-step/:stepIndex', verifySession, roadmapController.updateRoadmapStep);

module.exports = router;