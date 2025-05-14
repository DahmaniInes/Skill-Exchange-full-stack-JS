const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  categories: [{ 
    type: String, 
    required: true, 
    enum: [
      "Development", 
      "Design", 
      "Marketing", 
      "Business", 
      "Languages", 
      "Music", 
      "Art", 
      "Science", 
      "Technology",
      "Health",
      "Education",
      "Sports",
      "Other"
    ] 
  }],
  level: { type: String, required: true, enum: ["Beginner", "Intermediate", "Advanced"] },
  popularity: { type: Number, default: 0 },
  tags: [{ type: String }],
  imageUrl: { type: String, required: true },
  videoUrl: { type: String }, 
  estimatedTimeHours: { type: Number, default: 10 }, 
  learningOutcomes: [{ type: String }], 
  topics: [{ type: String }], 
  resources: [{ 
    type: { type: String }, 
    link: { type: String }, 
    title: { type: String } 
  }], // Ressources
  relatedSkills: [{ 
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }, 
    name: { type: String }, 
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"] } 
  }], // Compétences liées
  prerequisites: [{ type: String }], // Prérequis
  preparationSteps: [{ 
    title: { type: String }, 
    description: { type: String } 
  }], // Étapes de préparation
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Référence à l'utilisateur
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  rating: { type: Number, default: 0 }, // Note moyenne
  createdAt: { type: Date, default: Date.now, immutable: true } // Date de création
});

module.exports = mongoose.model('Skill', SkillSchema);