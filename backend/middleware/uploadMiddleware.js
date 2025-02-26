const multer = require("multer");
const path = require("path");

// 📌 Configuration du stockage temporaire
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Dossier temporaire avant l'upload vers Cloudinary
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Renomme le fichier
  },
});

// 📌 Filtrer les fichiers en fonction du type (image ou CV)
const fileFilter = (fileType) => {
  return (req, file, cb) => {
    if (fileType === "image" && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else if (fileType === "cv" && file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error(`Seuls les fichiers ${fileType === "image" ? "images" : "PDF"} sont autorisés`), false);
    }
  };
};

// 📌 Middleware pour uploader les **images** (ex: photo de profil)
const uploadImage = multer({
  storage,
  fileFilter: fileFilter("image"),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
});

// 📌 Middleware pour uploader les **CVs** (format PDF)
const uploadCV = multer({
  storage,
  fileFilter: fileFilter("cv"),
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10 Mo
});

module.exports = { uploadImage, uploadCV };
