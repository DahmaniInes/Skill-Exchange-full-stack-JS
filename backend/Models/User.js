const mongoose = require("mongoose");
const validator = require('validator');

const UserSchema = new mongoose.Schema(
  {
    // Section 1 : Identité
    firstName: { 
      type: String, 
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le prénom ne peut dépasser 50 caractères']
    },
    lastName: { 
      type: String, 
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      maxlength: [50, 'Le nom ne peut dépasser 50 caractères']
    },
    email: {
      type: String,
      required: [true, 'L\'email est obligatoire'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Email invalide'],
      index: true
    },
    password: {
      type: String,
      required: true
    },
    salt: {
      type: String,
      required: true
    },

    // Section 2 : Authentification
    role: {
      type: String,
      enum: {
        values: ["super-admin", "admin", "user", "student", "teacher", "entrepreneur"],
        message: 'Rôle invalide'
      },
      default: "user"
    },
    verificationToken: { 
      type: String, 
      default: null 
    },
    authKeyTOTP: { 
      type: String,
      select: false
    },
    isTOTPEnabled: { 
      type: Boolean, 
      default: false 
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    otpHash: { 
      type: String, 
      default: null 
    },
    otpExpires: { 
      type: Date, 
      default: null 
    },
    otpAttempts: { 
      type: Number, 
      default: 0 
    },
    lastLogin: Date,

    // Section 3 : Profil public
    profilePicture: {
      type: String,
      default: "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg",
      validate: {
        validator: v => validator.isURL(v, { 
          protocols: ['http','https'],
          require_protocol: true,
          host_whitelist: ['res.cloudinary.com']
        }),
        message: 'URL Cloudinary invalide'
      }
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: 'Genre invalide'
      },
      default: "other"
    },
    bio: {
      type: String,
      maxlength: [500, 'La bio ne peut dépasser 500 caractères'],
      default: ""
    },
    location: {
      type: String,
      maxlength: [100, 'La localisation ne peut dépasser 100 caractères'],
      default: ""
    },
    phone: {
      type: String
    },

    // Section 4 : Carrière
    jobTitle: {
      type: String,
      maxlength: [100, 'Le titre ne peut dépasser 100 caractères'],
      default: ""
    },
    company: {
      type: String,
      maxlength: [100, 'Le nom de l\'entreprise ne peut dépasser 100 caractères'],
      default: ""
    },
    skills: [{
      name: {
        type: String,
        required: [true, 'Le nom de la compétence est obligatoire'],
        maxlength: [50, 'Le nom de la compétence ne peut dépasser 50 caractères']
      },
      level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner"
      },
      yearsOfExperience: {
        type: Number,
        min: [0, 'L\'expérience ne peut être négative'],
        max: [50, 'L\'expérience ne peut dépasser 50 ans'],
        default: 0
      }
    }],
    experiences: [{
      title: {
        type: String,
        required: [true, 'Le titre est obligatoire'],
        maxlength: [100, 'Le titre ne peut dépasser 100 caractères']
      },
      company: {
        type: String,
        required: [true, 'L\'entreprise est obligatoire'],
        maxlength: [100, 'Le nom de l\'entreprise ne peut dépasser 100 caractères']
      },
      startDate: {
        type: Date,
        required: [true, 'La date de début est obligatoire']
      },
      endDate: Date,
      description: {
        type: String,
        maxlength: [500, 'La description ne peut dépasser 500 caractères']
      }
    }],
    educations: [{
      school: {
        type: String,
        required: [true, 'L\'école est obligatoire'],
        maxlength: [150, 'Le nom de l\'école ne peut dépasser 150 caractères']
      },
      degree: {
        type: String,
        required: [true, 'Le diplôme est obligatoire'],
        maxlength: [100, 'Le diplôme ne peut dépasser 100 caractères']
      },
      fieldOfStudy: {
        type: String,
        maxlength: [100, 'Le domaine d\'étude ne peut dépasser 100 caractères']
      },
      startDate: {
        type: Date,
        required: [true, 'La date de début est obligatoire']
      },
      endDate: Date
    }],
    cv: {
      type: String
    },

    // Section 5 : Social
    socialLinks: {
      portfolio: {
        type: String,
        validate: [validator.isURL, 'URL de portfolio invalide']
      },
      github: {
        type: String,
        validate: [validator.isURL, 'URL GitHub invalide']
      },
      linkedin: {
        type: String,
        validate: [validator.isURL, 'URL LinkedIn invalide']
      },
      twitter: {
        type: String,
        validate: [validator.isURL, 'URL Twitter invalide']
      }
    },

    // Section 6 : Paramètres
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["public", "private", "connections-only"],
        default: "public"
      },
      contactVisibility: {
        type: Boolean,
        default: false
      }
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      app: {
        type: Boolean,
        default: true
      }
    },
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline"
    },

    // Section 7 : Audit
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    updatedAt: Date,
    deactivatedAt: Date
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
UserSchema.index({ firstName: 1, lastName: 1 });
UserSchema.index({ 'skills.name': 1 });

// Middleware de mise à jour automatique
UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", UserSchema);