// models/Roadmap.js
const mongoose = require('mongoose');

const RoadmapStepSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      skillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill', // Reference to your Skill model
        required: true
      },
      title: {
        type: String,
        required: true
      },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  resources: [{
    type: String
  }],
  progressIndicators: [{
    type: String
  }],
  completed: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
});

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  steps: [RoadmapStepSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  aiModel: {
    type: String,
    default: 'gpt-4'
  },
  overallProgress: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);