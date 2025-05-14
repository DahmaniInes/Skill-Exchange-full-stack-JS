const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SentimentFeedback = new mongoose.Schema({
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    correctedSentiment: { type: String, enum: ['positif', 'négatif', 'neutre'] },
    originalSentiment: { type: String, enum: ['positif', 'négatif', 'neutre'] },
    suggestedWords: [String],
    createdAt: { type: Date, default: Date.now }
});
  module.exports = mongoose.model("SentimentFeedback", SentimentFeedback);