
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Informations personnelles
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["super-admin", "admin", "user"], default: "user" },
    phone: { type: String, default: null },
    profilePicture: { type: String, default: null },
    skills: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },  // Ajout du champ pour la vérification de l'email
    createdAt: { type: Date, default: Date.now },
    authKeyTOTP: { type: String, required: false }, // Clé secrète TOTP
    isTOTPEnabled: { type: Boolean, default: false }, // Indique si TOTP est activé
    phone: { type: String, default: null },
    profilePicture: {
      type: String,
      default: "https://res.cloudinary.com/...",
      validate: {
        validator: v => v.startsWith('https://res.cloudinary.com/diahyrchf/'),
        message: "URL d'avatar invalide"
      }
    },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    // Informations professionnelles & académiques
    jobTitle: { type: String, default: "" }, // Poste actuel
    company: { type: String, default: "" }, // Entreprise actuelle
    university: { type: String, default: "" }, // Université fréquentée
    degree: { type: String, default: "" }, // Diplôme obtenu
    experience: [
      {
        title: { type: String, required: true }, // Titre du poste
        company: { type: String, required: true }, // Entreprise
        startDate: { type: Date, required: true }, // Date de début
        endDate: { type: Date }, // Date de fin (peut être null si encore en poste)
        description: { type: String }, // Détails du poste
      },
    ],
    education: [
      {
        school: { type: String, required: true }, // Nom de l'école/université
        degree: { type: String, required: true }, // Diplôme obtenu
        fieldOfStudy: { type: String }, // Domaine d'études
        startDate: { type: Date, required: true },
        endDate: { type: Date },
      },
    ],

    // Liens vers d'autres plateformes
    socialLinks: {
      portfolio: { type: String, default: null },
      github: { type: String, default: null },
      linkedin: { type: String, default: null },
      twitter: { type: String, default: null },
    },
    

    //  Gestion des compétences
    skills: [
      {
        name: { type: String, required: true }, // Nom de la compétence
        level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" }, // Niveau
        yearsOfExperience: { type: Number, default: 0 }, // Années d'expérience
      },
    ],

    // CV uploadé
    cv: { type: String, default: null }, // Lien du CV

    // Système de notation & feedback
    ratings: [
      {
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Qui a laissé l'avis
        rating: { type: Number, min: 1, max: 5, required: true }, // Note sur 5 étoiles
        comment: { type: String }, // Commentaire
        date: { type: Date, default: Date.now },
      },
    ],
    averageRating: { type: Number, default: 0 }, // Moyenne des notes

    //  Paramètres de confidentialité
    privacySettings: { 
      isProfilePublic: { type: Boolean, default: true } 
    },
    role: {
      type: String,
      enum: {
        values: ["super-admin", "admin", "user", "student", "teacher"],
        message: 'Rôle invalide'
      },
      default: "user"
    },

    // Notifications personnalisables
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      appNotifications: { type: Boolean, default: true },
      newMessages: { type: Boolean, default: true },
      skillRequests: { type: Boolean, default: true },
      profileViews: { type: Boolean, default: false },
    },

    //  Statut en ligne
    status: { type: String, enum: ["online", "offline", "away"], default: "offline" },




    // Nouveau champ : Liste des professeurs ayant payé (pour user et student uniquement)
    purchasedTeachers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
      validate: {
        validator: function (v) {
          // Autoriser ce champ uniquement pour les rôles "user" et "student"
          return (
            (this.role === "user" || this.role === "student") &&
            Array.isArray(v)
          );
        },
        message:
          "Le champ purchasedTeachers est réservé aux rôles 'user' et 'student'",
      },
    },
  },
  { timestamps: true } // Ajoute automatiquement createdAt et updatedAt

);

module.exports = mongoose.model("User", UserSchema);