const express = require('express');
const router = express.Router();
const courseContentController = require('../Controllers/courseContentController');


router.post('/', courseContentController.createCourseContent);
router.get('/:courseId', courseContentController.getCourseContentByCourseId);


module.exports = router;
