const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  description: { type: String }
});

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

  tasks: [TaskSchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  completed: { type: Boolean, default: false },
  completionDate: { type: Date, default: null },
  certificateUrl: { type: String, default: null },


  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InternshipOffer', InternshipOfferSchema);
