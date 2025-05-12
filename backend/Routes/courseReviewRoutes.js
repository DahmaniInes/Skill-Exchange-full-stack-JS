const express = require('express');
const router = express.Router();
const courseReviewController = require('../Controllers/courseReviewController');

router.post('/reviews', courseReviewController.addReview);
router.get('/reviews/course/:courseId', courseReviewController.getReviewsByCourse);
router.get('/reviews/instructor/:instructorId', courseReviewController.getReviewsForInstructor);

module.exports = router;
