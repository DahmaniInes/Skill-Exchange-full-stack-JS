const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../Config/cloudinaryConfig2");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "upload",
    resource_type: "raw", // Keep raw for PDFs, ZIPs, DOCs
    type: "upload",
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
    allowed_formats: ["pdf"],
  }),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images et fichiers PDF sont autorisés."), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = { upload };
