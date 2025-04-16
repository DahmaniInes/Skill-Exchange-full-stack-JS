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

// Configuration de multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Types de fichiers autorisés
    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format non supporté. Formats acceptés : JPEG, PNG, JPG, MP4, WEBM, OGG"), false);
    }
  }
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