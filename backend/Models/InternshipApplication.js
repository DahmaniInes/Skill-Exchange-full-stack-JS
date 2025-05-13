const mongoose = require('mongoose');
const InternshipOffer = require('./InternshipOffer');
const User = require('./User');

const InternshipApplicationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internshipOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipOffer', required: true },
    cvUrl: { type: String, required: true },
    coverLetter: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    matchScore: { type: Number, default: null },
    appliedAt: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model('InternshipApplication', InternshipApplicationSchema);
  