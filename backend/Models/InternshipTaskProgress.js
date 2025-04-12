const mongoose = require('mongoose');

const InternshipTaskProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  internshipOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipOffer', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InternshipTaskProgress', InternshipTaskProgressSchema);