const User = require("../Models/User");
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

// 📌 Modifier le profil utilisateur
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, location, bio ,  jobTitle, company, university, degree } = req.body;
    let updateData = { firstName, lastName, location, bio , jobTitle, company, university, degree};

    // Vérifier si une image est uploadée
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_pictures",
      });
      updateData.profilePicture = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

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

// 📌 Ajouter une expérience professionnelle
const addExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.experience.push(req.body);
    await user.save();
    res.json(user.experience);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Supprimer une expérience
const deleteExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.experience = user.experience.filter(exp => exp._id.toString() !== req.params.expId);
    await user.save();
    res.json(user.experience);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Ajouter une éducation
const addEducation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.education.push(req.body);
    await user.save();
    res.json(user.education);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Supprimer une éducation
const deleteEducation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.education = user.education.filter(edu => edu._id.toString() !== req.params.eduId);
    await user.save();
    res.json(user.education);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Mettre à jour les liens sociaux
const updateSocialLinks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.socialLinks = { ...user.socialLinks, ...req.body };
    await user.save();
    res.json(user.socialLinks);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Ajouter/Supprimer une compétence
const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    const user = await User.findById(req.user.id);
    user.skills = skills; // Remplace les compétences actuelles
    await user.save();
    res.json(user.skills);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 📌 Ajouter un avis et mettre à jour la note moyenne
const addRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Ajouter la nouvelle évaluation
    user.ratings.push({ reviewer: req.user.id, rating, comment });

    // Recalculer la moyenne des notes
    const totalRatings = user.ratings.length;
    const sumRatings = user.ratings.reduce((sum, r) => sum + r.rating, 0);
    user.averageRating = sumRatings / totalRatings;

    await user.save();
    res.json(user);
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
// 📌 Méthode pour uploader le CV

const deleteCV = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    if (!user.cv) {
      return res.status(400).json({ message: "Aucun CV à supprimer" });
    }

    // Supprimer le fichier du stockage Cloudinary
    const publicId = user.cv.split('/').pop().split('.')[0]; // Récupérer l'ID public du fichier
    await cloudinary.uploader.destroy(`cv/${publicId}`, { resource_type: "raw" });

    // Mettre à jour le champ `cv` de l'utilisateur
    user.cv = null;
    await user.save();

    res.json({ message: "CV supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
const uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier trouvé" });
    }

    const user = await User.findById(req.user.id);
    
    // Supprimer l'ancien CV si existe
    if (user.cv) {
      const publicId = user.cv.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`cv/${publicId}`, { resource_type: "raw" });
    }

    // Upload du nouveau CV
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "cv",
      resource_type: "raw",
    });

    user.cv = result.secure_url;
    await user.save();

    res.json({
      message: "CV mis à jour avec succès",
      cvUrl: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



module.exports = {
  getUserProfile,
  updateProfile,
  updatePassword,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  updateSocialLinks,
  updateSkills,
  uploadCV,
  addRating,
  toggleProfilePrivacy,
  getPublicProfile,
  deleteCV ,
  uploadCV
  
};
