const mongoose = require('mongoose'); // Importer mongoose pour utiliser isValidObjectId
const Schema = mongoose.Schema;

const CallSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }], // Remplace `receiver` pour gérer plusieurs participants
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
  duration: Number,
  status: {
    type: String,
    enum: ["initiated", "ongoing", "ended", "rejected", "missed", "cancelled"],
    default: "initiated"
  },
  recording: {
    url: String,
    publicId: String,
    duration: Number,
    format: String,
    size: Number
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true // Assure que chaque appel est lié à une conversation
  },
  isGroupCall: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });
module.exports = mongoose.models.Call || mongoose.model('Call', CallSchema);