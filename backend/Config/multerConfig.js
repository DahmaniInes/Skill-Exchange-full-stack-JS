const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../Config/cloudinaryConfig");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "upload",
    resource_type: "raw", // Utilisé pour les fichiers autres que les images
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`, // Formatage automatique
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
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
