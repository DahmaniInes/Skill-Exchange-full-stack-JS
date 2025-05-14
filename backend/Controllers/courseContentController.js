const CourseContent = require('../Models/CourseContent');

// Create Course Content
exports.createCourseContent = async (req, res) => {
  try {
    const newContent = new CourseContent(req.body);
    const savedContent = await newContent.save();
    res.status(201).json(savedContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Course Content by Course ID
exports.getCourseContentByCourseId = async (req, res) => {
  try {
    const content = await CourseContent.findOne({ course: req.params.courseId });
    if (!content) {
      return res.status(404).json({ message: 'Course content not found' });
    }
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Course Content by Course ID
exports.updateCourseContent = async (req, res) => {
  try {
    const updatedContent = await CourseContent.findOneAndUpdate(
      { course: req.params.courseId },
      req.body,
      { new: true }
    );
    if (!updatedContent) {
      return res.status(404).json({ message: 'Course content not found' });
    }
    res.json(updatedContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Course Content by Course ID
exports.deleteCourseContent = async (req, res) => {
  try {
    const deletedContent = await CourseContent.findOneAndDelete({ course: req.params.courseId });
    if (!deletedContent) {
      return res.status(404).json({ message: 'Course content not found' });
    }
    res.json({ message: 'Course content deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
