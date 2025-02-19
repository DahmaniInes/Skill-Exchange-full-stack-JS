const express = require("express");
const { 
  addUser,
  updateProfile, 
  getUserProfile, 
  getPublicProfile, 
  updatePreferences, 
  addSkill, 
  removeSkill, 
  toggleProfilePrivacy 
} = require("../Controllers/profileController");


const router = express.Router();
router.post("/add", addUser);
router.put("/update/:id", updateProfile);
router.get("/:id", getUserProfile);
router.get("/public/:id", getPublicProfile);
router.put("/preferences", updatePreferences);
router.post("/skills/add", addSkill);
router.delete("/skills/remove", removeSkill);
router.put("/privacy", toggleProfilePrivacy);


module.exports = router;
