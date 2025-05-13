const mongoose = require('mongoose');

const chatBotMessageSchema = new mongoose.Schema({
  userMessage: String,
  botResponse: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatBotMessage', chatBotMessageSchema);
