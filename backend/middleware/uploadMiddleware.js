const multer = require("multer");
const path = require("path");

// Configuration du stockage des images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Dossier où seront stockées les images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Renomme l'image
  },
});

// Filtrer les fichiers (accepter uniquement les images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images sont autorisées"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
