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
            "Technology", // Added
            "Health",      // Added
            "Education",   // Added
            "Sports",      // Added
            "Other" 
        ] 
    }], // Multiple categories possible
    level: { type: String, required: true, enum: ["Beginner", "Intermediate", "Advanced"] },
    popularity: { type: Number, default: 0 },
    tags: [{ type: String }],
    imageUrl: { type: String, required: true }, // Image for each skill
    ratings: [{ userId: String, rating: Number, comment: String }],
    rating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Skill', SkillSchema);