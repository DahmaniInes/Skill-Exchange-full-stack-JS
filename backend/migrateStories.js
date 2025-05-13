const mongoose = require("mongoose");
const Story = require("./Models/Story");
const User = require("./Models/User");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateStories = async () => {
  try {
    // Fetch all stories
    const stories = await Story.find();

    for (const story of stories) {
      // Update userImage to match user's profilePicture
      const user = await User.findById(story.userId);
      if (user) {
        story.userImage = user.profilePicture || "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg";
      }

      // Migrate media to Cloudinary if it’s a local path
      if (story.media && story.media.startsWith("/uploads/stories/")) {
        const localPath = `./${story.media}`; // Adjust path based on your project structure
        if (fs.existsSync(localPath)) {
          const uploadResult = await cloudinary.uploader.upload(localPath, {
            folder: "stories",
            resource_type: "auto",
          });
          story.media = uploadResult.secure_url;
          console.log(`Uploaded media for story ${story._id} to Cloudinary: ${story.media}`);
        } else {
          console.warn(`Local media file not found for story ${story._id}: ${localPath}`);
          story.media = "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg"; // Fallback
        }
      }

      await story.save();
      console.log(`Updated story ${story._id}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    mongoose.connection.close();
  }
};

migrateStories();