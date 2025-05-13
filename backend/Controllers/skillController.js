const Skill = require("../Models/Skill");
const User = require('../Models/User');
const Roadmap = require('../Models/Roadmap');
const Discussion = require('../Models/Discussion');
const mongoose = require('mongoose');

// 📍 Récupérer toutes les compétences (Public)
exports.getAllSkills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const skills = await Skill.find().skip(skip).limit(limit);
    const total = await Skill.countDocuments();

    res.status(200).json({
      success: true,
      data: skills,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};
exports.getAvailableSkills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const skills = await Skill.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Skill.countDocuments();

    res.status(200).json({
      success: true,
      data: skills,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching available skills:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};
// 📍 Récupérer les compétences complémentaires (Privé)
exports.getComplementarySkills = async (req, res) => {
  try {
    const { skills } = req.query;
    if (!skills) {
      return res.status(400).json({ success: false, message: 'Le paramètre skills est requis' });
    }
    const skillIds = skills.split(',');

    const complementaryCounts = {};

    // Pour chaque compétence de l'utilisateur
    for (const skillId of skillIds) {
      const usersWithSkill = await User.find({ 'skills.name': skillId }).select('skills');
      for (const user of usersWithSkill) {
        for (const userSkill of user.skills) {
          if (!skillIds.includes(userSkill.name)) {
            complementaryCounts[userSkill.name] = (complementaryCounts[userSkill.name] || 0) + 1;
          }
        }
      }
    }

    // Trier par fréquence décroissante et prendre les 5 premières
    const sortedSkills = Object.entries(complementaryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    // Récupérer les détails des compétences
    const complementarySkills = await Skill.find({ name: { $in: sortedSkills } });

    res.json({ success: true, data: complementarySkills });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// 📍 Récupérer une compétence par ID (Public)
exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).populate('ratings.user', 'firstName lastName profilePicture');
    if (!skill) {
      return res.status(404).json({ success: false, message: "Compétence non trouvée" });
    }
    res.status(200).json({ success: true, data: skill });
  } catch (error) {
    console.error("Erreur dans getSkillById:", error.message);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Créer une compétence (Privé)
exports.createSkill = async (req, res) => {
  try {
    const { name, description, categories, level, tags, videoUrl, estimatedTimeHours, learningOutcomes, topics, resources, relatedSkills, prerequisites, preparationSteps } = req.body;

    // Vérifier si une image est fournie
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir une image.",
      });
    }

    // 📂 Obtenir le chemin de l'image
    const imageUrl = `/uploads/skills/${req.file.filename}`;

    // Valider les catégories et le niveau
    const validCategories = [
      "Development", "Design", "Marketing", "Business", "Languages", 
      "Music", "Art", "Science", "Technology", "Health", "Education", 
      "Sports", "Other"
    ];
    const validLevels = ["Beginner", "Intermediate", "Advanced"];

    if (!categories || !Array.isArray(categories) || categories.some(cat => !validCategories.includes(cat))) {
      return res.status(400).json({
        success: false,
        message: "Catégorie(s) invalide(s).",
        validCategories,
      });
    }

    if (!level || !validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Niveau invalide.",
        validLevels,
      });
    }

  
// Controllers/skillController.js
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    }
    const fileUrl = req.file.path; // URL Cloudinary
    res.status(200).json({
      success: true,
      message: "Fichier téléchargé avec succès",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload :", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'upload" });
  }
};
    // Créer la nouvelle compétence
    const skill = new Skill({
      name,
      description,
      categories,
      level,
      tags: tags ? tags.split(",") : [],
      imageUrl,
      videoUrl,
      estimatedTimeHours: estimatedTimeHours || 10,
      learningOutcomes: learningOutcomes || [],
      topics: topics || [],
      resources: resources || [],
      relatedSkills: relatedSkills || [],
      prerequisites: prerequisites || [],
      preparationSteps: preparationSteps || [],
    });

    const savedSkill = await skill.save();

    res.status(201).json({
      success: true,
      message: "Compétence créée avec succès",
      data: savedSkill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
  // 📍 Récupérer les catégories disponibles (Public)
 
    exports.getCategories = async (req, res) => {
      try {
        // Récupérer les catégories depuis le schéma
        const categories = Skill.schema.path("categories").caster.enumValues;
        if (!categories || !Array.isArray(categories)) {
          throw new Error("Les catégories ne sont pas correctement définies dans le schéma");
        }
        res.status(200).json({ success: true, data: categories });
      } catch (error) {
        console.error("Erreur lors de la récupération des catégories :", error);
        res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
      }
    };
  
// 📍 Modifier une compétence (Privé)
exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Valider les catégories si elles sont mises à jour
    if (updateData.categories) {
      const validCategories = [
        "Development", "Design", "Marketing", "Business", "Languages", 
        "Music", "Art", "Science", "Technology", "Health", "Education", 
        "Sports", "Other"
      ];
      if (!Array.isArray(updateData.categories) || updateData.categories.some(cat => !validCategories.includes(cat))) {
        return res.status(400).json({ success: false, message: "Catégorie(s) invalide(s)", validCategories });
      }
    }

    // Valider le niveau si il est mis à jour
    if (updateData.level) {
      const validLevels = ["Beginner", "Intermediate", "Advanced"];
      if (!validLevels.includes(updateData.level)) {
        return res.status(400).json({ success: false, message: "Niveau invalide", validLevels });
      }
    }

    const updatedSkill = await Skill.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedSkill) return res.status(404).json({ success: false, message: "Compétence non trouvée" });

    res.status(200).json({ success: true, message: "Compétence mise à jour avec succès", data: updatedSkill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Supprimer une compétence (Privé)
exports.deleteSkill = async (req, res) => {
  try {
    const deletedSkill = await Skill.findByIdAndDelete(req.params.id);
    if (!deletedSkill) return res.status(404).json({ success: false, message: "Compétence non trouvée" });

    // Supprimer les discussions associées
    await Discussion.deleteMany({ skill: req.params.id });

    // Supprimer les roadmaps associées
    await Roadmap.deleteMany({ skill: req.params.id });

    // Retirer la compétence des favoris des utilisateurs
    await User.updateMany(
      { bookmarks: req.params.id },
      { $pull: { bookmarks: req.params.id } }
    );

    // Retirer la compétence des progressions des utilisateurs
    await User.updateMany(
      { 'progress.skill': req.params.id },
      { $pull: { progress: { skill: req.params.id } } }
    );

    res.status(200).json({ success: true, message: "Compétence supprimée avec succès", data: deletedSkill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Noter une compétence (Privé)
exports.rateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "La note doit être entre 1 et 5" });
    }

    const skill = await Skill.findById(id);
    if (!skill) return res.status(404).json({ success: false, message: "Compétence non trouvée" });

    const existingRatingIndex = skill.ratings.findIndex(r => r.user.toString() === userId);

    if (existingRatingIndex !== -1) {
      skill.ratings[existingRatingIndex] = { user: userId, rating, comment, createdAt: Date.now() };
    } else {
      skill.ratings.push({ user: userId, rating, comment, createdAt: Date.now() });
    }

    skill.rating = skill.ratings.length > 0 
      ? skill.ratings.reduce((sum, r) => sum + r.rating, 0) / skill.ratings.length
      : 0;

    await skill.save();
    const updatedSkill = await Skill.findById(id).populate('ratings.user', 'firstName lastName profilePicture');
    res.status(200).json({ success: true, message: "Note ajoutée avec succès", data: updatedSkill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Répondre à un avis (Privé)
exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.userId;

    if (!comment) {
      return res.status(400).json({ success: false, message: 'Commentaire requis' });
    }

    const skill = await Skill.findOne({ 'ratings._id': reviewId });
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Avis non trouvé' });
    }

    const review = skill.ratings.id(reviewId);
    review.replies.push({
      user: userId,
      comment,
      createdAt: Date.now()
    });

    await skill.save();
    const updatedSkill = await Skill.findOne({ 'ratings._id': reviewId })
      .populate('ratings.user', 'firstName lastName profilePicture')
      .populate('ratings.replies.user', 'firstName lastName profilePicture');

    res.status(200).json({ success: true, message: "Réponse ajoutée avec succès", data: updatedSkill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Recherche des compétences (avec auto-complétion)
exports.searchSkills = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ success: false, message: "Le paramètre 'q' est requis." });

    const skills = await Skill.find({ name: new RegExp(query, "i") }).limit(10);
    res.json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Récupérer les compétences avec recherche, filtres et tri (Public)
exports.getSkills = async (req, res) => {
  try {
    const { 
      query, categories, levels, minRating, sort 
    } = req.query;
    
    let queryObj = {};
    
    if (query) {
      queryObj.name = new RegExp(query, "i");
      await Skill.updateMany(
        { name: new RegExp(query, "i") },
        { $inc: { popularity: 1 } } 
      );
    }
    
    if (categories) {
      const categoryList = categories.split(',');
      queryObj.categories = { $in: categoryList };
    }
    
    if (levels) {
      const levelList = levels.split(',');
      queryObj.level = { $in: levelList };
    }
    
    if (minRating) {
      queryObj.rating = { $gte: parseFloat(minRating) };
    }
    
    let sortOption = {};
    if (sort === "popular") {
      sortOption = { popularity: -1 };
    } else if (sort === "rating") {
      sortOption = { rating: -1 };
    } else if (sort === "recent") {
      sortOption = { createdAt: -1 };
    } else {
      sortOption = { popularity: -1 };
    }
    
    const skills = await Skill.find(queryObj).sort(sortOption);
    
    res.json({ 
      success: true, 
      count: skills.length,
      data: skills 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des compétences:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

// 📍 Récupérer la progression d'un utilisateur pour une compétence (Privé)
exports.getUserProgress = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: "Invalid user ID" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const skillProgress = user.progress.find(p => p.skill.toString() === skillId);
    if (!skillProgress) {
      const steps = [
        { title: 'Introduction', completed: false },
        { title: 'Practice', completed: false },
        { title: 'Mastery', completed: false }
      ];
      user.progress.push({ skill: skillId, steps, badges: [] });
      await user.save();
      return res.json({ success: true, progress: steps, badges: [] });
    }
    res.json({ success: true, progress: skillProgress.steps, badges: skillProgress.badges });
  } catch (error) {
    console.error("Error in getUserProgress:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
// 📍 Mettre à jour la progression d'un utilisateur pour une compétence (Privé)
exports.updateUserProgress = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { stepIndex, completed } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    const skillProgress = user.progress.find(p => p.skill.toString() === skillId);

    if (!skillProgress) {
      return res.status(404).json({ success: false, message: 'Progression non trouvée' });
    }

    skillProgress.steps[stepIndex].completed = completed;

    // Ajouter un badge si toutes les étapes sont terminées
    if (skillProgress.steps.every(step => step.completed)) {
      skillProgress.badges.push({ name: 'Mastery Achieved', icon: '🏆' });
    }

    await user.save();
    res.json({ success: true, message: "Progression mise à jour avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Ajouter une compétence aux favoris d'un utilisateur (Privé)
exports.addBookmark = async (req, res) => {
  try {
    const { skillId } = req.body;
    const userId = req.userId;

    if (!skillId) {
      return res.status(400).json({ success: false, message: 'ID de compétence requis' });
    }

    const user = await User.findById(userId);
    if (user.bookmarks.includes(skillId)) {
      return res.status(400).json({ success: false, message: 'Compétence déjà dans les favoris' });
    }

    user.bookmarks.push(skillId);
    await user.save();
    res.json({ success: true, message: "Compétence ajoutée aux favoris" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Supprimer une compétence des favoris d'un utilisateur (Privé)
exports.removeBookmark = async (req, res) => {
  try {
    const { skillId } = req.body;
    const userId = req.userId;

    if (!skillId) {
      return res.status(400).json({ success: false, message: 'ID de compétence requis' });
    }

    const user = await User.findById(userId);
    user.bookmarks = user.bookmarks.filter(id => id.toString() !== skillId);
    await user.save();

    res.json({ success: true, message: "Compétence retirée des favoris" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

exports.getDiscussions = async (req, res) => {
  try {
    const { skillId } = req.params;

    // Validate skillId
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return res.status(400).json({ success: false, message: "Invalid skill ID" });
    }

    // Check if skill exists
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ success: false, message: "Skill not found" });
    }

    const discussions = await Discussion.find({ skill: skillId })
      .populate("user", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    res.json({ success: true, discussions });
  } catch (error) {
    console.error("Error fetching discussions:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 📍 Ajouter une nouvelle discussion pour une compétence (Protected)
exports.addDiscussion = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { content } = req.body;
    const userId = req.userId; // Set by verifySession middleware

    // Validate skillId
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return res.status(400).json({ success: false, message: "Invalid skill ID" });
    }

    // Check if skill exists
    const skill = await Skill.findById(skillId);
    if (!skill) {
      return res.status(404).json({ success: false, message: "Skill not found" });
    }

    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Discussion content cannot be empty" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create new discussion
    const newDiscussion = new Discussion({
      skill: skillId,
      user: userId,
      content: content.trim(),
    });

    // Save the discussion
    await newDiscussion.save();

    // Populate the user field for the response
    const populatedDiscussion = await Discussion.findById(newDiscussion._id).populate(
      "user",
      "firstName lastName profilePicture"
    );

    res.status(201).json({ success: true, discussion: populatedDiscussion });
  } catch (error) {
    console.error("Error adding discussion:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 📍 Vérifier si une feuille de route existe pour une compétence (Privé)
exports.getRoadmapBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.userId;

    const roadmap = await Roadmap.findOne({ skill: skillId, user: userId });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Feuille de route non trouvée' });
    }

    res.json({ success: true, roadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};
exports.getBookmarks = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('Fetching bookmarks for userId:', userId); // Debug log

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID provided' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId); // Debug log
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).select('bookmarks');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, bookmarks: user.bookmarks || [] });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};