const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10), // Mot de passe aléatoire
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
    
    // Créer un JWT pour l'utilisateur
    const token = jwt.sign({ userId: user._id, userRole: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log("Token JWT créé avec succès pour Google OAuth");

    // Envoi du token côté client via le header
    res.set('Authorization', `Bearer ${token}`);
    res.redirect('http://localhost:5173');
    
  } catch (error) {
    console.error('ERREUR GOOGLE AUTH:', error);
    res.status(500).send('Erreur d\'authentification');
  }
});

module.exports = router;