const User = require("../Models/User");
const bcrypt = require("bcrypt");
const cloudinary = require('cloudinary').v2;
const express = require('express');
const mongoose = require('mongoose');
 // Doit être présent partout où utilisé
 const DEFAULT_AVATAR_URL = "https://res.cloudinary.com/diahyrchf/image/upload/v1743253858/default-avatar_mq00mg.jpg";

 const getUserProfile = async (req, res) => {
  try {
    // Valider l'existence et la validité de l'ID
    // Cette vérification est peut-être redondante si vous utilisez verifySession,
    // mais c'est une bonne pratique de sécurité supplémentaire
    if (!req.userId || !mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Format d\'ID utilisateur invalide'
      });
    }

    // Récupérer l'utilisateur avec select pour exclure les champs sensibles
    const user = await User.findById(req.userId)
      .select('-password -refreshToken -authKeyTOTP -__v')
      .lean();

    // Vérifier si l'utilisateur existe
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable'
      });
    }

    // Fonction utilitaire pour sécuriser les tableaux
    const safeArray = (arr) => Array.isArray(arr) ? arr : [];
    
    // Fonction pour formater les dates
    const formatDate = (date) => date ? date.toISOString() : null;

    // Formater l'utilisateur avec des valeurs par défaut sécurisées
    const formattedUser = {
      _id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'user',
      isVerified: user.isVerified || false,
      profilePicture: user.profilePicture || DEFAULT_AVATAR_URL,
      gender: user.gender || 'other',
      bio: user.bio || '',
      location: user.location || '',
      phone: user.phone || '',
      jobTitle: user.jobTitle || '',
      company: user.company || '',
      
      // Traitement sécurisé des tableaux
      skills: safeArray(user.skills).map(skill => ({
        name: skill.name || 'Compétence inconnue',
        level: skill.level || 'Beginner',
        yearsOfExperience: skill.yearsOfExperience || 0
      })),
      
      experiences: safeArray(user.experiences).map(exp => ({
        title: exp.title || '',
        company: exp.company || '',
        startDate: formatDate(exp.startDate),
        endDate: formatDate(exp.endDate),
        description: exp.description || ''
      })),
      
      educations: safeArray(user.educations).map(edu => ({
        school: edu.school || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || '',
        startDate: formatDate(edu.startDate),
        endDate: formatDate(edu.endDate)
      })),
      
      // Traitement sécurisé des objets imbriqués
      socialLinks: {
        portfolio: user.socialLinks?.portfolio || '',
        github: user.socialLinks?.github || '',
        linkedin: user.socialLinks?.linkedin || '',
        twitter: user.socialLinks?.twitter || ''
      },
      
      privacySettings: {
        profileVisibility: user.privacySettings?.profileVisibility || 'public',
        contactVisibility: user.privacySettings?.contactVisibility || false
      },
      
      notifications: {
        email: user.notifications?.email || true,
        app: user.notifications?.app || true
      },
      
      status: user.status || 'offline',
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null
    };

    // Retourner le profil formaté
    return res.status(200).json({
      status: 'success',
      data: { user: formattedUser }
    });

  } catch (error) {
    // Log détaillé pour le débogage côté serveur
    console.error('Erreur profile détaillée:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: req.userId
    });
    
    // Déterminer le code d'état HTTP approprié
    const status = error.name === 'CastError' ? 400 : 
                  error.name === 'ValidationError' ? 422 : 500;
    
    // Message d'erreur adapté à l'environnement
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : (status === 400 ? 'Données invalides' : 'Erreur serveur');

    // Réponse JSON cohérente
    return res.status(status).json({
      status: 'error',
      code: error.name || 'SERVER_ERROR',
      message
    });
  }
};
// 📌 Mettre à jour le profil utilisateur
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    const { 
      firstName, lastName, phone, bio, location, jobTitle, 
      company, university, degree, socialLinks, 
      privacySettings, notifications, status 
    } = req.body;

    const updateData = {
      firstName, lastName, phone, bio, location, 
      jobTitle, company, university, degree, 
      socialLinks, privacySettings, notifications, status
    };

    // Gestion de l'avatar
    if (req.file) {
      if (user.profilePicture && user.profilePicture.includes('cloudinary.com')) {
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }

      const avatarResult = await cloudinary.uploader.upload(req.file.path, { 
        folder: "upload",
        public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`
      });
      updateData.profilePicture = avatarResult.secure_url;
    }

    // Mise à jour du CV
    if (req.files && req.files.cv) {
      if (user.cv) {
        const publicId = user.cv.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      }
      const cvResult = await cloudinary.uploader.upload(req.files.cv.path, { 
        folder: "cv", 
        resource_type: "raw" 
      });
      updateData.cv = cvResult.secure_url;
    }

    // Mise à jour des compétences
    if (req.body.skills) {
      const skillsToSave = req.body.skills.map(skill => ({
        name: skill.name,
        level: skill.level || "Beginner",
        yearsOfExperience: skill.yearsOfExperience || 0
      }));
      
      await Skill.deleteMany({ user: userId });
      const savedSkills = await Skill.insertMany(
        skillsToSave.map(skill => ({ ...skill, user: userId }))
      );
      updateData.skills = savedSkills.map(s => s._id);
    }

    // Mise à jour des expériences
    if (req.body.experience) {
      await Experience.deleteMany({ user: userId });
      const savedExperiences = await Experience.insertMany(
        req.body.experience.map(exp => ({ 
          ...exp, 
          user: userId 
        }))
      );
      updateData.experiences = savedExperiences.map(e => e._id);
    }

    // Mise à jour de l'éducation
    if (req.body.education) {
      await Education.deleteMany({ user: userId });
      const savedEducations = await Education.insertMany(
        req.body.education.map(edu => ({ 
          ...edu, 
          user: userId 
        }))
      );
      updateData.educations = savedEducations.map(e => e._id);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { $set: updateData }, 
      { new: true }
    ).populate('experiences educations skills');
    
    res.status(200).json({ 
      message: "Profil mis à jour avec succès.", 
      user: updatedUser 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// 📌 Mettre à jour le mot de passe
const updatePassword = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log pour vérifier les données
    console.log("User ID:", req.userId); // Log pour vérifier l'ID utilisateur
    
    const { oldPassword, newPassword } = req.body;
    
    // IMPORTANT: Utilisez req.userId au lieu de req.user.id
    const user = await User.findById(req.userId);
    
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log("Comparing passwords");
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(400).json({ message: "Ancien mot de passe incorrect" });
    }

    console.log("Hashing new password");
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    console.log("Password updated successfully");
    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
// 📌 Ajouter une expérience
const addExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const experienceData = { 
      ...req.body, 
      user: userId 
    };

    const newExperience = new Experience(experienceData);
    const savedExperience = await newExperience.save();
    
    await User.findByIdAndUpdate(
      userId, 
      { $push: { experiences: savedExperience._id } },
      { new: true }
    );

    res.status(201).json(savedExperience);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'expérience', error: error.message });
  }
};

// 📌 Supprimer une expérience
const deleteExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { experienceId } = req.params;

    const experience = await Experience.findById(experienceId);
    if (!experience || experience.user.toString() !== userId) {
      return res.status(404).json({ message: 'Expérience non trouvée' });
    }

    await Experience.findByIdAndDelete(experienceId);
    
    await User.findByIdAndUpdate(
      userId,
      { $pull: { experiences: experienceId } },
      { new: true }
    );

    res.status(200).json({ message: 'Expérience supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'expérience', error: error.message });
  }
};

// 📌 Ajouter une formation
const addEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const educationData = { 
      ...req.body, 
      user: userId 
    };

    const newEducation = new Education(educationData);
    const savedEducation = await newEducation.save();
    
    await User.findByIdAndUpdate(
      userId, 
      { $push: { educations: savedEducation._id } },
      { new: true }
    );

    res.status(201).json(savedEducation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de la formation', error: error.message });
  }
};

// 📌 Supprimer une formation
const deleteEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { educationId } = req.params;

    const education = await Education.findById(educationId);
    if (!education || education.user.toString() !== userId) {
      return res.status(404).json({ message: 'Formation non trouvée' });
    }

    await Education.findByIdAndDelete(educationId);
    
    await User.findByIdAndUpdate(
      userId,
      { $pull: { educations: educationId } },
      { new: true }
    );

    res.status(200).json({ message: 'Formation supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la formation', error: error.message });
  }
};

// 📌 Ajouter une compétence
const addSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const skillData = { 
      ...req.body, 
      user: userId 
    };

    const newSkill = new Skill(skillData);
    const savedSkill = await newSkill.save();
    
    await User.findByIdAndUpdate(
      userId, 
      { $push: { skills: savedSkill._id } },
      { new: true }
    );

    res.status(201).json(savedSkill);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de la compétence', error: error.message });
  }
};

// 📌 Supprimer une compétence
const deleteSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;

    const skill = await Skill.findById(skillId);
    if (!skill || skill.user.toString() !== userId) {
      return res.status(404).json({ message: 'Compétence non trouvée' });
    }

    await Skill.findByIdAndDelete(skillId);
    
    await User.findByIdAndUpdate(
      userId,
      { $pull: { skills: skillId } },
      { new: true }
    );

    res.status(200).json({ message: 'Compétence supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la compétence', error: error.message });
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Uploader un CV
const uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier trouvé" });
    }

    const user = await User.findById(req.user.id);

    // Supprimer l'ancien CV s'il existe
    if (user.cv) {
      await cloudinary.uploader.destroy(user.cv, { resource_type: "raw" });
    }

    // Téléverser le nouveau CV
    const cvResult = await cloudinary.uploader.upload(req.file.path, { 
      folder: "cv", 
      resource_type: "raw" 
    });

    user.cv = cvResult.secure_url;
    await user.save();

    res.json({ message: "CV mis à jour avec succès", cvUrl: user.cv });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Supprimer le CV
const deleteCV = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.cv) {
      return res.status(404).json({ message: "Aucun CV à supprimer" });
    }

    // Supprimer de Cloudinary
    await cloudinary.uploader.destroy(user.cv, { resource_type: "raw" });

    // Mettre à jour l'utilisateur
    user.cv = null;
    await user.save();

    res.json({ message: "CV supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Ajouter une évaluation
const addRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.ratings.push({ 
      reviewer: req.user.id, 
      rating, 
      comment 
    });

    // Recalculer la moyenne des notes
    const totalRatings = user.ratings.length;
    const sumRatings = user.ratings.reduce((sum, r) => sum + r.rating, 0);
    user.averageRating = sumRatings / totalRatings;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Basculer la confidentialité du profil
const toggleProfilePrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.privacySettings.isProfilePublic = !user.privacySettings.isProfilePublic;
    await user.save();
    
    res.json({ isProfilePublic: user.privacySettings.isProfilePublic });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Obtenir un profil public
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("firstName lastName bio skills profilePicture")
      .populate('skills')
      .populate('experiences')
      .populate('educations');
    
    if (!user || !user.privacySettings.isProfilePublic) {
      return res.status(403).json({ message: "Ce profil est privé ou n'existe pas" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Obtenir les recommandations de profil
const getProfileRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate('skills')
      .populate('experiences');

    // Logique de recommandation basée sur les compétences et expériences
    const recommendations = {
      similarProfiles: [],
      jobOpportunities: [],
      learningPaths: []
    };

    // Rechercher des profils avec des compétences similaires
    if (user.skills && user.skills.length > 0) {
      const skillNames = user.skills.map(skill => skill.name);
      
      recommendations.similarProfiles = await User.find({
        _id: { $ne: userId }, // Exclure l'utilisateur actuel
        'skills.name': { $in: skillNames }, // Profils avec des compétences similaires
        'privacySettings.isProfilePublic': true
      })
      .select('firstName lastName jobTitle skills profilePicture')
      .limit(5);
    }

    // Rechercher des opportunités d'emploi (cette logique serait généralement 
    // implémentée via un service externe ou une autre collection)
    recommendations.jobOpportunities = [
      {
        title: "Développeur Full Stack",
        company: "TechCorp",
        requiredSkills: ["JavaScript", "React", "Node.js"]
      },
      {
        title: "Ingénieur Data",
        company: "DataSolutions",
        requiredSkills: ["Python", "Machine Learning", "SQL"]
      }
    ];

    // Suggérer des parcours d'apprentissage basés sur les compétences
    recommendations.learningPaths = user.skills.map(skill => ({
      skillName: skill.name,
      suggestedCourses: [
        {
          name: `Master ${skill.name}`,
          platform: "Udemy",
          difficulty: "Intermediate"
        },
        {
          name: `Advanced ${skill.name} Techniques`,
          platform: "Coursera",
          difficulty: "Advanced"
        }
      ]
    }));

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des recommandations', error: error.message });
  }
};

// 📌 Mettre à jour les paramètres de confidentialité
const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      profileVisibility, 
      contactInfoVisibility, 
      experiencesVisibility 
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        privacySettings: {
          profileVisibility,
          contactInfoVisibility,
          experiencesVisibility
        }
      },
      { new: true }
    );

    res.status(200).json(updatedUser.privacySettings);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour des paramètres de confidentialité', 
      error: error.message 
    });
  }
};
const validatePassword = async (req, res) => {
  try {
    console.log('Validation request body:', req.body);
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: "Le mot de passe est requis" });
    }
    
    console.log('Looking for user with ID:', req.userId);
    const user = await User.findById(req.userId);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    console.log('User found, comparing passwords');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }
    
    res.json({ success: true, message: "Mot de passe valide" });
  } catch (error) {
    console.error('Full error details:', error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Exporter toutes les méthodes du contrôleur
module.exports = {
  getUserProfile,
  validatePassword,
  updateProfile,
  updatePassword,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  addSkill,
  deleteSkill,
  updateSocialLinks,
  uploadCV,
  deleteCV,
  addRating,
  toggleProfilePrivacy,
  getPublicProfile,
  getProfileRecommendations,
  updatePrivacySettings
};