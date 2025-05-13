const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  claimedAt: { type: Date, default: Date.now },

  // Add display info
  badgeName: { type: String, required: true },
  badgeDescription: { type: String },
  badgeIconUrl: { type: String }
});

module.exports = mongoose.model('Badge', badgeSchema);
