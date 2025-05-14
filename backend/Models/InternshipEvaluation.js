const mongoose = require('mongoose');
const User = require('./User');
const InternshipApplication = require('./InternshipApplication');

const InternshipEvaluationSchema = new mongoose.Schema({
    internshipApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'InternshipApplication', required: true },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, min: 0, max: 10 },
    feedback: String,
    date: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model('InternshipEvaluation', InternshipEvaluationSchema);
  