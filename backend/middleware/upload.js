const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Vérifier si le dossier d'upload existe, sinon le créer
const uploadDir = "uploads/skills/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Filtrage des fichiers (formats autorisés)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format d'image non supporté. Formats acceptés : JPEG, PNG, JPG"), false);
  }
};

// Configuration de Multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
  fileFilter
});

// Middleware pour vérifier si le fichier a bien été téléchargé
const uploadComplete = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Aucun fichier n'a été téléchargé." });
  }
  console.log("Fichier téléchargé avec succès:", req.file.filename);
  next();
};

module.exports = { upload, uploadComplete };
