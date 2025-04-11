const express = require('express');
const router = express.Router();
const courseController = require('../Controllers/courseController');

router.post('/create', courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/user/:userId', courseController.getUserCourses);
router.post('/enroll', courseController.enrollCourse);
router.get('/:id', courseController.getCourseById);

module.exports = router;
