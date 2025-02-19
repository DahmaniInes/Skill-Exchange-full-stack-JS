const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: [/^\S+@\S+\.\S+$/, "Veuillez entrer un email valide"]
    },
    password: { 
      type: String, 
      required: true, 
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"] 
    },
    profilePicture: { type: String, default: "" }, // URL de l’image
    location: { type: String, default: "" },
    bio: { type: String, default: "" },

    // Compétences actuelles
    skills: [
      {
        name: { type: String, required: true },
        level: { type: String, enum: ["Débutant", "Intermédiaire", "Expert"], required: true }
      }
    ],

    // Compétences souhaitées
    desiredSkills: [
      {
        name: { type: String, required: true },
        priority: { type: String, enum: ["Faible", "Moyen", "Urgent"], required: true }
      }
    ],

    // Préférences d'apprentissage
    learningPreferences: {
      availability: [{ type: String, trim: true }], // Ex: ["Weekends", "Soirées"]
      format: { type: String, enum: ["En ligne", "En personne"], default: "En ligne" }
    },

    // Paramètres de confidentialité
    privacySettings: {
      isProfilePublic: { type: Boolean, default: true },
      hideEmail: { type: Boolean, default: false },
      hideLocation: { type: Boolean, default: false }
    },

    // Compte de paiement lié (Stripe, PayPal, etc.)
    linkedPaymentAccount: { type: String, default: "" },

    // Sécurité
    twoFactorAuthEnabled: { type: Boolean, default: false }
  },
  { timestamps: true } // Gère `createdAt` et `updatedAt` automatiquement
);

module.exports = mongoose.model("User", UserSchema);
