const mongoose = require('mongoose');

const InstructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: String,
  photo: String,
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
});

module.exports = mongoose.model('Instructor', InstructorSchema);
