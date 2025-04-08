const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    categories: [{ 
        type: String, 
        required: true, 
        enum: ["Développement", "Design", "Marketing", "Business", "Langues", "Musique", "Art", "Science", "Autres"] 
    }], // Plusieurs catégories possibles
    level: { type: String, required: true, enum: ["Débutant", "Intermediate", "Advanced"] },
    popularity: { type: Number, default: 0 },
    tags: [{ type: String }],
    imageUrl: { type: String, required: true }, // Image pour chaque skill
    ratings: [{ userId: String, rating: Number, comment: String }],
    rating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Skill', SkillSchema);
