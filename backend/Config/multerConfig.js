const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinaryConfig");

// Configuration du stockage avec Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Dossier Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "pdf"], // Formats autorisés
    resource_type: "auto", // Permet d'uploader des images & PDF
  },
});

// Filtrer les fichiers (accepter uniquement les images et les PDF)
const fileFilter = (req, file, cb) => {
  // Accepter les formats image et PDF
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accepter le fichier
  } else {
    cb(new Error("Seules les images (JPEG, PNG, JPG) et les fichiers PDF sont autorisés."), false); // Rejeter le fichier
  }
};

// Création de l'upload avec Multer et le filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter, // Ajout du file filter
});

module.exports = upload;
