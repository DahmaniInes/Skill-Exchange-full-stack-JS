const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed."), false);
  }
};

const storage = multer.memoryStorage(); // Store in memory

const pdfBuffer = multer({ storage, fileFilter });

module.exports = { pdfBuffer };
