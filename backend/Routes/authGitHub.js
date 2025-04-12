const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Route pour initier l'authentification GitHub
router.get('/auth/github', (req, res) => {
  // Vérification que les variables d'environnement sont correctement chargées
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CALLBACK_URL) {
    console.error('Variables d\'environnement manquantes:', { 
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL 
    });
    return res.status(500).send('Erreur de configuration: Variables d\'environnement manquantes');
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${
    process.env.GITHUB_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.GITHUB_CALLBACK_URL
  )}&scope=user:email`;
  
  console.log('Redirection vers GitHub:', githubAuthUrl);
  res.redirect(githubAuthUrl);
});

// Route pour gérer le callback de GitHub
router.get('/login-with-github', async (req, res) => {
  try {
    const code = req.query.code;
    
    // Échanger le code contre un token d'accès
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Obtenir les informations utilisateur
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`
      }
    });
    
    const githubUser = userResponse.data;
    console.log('Informations utilisateur GitHub:', githubUser);
    
    // Obtenir l'email de l'utilisateur (peut être privé)
    let userEmail = githubUser.email;
    
    // Si l'email n'est pas disponible directement, essayer de le récupérer via l'API des emails
    if (!userEmail) {
      const emailsResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`
        }
      });
      
      // Chercher l'email principal et vérifié
      const primaryEmail = emailsResponse.data.find(
        email => email.primary && email.verified
      );
      
      if (primaryEmail) {
        userEmail = primaryEmail.email;
      } else if (emailsResponse.data.length > 0) {
        // Prendre le premier email vérifié si disponible
        const verifiedEmail = emailsResponse.data.find(email => email.verified);
        userEmail = verifiedEmail ? verifiedEmail.email : emailsResponse.data[0].email;
      }
    }
    
    if (!userEmail) {
      throw new Error('Impossible de récupérer l\'email de l\'utilisateur GitHub');
    }
    
    // Vérifier si l'utilisateur existe déjà dans la base de données
    let user = await User.findOne({ email: userEmail });
    
    if (!user) {
      // Créer un nouvel utilisateur s'il n'existe pas
      // Extraire le prénom et le nom du nom complet de GitHub
      const fullName = githubUser.name || githubUser.login;
      const names = fullName.split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';
      
      user = new User({
        firstName: firstName,
        lastName: lastName,
        email: userEmail,
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10), // Mot de passe aléatoire
        profilePicture: githubUser.avatar_url,
        isVerified: true // L'utilisateur est vérifié car il vient de GitHub
      });
      
      await user.save();
      console.log('NOUVEL UTILISATEUR CRÉÉ:', {
        nom: firstName + ' ' + lastName,
        email: userEmail,
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
    console.log("Token JWT créé avec succès pour GitHub OAuth");

    // Envoi du token côté client via le header
    res.set('Authorization', `Bearer ${token}`);
    res.redirect('http://localhost:5173');
    
  } catch (error) {
    console.error('ERREUR GITHUB AUTH:', error);
    res.status(500).send('Erreur d\'authentification');
  }
});

module.exports = router;