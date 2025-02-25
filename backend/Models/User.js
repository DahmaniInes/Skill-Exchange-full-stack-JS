const mongoose = require('mongoose');



const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["super-admin", "admin", "user"], default: "user" },
    phone: { type: String, default: null },
    profilePicture: { type: String, default: null },
    skills: [{ type: String }],
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },  // Ajout du champ pour la vérification de l'email
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
