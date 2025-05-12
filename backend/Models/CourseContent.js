const mongoose = require('mongoose');

const LectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  src: { type: String, required: true },
  duration: { type: String, required: true }
});

const SectionSchema = new mongoose.Schema({
  section: { type: String, required: true },
  lectures: [LectureSchema]
});

const CourseContentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
  sections: [SectionSchema]
}, { timestamps: true });

module.exports = mongoose.model('CourseContent', CourseContentSchema);
