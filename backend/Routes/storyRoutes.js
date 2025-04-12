const express = require("express");
const router = express.Router();
const storiesController = require("../Controllers/storiesController");
const verifySession = require("../middleware/verifySession");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../public/uploads/stories");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "story-" + uniqueSuffix + ext);
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are accepted"), false);
    }
  }
});

// Add the upload middleware to the POST route
router.post("/", verifySession, upload.single("image"), storiesController.createStory);

// Route for getting all stories
router.get("/", verifySession, storiesController.getAllStories);

// Route for getting a specific user's stories
router.get("/user/:userId", verifySession, storiesController.getUserStories);

// Route for deleting a story
router.delete("/:storyId", verifySession, storiesController.deleteStory);

module.exports = router;