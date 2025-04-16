const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  media: { type: String },
  userName: { type: String },
  userImage: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24, // 24 heures
  },
});

module.exports = mongoose.model("Story", StorySchema);