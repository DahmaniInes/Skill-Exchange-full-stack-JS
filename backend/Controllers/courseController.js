const Course = require('../Models/Course');
const CourseDetail = require('../Models/CourseDetail');
const Instructor = require('../Models/Instructor');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');



// ========== Get course by ID with details ==========
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    const courseDetail = await CourseDetail.findOne({ course: id });

    if (!course || !courseDetail) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      ...course.toObject(),
      details: courseDetail
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ========== Create a new course ==========



exports.createCourse = async (req, res) => {
  try {
    const { details, ...courseData } = req.body;
    const { fullDescription } = details;
    const instructorIds = details.instructors || [];

    if (!fullDescription || typeof fullDescription !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing fullDescription' });
    }

    // Call external API to get tags
    let courseTags = [];
    try {
      const tagResponse = await axios.post('https://3dcc-34-145-102-126.ngrok-free.app/predict', {
        description: fullDescription
      });
      console.log('Tag API Response:', tagResponse.data);
      courseTags = tagResponse.data.tags || [];
      console.log('Extracted tags:', courseTags);
    } catch (apiError) {
      console.error('Tag API Error:', apiError.response?.data || apiError.message);
      courseTags=[]
    }

    const existingInstructors = await Instructor.find({
      _id: { $in: instructorIds }
    });

    if (existingInstructors.length !== instructorIds.length) {
      return res.status(400).json({ error: 'One or more instructors not available' });
    }

    const course = new Course({
      ...courseData,
      tags: courseTags
    });
    await course.save();

    const courseDetail = new CourseDetail({
      ...details,
      course: course._id
    });
    await courseDetail.save();

    res.status(201).json({ course, courseDetail });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(400).json({ error: err.message });
  }
};



// ========== Get all courses ==========
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== Get courses for a specific user ==========
exports.getUserCourses = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courses = await Course.find({ 'users.user': userId });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== Enroll a user in a course ==========
exports.enrollCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const alreadyEnrolled = course.users.some(u => u.user.toString() === userId);
    if (!alreadyEnrolled) {
      course.users.push({ user: userId, progress: 0 });
      await course.save();
    }

    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== Update user progress in a course ==========
exports.updateCourseProgress = async (req, res) => {
  try {
    const { courseId, userId, progress } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const userEntry = course.users.find(u => u.user.toString() === userId);
    if (!userEntry) return res.status(404).json({ error: 'User not enrolled in course' });

    userEntry.progress = progress;
    await course.save();

    res.json({ message: 'Progress updated successfully', course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== Upload and process course image ==========
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

exports.uploadCourseImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    ensureDirectoryExists('public/uploads/courses');

    const processedImagePath = path.join(
      path.dirname(req.file.path),
      'processed-' + path.basename(req.file.path)
    );

    await sharp(req.file.path)
      .resize(1280, 720, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(processedImagePath);

    fs.unlinkSync(req.file.path);

    const imageUrl = `/uploads/courses/${path.basename(processedImagePath)}`;
    res.json({
      imageUrl,
      message: 'Image uploaded and processed successfully'
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
};

// ========== Get related courses ==========
exports.getRelatedCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const relatedCourses = await Course.find({ _id: { $ne: id } })
      .limit(5)
      .sort({ createdAt: -1 });

    res.json(relatedCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
