// TeacherRatingSchema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeacherRatingSchema = new mongoose.Schema({
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  ratings: [{
    criterion: {
      type: String,
      enum: ['explains_well', 'availability', 'responsiveness'],
      required: true,
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    _id: false,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TeacherRating', TeacherRatingSchema);