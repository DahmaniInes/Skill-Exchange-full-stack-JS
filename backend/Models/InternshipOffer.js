const mongoose = require('mongoose');

const InternshipOfferSchema = new mongoose.Schema({
  title: { type: String, required: true },
  entrepriseName: { type: String, required: true },
  description: { type: String, required: true },
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  }],
  location: { type: String },
  duration: { type: String },
  startDate: { type: Date },

  tasks: [{
    title: { type: String, required: true },
    description: { type: String }
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InternshipOffer', InternshipOfferSchema);
