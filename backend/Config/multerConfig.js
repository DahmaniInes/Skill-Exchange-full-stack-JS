const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../Config/cloudinaryConfig");


const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder: file.mimetype === "application/pdf" ? "cv" : "profiles",
      resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
      format: file.mimetype.startsWith('image') ? 'jpg' : undefined,
      transformation: { width: 500, height: 500, crop: "limit" } // Ajout
    })
  });
// 📌 Filtrage des fichiers acceptés (images et PDF)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images et fichiers PDF sont autorisés."), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = { upload };
