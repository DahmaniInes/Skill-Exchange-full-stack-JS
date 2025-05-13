const express = require('express');
const router = express.Router();
const courseController = require('../Controllers/courseController');
const upload = require('../Utils/fileUpload');

router.post('/create', courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/user/:userId', courseController.getUserCourses);
router.post('/enroll', courseController.enrollCourse);
router.get('/:id', courseController.getCourseById);
router.get('/related/:id', courseController.getRelatedCourses);
router.put('/progress/:id', courseController.updateCourseProgress);

router.post(
    '/upload-image',
    upload.single('image'),
    courseController.uploadCourseImage
  );
  

module.exports = router;
