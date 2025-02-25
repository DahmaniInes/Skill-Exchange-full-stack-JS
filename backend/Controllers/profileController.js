const User = require("../models/User");
const bcrypt = require("bcrypt");
const fs = require("fs");

// 📌 Récupérer le profil utilisateur
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Modifier le profil utilisateur + upload d’image
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, location, bio } = req.body;
    let updateData = { firstName, lastName, location, bio };

    // Vérifier si une image est uploadée
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Modifier le mot de passe avec hachage bcrypt
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Ancien mot de passe incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Gérer la confidentialité du profil
const toggleProfilePrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.privacySettings.isProfilePublic = !user.privacySettings.isProfilePublic;
    await user.save();
    res.json({ isProfilePublic: user.privacySettings.isProfilePublic });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Voir un profil public
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("firstName lastName bio skills profilePicture");
    if (!user || !user.privacySettings.isProfilePublic) {
      return res.status(403).json({ message: "Ce profil est privé ou n'existe pas" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  updatePassword,
  toggleProfilePrivacy,
  getPublicProfile,
};
