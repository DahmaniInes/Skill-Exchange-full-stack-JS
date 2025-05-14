const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, default: "2 semaines" },
  resources: [String],
  progressIndicators: [String],
  completed: { type: Boolean, default: false },
  notes: { type: String, default: '' }, // Champ pour les notes
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Step' }], // Dépendances entre étapes
});

const RoadmapSchema = new mongoose.Schema({
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: "Roadmap personnalisée" },
  description: { type: String, default: "Parcours d'apprentissage personnalisé" },
  steps: [StepSchema], // Utilisation du sous-schéma pour les étapes
  overallProgress: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);