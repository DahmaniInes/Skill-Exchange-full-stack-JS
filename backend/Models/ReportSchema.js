// ReportSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'blocked_3days', 'blocked_permanent', 'resolved'],
        default: 'pending',
  },
  blockedUntil: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', ReportSchema);