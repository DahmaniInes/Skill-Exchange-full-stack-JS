// Routes/skillRoutes.js
const express = require("express");
const { 
  getAllSkills, 
  getSkillById, 
  createSkill, 
  updateSkill, 
  deleteSkill, 
  rateSkill ,
  getSkills
} = require("../Controllers/skillController");
const verifySession = require("../middleware/verifySession");
const { searchSkills } = require("../Controllers/skillController");
const { upload } = require("../middleware/upload");

const router = express.Router();
router.get("/", getAllSkills);
router.get("/:id", getSkillById);
router.post("/", verifySession,upload.single("image"), createSkill);
router.get("/skills",verifySession, getSkills);
router.put("/:id", verifySession, updateSkill);
router.delete("/:id", verifySession, deleteSkill);
router.post("/:id/rate", verifySession, rateSkill);
router.get("/search",verifySession, searchSkills);

module.exports = router;