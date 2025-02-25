const express = require("express");
const { 
  getUserProfile, 
  updateProfile, 
  updatePassword, 
  toggleProfilePrivacy, 
  getPublicProfile 
} = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, getUserProfile);
router.put("/me", authMiddleware, upload.single("profilePicture"), updateProfile);
router.put("/me/password", authMiddleware, updatePassword);
router.put("/me/privacy", authMiddleware, toggleProfilePrivacy);
router.get("/public/:id", getPublicProfile);

module.exports = router;
