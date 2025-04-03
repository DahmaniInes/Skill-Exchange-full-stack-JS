const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["audio", "video"],
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  acceptedAt: Date,
  endedAt: Date,
  duration: Number, // en secondes
  status: {
    type: String,
    enum: ["initiated", "ongoing", "ended", "rejected", "missed"],
    default: "initiated"
  },
  recording: {
    url: String,
    publicId: String,
    duration: Number,
    format: String,
    size: Number
  },
  // Pour lier l'appel à la conversation
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation"
  }
}, { timestamps: true });

module.exports = mongoose.model("Call", CallSchema);