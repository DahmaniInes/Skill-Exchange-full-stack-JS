const Story = require("../Models/Story");
const User = require("../Models/User");
const mongoose = require("mongoose");

exports.createStory = async (req, res) => {
  try {
    const { title, content, category, userId } = req.body;
    const effectiveUserId = userId || req.user?.id || req.userId;

    if (!effectiveUserId) {
      return res.status(401).json({
        success: false,
        message: "User ID is required. Please ensure you are authenticated.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(effectiveUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(effectiveUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!req.file) {
      console.error("No file uploaded. Request body:", req.body);
      return res.status(400).json({
        success: false,
        message: "Media (image or video) is required for stories",
      });
    }

    console.log("File uploaded successfully:", req.file);

    const story = new Story({
      title,
      content,
      userId: effectiveUserId,
      category,
      userName: `${user.firstName} ${user.lastName}`,
      userImage: user.profilePicture || "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg",
      media: req.file.path, // Cloudinary URL
      mediaType: req.file.mimetype.startsWith("image/") ? "image" : "video",
      createdAt: new Date(),
    });

    await story.save();

    console.log("Story created successfully:", story);

    res.status(201).json({
      success: true,
      message: "Story created successfully",
      data: story,
    });
  } catch (error) {
    console.error("Error creating story:", error.stack);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la story",
      error: error.message,
    });
  }
};

exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUserStories = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    const stories = await Story.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    console.error("Error fetching user stories:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ success: false, message: "Invalid story ID" });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    if (story.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this story" });
    }

    await Story.deleteOne({ _id: storyId });
    res.status(200).json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};