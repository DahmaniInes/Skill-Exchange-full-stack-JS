const mongoose = require('mongoose');

const courseDetailSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  
  trailerVideoUrl: String,
  videoPath: String,

  whatYouWillLearn: [String],
  requirements: [String],
  courseIncludes: [String],
  exploreRelatedTopics: [String],

  contentSections: [
    {
      title: String,
      lessons: [
        {
          title: String,
          duration: String,
          isPreview: Boolean,
          videoUrl: String
        }
      ]
    }
  ],

  fullDescription: String,

  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' }]
}, { timestamps: true });

module.exports = mongoose.model('CourseDetail', courseDetailSchema);
