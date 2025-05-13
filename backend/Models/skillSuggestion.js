// In Models/SkillSuggestion.js (assumed based on the error)
const mongoose = require("mongoose");

const skillSuggestionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "General" },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const SkillSuggestion = mongoose.model("SkillSuggestion", skillSuggestionSchema);
module.exports = SkillSuggestion;