const bcrypt = require('bcrypt');
const User = require('../Models/User');
const jwt = require('jsonwebtoken');

// Inscription d'un nouvel utilisateur
const register = async (req, res) => {
  const { firstName,lastName , email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword
    });

    // Sauvegarder l'utilisateur dans la base de données
    await newUser.save();

    // Créer un token JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Répondre avec le token
    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
};

module.exports = { register };
