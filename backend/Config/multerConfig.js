const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

// Cloudinary config via env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Profile picture storage
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// Story storage (images/videos)
const storyStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "stories",
    allowed_formats: ["jpg", "png", "jpeg", "mp4"],
    resource_type: "auto",
  },
});

// Generic uploads (PDFs, others)
const uploadStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "upload",
    resource_type: "raw",
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  }),
});

// File filters
const profileFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only JPG, PNG, JPEG are allowed."), false);
};

const storyFileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "video/mp4"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only images (JPG, PNG) and MP4 videos are allowed."), false);
};

// Multer instances
const uploadProfile = multer({ storage: profileStorage, fileFilter: profileFileFilter });
const uploadStory = multer({ storage: storyStorage, fileFilter: storyFileFilter });
const uploadGeneric = multer({ storage: uploadStorage }); // No filter, raw support

module.exports = { uploadProfile, uploadStory, uploadGeneric };
