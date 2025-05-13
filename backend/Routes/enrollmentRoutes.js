const express = require("express");
const router = express.Router();
const enrollmentController = require("../Controllers/enrollmentController");

router.put("/progress", enrollmentController.updateProgress);
router.get("/user/:userId", enrollmentController.getUserCourses);
router.post("/claim-badge", enrollmentController.claimBadge);

module.exports = router;
