const Course = require('../Models/Course');
const CourseDetail = require('../Models/CourseDetail');
const Instructor = require('../Models/Instructor'); 


exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the course with details
    const course = await Course.findById(id);
    const courseDetail = await CourseDetail.findOne({ course: id });

    if (!course || !courseDetail) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Combine course and details
    res.json({
      ...course.toObject(), // Convert Mongoose document to plain JavaScript object
      details: courseDetail // Attach details to the course response
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.createCourse = async (req, res) => {
  try {
    const { details, ...courseData } = req.body;

    // Step 1: Check if all instructor IDs exist
    const instructorIds = details.instructors || [];
    const existingInstructors = await Instructor.find({
      _id: { $in: instructorIds }
    });

    if (existingInstructors.length !== instructorIds.length) {
      return res.status(400).json({ error: 'One or more instructors not available' });
    }

    // Step 2: Create the Course
    const course = new Course(courseData);
    await course.save();

    // Step 3: Create CourseDetail with course reference
    const courseDetail = new CourseDetail({
      ...details,
      course: course._id
    });
    await courseDetail.save();

    res.status(201).json({ course, courseDetail });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get courses for a specific user
exports.getUserCourses = async (req, res) => {
  try {
    const userId = req.params.userId;
    const courses = await Course.find({ users: userId });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Enroll user in a course
exports.enrollCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    const course = await Course.findByIdAndUpdate(
      courseId,
      { $addToSet: { users: userId } },
      { new: true }
    );
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Utility function to ensure directory exists
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

    // Ensure directory exists
    ensureDirectoryExists('public/uploads/courses');

    // Process image with sharp
    const processedImagePath = path.join(
      path.dirname(req.file.path),
      'processed-' + path.basename(req.file.path)
    );

    await sharp(req.file.path)
      .resize(1280, 720, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(processedImagePath);

    // Remove original file
    fs.unlinkSync(req.file.path);

    // Return the URL of the processed image
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


