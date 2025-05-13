const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: String,
  description: String,
  price: Number,
  rating: Number,
  tags: [String],
  users: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      progress: { type: Number, default: 0 }
    }
  ]
  
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
