const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["super-admin", "admin", "user"], 
      default: "user" 
    },
    phone: { type: String, default: null },
    profilePicture: { type: String, default: null }, // URL de l'image
    skills: [{ type: String }], // Liste de compétences
    bio: { type: String, default: "" }, // Courte description
    location: { type: String, default: "" }, // Ville/Pays
    isActive: { type: Boolean, default: true }, // Statut de l'utilisateur
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", nouussaTest);