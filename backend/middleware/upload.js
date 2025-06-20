const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures (Cloudinary)
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// Storage for story media (Cloudinary)
const storyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "stories",
    allowed_formats: ["jpg", "png", "jpeg", "mp4"], // Allow images and videos
    resource_type: "auto", // Automatically detect resource type (image or video)
  },
});

// Storage for skill images (Cloudinary)
const skillStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "skills",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// Filtrage des types de fichiers acceptés
const profileFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images (JPEG, PNG, JPG) sont autorisées."), false);
  }
};

const storyFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "video/mp4"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images (JPEG, PNG, JPG) et vidéos (MP4) sont autorisées."), false);
  }
};

const skillFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images (JPEG, PNG, JPG) sont autorisées."), false);
  }
};

// Create Multer instances
const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const uploadStory = multer({
  storage: storyStorage,
  fileFilter: storyFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const uploadSkill = multer({
  storage: skillStorage,
  fileFilter: skillFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

module.exports = { uploadProfile, uploadStory, uploadSkill };