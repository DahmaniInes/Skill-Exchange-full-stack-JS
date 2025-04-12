const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Le titre est requis"],
    trim: true,
    maxlength: [100, "Le titre ne peut pas dépasser 100 caractères"]
  },
  content: {
    type: String,
    required: [true, "Le contenu est requis"],
    trim: true,
    maxlength: [500, "Le contenu ne peut pas dépasser 500 caractères"]
  },
  media: {  // Changed from 'image' to 'media' to be more generic
    type: String,
    required: [true, "Un média (image ou vidéo) est requis pour la story"]
  },
  mediaType: {  // New field to distinguish between image and video
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "L'ID de l'utilisateur est requis"]
  },
  userName: {
    type: String,
    required: [true, "Le nom de l'utilisateur est requis"]
  },
  userImage: {
    type: String,
    default: "/default-user.png"
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: [true, "L'ID de la compétence est requis"]
  },
  skillName: {
    type: String,
    required: [true, "Le nom de la compétence est requis"]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Les stories expirent après 24 heures
    expires: 60 * 60 * 24
  },
  views: {
    type: Number,
    default: 0
  }
});

// Index pour rechercher les stories par utilisateur et par date
StorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Story", StorySchema);