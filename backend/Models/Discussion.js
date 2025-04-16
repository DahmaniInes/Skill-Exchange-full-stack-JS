const mongoose = require("mongoose");

const DiscussionSchema = new mongoose.Schema({
  skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Discussion", DiscussionSchema);