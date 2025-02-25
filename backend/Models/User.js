const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: null },
    profilePicture: { type: String, default: null }, // Image de profil
    skills: [{ type: String }],
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    privacySettings: { isProfilePublic: { type: Boolean, default: true } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
