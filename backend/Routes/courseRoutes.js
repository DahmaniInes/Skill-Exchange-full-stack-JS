const express = require('express');
const router = express.Router();
const courseController = require('../Controllers/courseController');
const upload = require('../utils/fileUpload');

router.post('/create', courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/user/:userId', courseController.getUserCourses);
router.post('/enroll', courseController.enrollCourse);
router.get('/:id', courseController.getCourseById);
router.post(
    '/upload-image',
    upload.single('image'),
    courseController.uploadCourseImage
  );
  

module.exports = router;
