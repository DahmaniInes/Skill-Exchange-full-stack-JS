const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SentimentLexicon = new mongoose.Schema({
    word: String, // ex. "heureux", "happy", "سعيد", "😊"
    language: String, // "fra", "eng", "ara", "universal" (pour emojis)
    emotions: {
      anger: Number, // 0 ou 1
      anticipation: Number,
      disgust: Number,
      fear: Number,
      joy: Number,
      sadness: Number,
      surprise: Number,
      trust: Number,
      positive: Number,
      negative: Number
    },
    weight: Number // ex. 1.0 (positif), -1.0 (négatif)
  });
  module.exports = mongoose.model("SentimentLexicon", SentimentLexicon);