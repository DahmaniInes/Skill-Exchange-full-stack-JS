const Story = require("../Models/Story");
const User = require("../Models/User");
const Skill = require("../Models/Skill");
const fs = require("fs");
const path = require("path");

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const { title, content, skillId, userId } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId || req.userId); // Use req.userId from middleware if no userId in body
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if skill exists
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found"
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Media (image or video) is required for stories"
      });
    }

    const story = new Story({
      title,
      content,
      userId: userId || req.userId,
      skillId,
      userName: `${user.firstName} ${user.lastName}`,
      userImage: user.profileImage,
      skillName: skill.name,
      media: `/uploads/stories/${req.file.filename}`,
      mediaType: req.file.mimetype.startsWith("image/") ? "image" : "video",
      createdAt: new Date()
    });
    
    await story.save();
    
    // Return success
    res.status(201).json({
      success: true,
      message: "Story created successfully",
      data: story
    });
  } catch (error) {
    console.error("Error creating story:", error);
    res.status(500).json({
      success: false,
      message: "Error creating story",
      error: error.message
    });
  }
};

// Get all stories
exports.getAllStories = async (req, res) => {
  try {
    // Get stories, sorted by date (newest first)
    // With time limit (not older than 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const stories = await Story.find({
      createdAt: { $gte: oneDayAgo }
    })
    .sort({ createdAt: -1 })
    .limit(20); // Limit to 20 stories
    
    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories
    });
  } catch (error) {
    console.error("Error retrieving stories:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving stories",
      error: error.message
    });
  }
};

// Get stories for a specific user
exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stories = await Story.find({ userId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories
    });
  } catch (error) {
    console.error("Error retrieving user stories:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving stories",
      error: error.message
    });
  }
};

// Delete a story
exports.deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.body.userId || req.userId; // Use user ID from middleware if not in body
    
    // Get the story
    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found"
      });
    }
    
    // Check that the user is the owner of the story
    if (story.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this story"
      });
    }
    
    if (story.media) {
      const mediaPath = path.join(__dirname, "../public", story.media);
      if (fs.existsSync(mediaPath)) {
        fs.unlinkSync(mediaPath);
      }
    }
    
    // Delete the story
    await Story.findByIdAndDelete(storyId);
    
    res.status(200).json({
      success: true,
      message: "Story deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting story",
      error: error.message
    });
  }
};

