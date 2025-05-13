const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_2,
  api_key: process.env.CLOUDINARY_API_KEY_2,
  api_secret: process.env.CLOUDINARY_API_SECRET_2,
});

module.exports = cloudinary;
