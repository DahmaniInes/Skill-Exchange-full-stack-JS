const express = require("express");
const router = express.Router();
const storyController = require("../Controllers/storiesController");
const verifySession = require("../middleware/verifySession");
const { uploadStory } = require("../middleware/upload");

// Ajouter un log pour vérifier l'importation
console.log("Imported uploadStory:", uploadStory);

router.post("/", verifySession, uploadStory.single("media"), storyController.createStory);
router.get("/", storyController.getAllStories);
router.get("/user/:userId", storyController.getUserStories);
router.delete("/:storyId", verifySession, storyController.deleteStory);

module.exports = router;