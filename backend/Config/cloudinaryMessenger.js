// config/cloudinaryMessenger.js
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Charger spécifiquement votre fichier .env.Messenger
dotenv.config({ path: '.env.Messenger' });

// Vérifier que les variables sont bien chargées
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing Cloudinary configuration in .env.Messenger');
}

// Configuration Cloudinary avec vos identifiants
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Multer pour le stockage Cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'messenger-app',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'pdf', 'mp3', 'wav', 'ogg'],    resource_type: 'auto',
    transformation: [{ width: 800, crop: 'limit' }],
    type: 'upload', // Au lieu de 'authenticated'
    sign_url: false,
    invalidate: true
  }
});

const upload = multer({ storage });

module.exports = {
  cloudinary,
  upload
};