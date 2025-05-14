const express = require("express");
const router = express.Router();
const badgeController = require("../Controllers/badgeController");

// Route to get all badges for a user
router.get("/:userId", badgeController.getAllBadges);

module.exports = router;
