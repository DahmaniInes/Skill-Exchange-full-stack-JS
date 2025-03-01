const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const User = require('../Models/User');

// Configurer le client OAuth2 avec les informations de Google Cloud
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/login/login-with-google'
);

// Route pour initier l'authentification Google
router.get('/auth/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
});

// Route pour gérer le callback de Google
router.get('/login-with-google', async (req, res) => {
  try {
    const code = req.query.code;
    
    // Échanger le code contre un token
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    
    // Obtenir les informations utilisateur
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    console.log('Informations utilisateur Google:', payload);
    
    // Vérifier si l'utilisateur existe déjà dans la base de données
    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
      // Créer un nouvel utilisateur s'il n'existe pas
      const names = payload.name.split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';
      
      user = new User({
        firstName: firstName,
        lastName: lastName,
        email: payload.email,
        password: await require('bcryptjs').hash(Math.random().toString(36).slice(-10), 10), // Mot de passe aléatoire
        profilePicture: payload.picture,
        isVerified: true // L'utilisateur est vérifié car il vient de Google
      });
      
      await user.save();
      console.log('NOUVEL UTILISATEUR CRÉÉ:', {
        nom: firstName + ' ' + lastName,
        email: payload.email,
        id: user._id
      });
    } else {
      console.log('UTILISATEUR EXISTANT:', {
        nom: user.firstName + ' ' + user.lastName,
        email: user.email,
        id: user._id
      });
    }
    
    // Créer une session pour l'utilisateur
    req.session.userId = user._id;
    console.log('Session créée pour l\'utilisateur:', user._id);
    
    // Rediriger vers la page d'accueil React
    res.redirect('http://localhost:5173');
    
  } catch (error) {
    console.error('ERREUR GOOGLE AUTH:', error);
    res.redirect('http://localhost:5173?error=authentication_failed');
  }
});

// Route pour récupérer les informations de l'utilisateur connecté par Google
router.get('/google-user', async (req, res) => {
  if (!req.session.userId) {
    console.log('Tentative d\'accès sans session');
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('Utilisateur non trouvé en base:', req.session.userId);
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    console.log('Données utilisateur envoyées:', user.firstName + ' ' + user.lastName);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;