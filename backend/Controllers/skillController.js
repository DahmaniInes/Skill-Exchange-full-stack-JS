const Skill = require("../Models/Skill");
const User = require('../Models/User');
const Roadmap = require('../Models/Roadmap');

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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
exports.getComplementarySkills = async (req, res) => {
  try {
    const { skills } = req.query;
    if (!skills) {
      return res.status(400).json({ message: 'Le paramètre skills est requis' });
    }
    const skillIds = skills.split(',');

    const complementaryCounts = {};

    // Pour chaque compétence de l'utilisateur
    for (const skillId of skillIds) {
      const usersWithSkill = await User.find({ skills: skillId }).select('skills');
      for (const user of usersWithSkill) {
        for (const userSkill of user.skills) {
          if (!skillIds.includes(userSkill.toString())) {
            complementaryCounts[userSkill] = (complementaryCounts[userSkill] || 0) + 1;
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
    const complementarySkills = await Skill.find({ _id: { $in: sortedSkills } });

    res.json(complementarySkills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// 📍 Récupérer une compétence par ID (Public)
// Contrôleur pour récupérer une compétence par ID
exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id); // Recherche dans la base de données
    if (!skill) {
      return res.status(404).json({ success: false, message: "Compétence non trouvée" });
    }
    res.status(200).json({ success: true, data: skill });
  } catch (error) {
    console.error("Erreur dans getSkillById:", error.message); // Log pour débogage
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};
exports.createSkill = async (req, res) => {
  try {
    const { name, description, categories, level, tags } = req.body;

    // Check if an image file is provided
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please provide an image.",
      });
    }

    // 📂 Get the image path
    const imageUrl = `/uploads/skills/${req.file.filename}`;

    // Validate categories and level against the schema enums
    const validCategories = [
      "Development",
      "Design",
      "Marketing",
      "Business",
      "Languages",
      "Music",
      "Art",
      "Science",
      "Technology",
      "Health",
      "Education",
      "Sports",
      "Other",
    ];
    const validLevels = ["Beginner", "Intermediate", "Advanced"];

    if (!categories || !Array.isArray(categories) || categories.some(cat => !validCategories.includes(cat))) {
      return res.status(400).json({
        success: false,
        message: "Invalid category or categories. Must be an array of valid categories.",
        validCategories,
      });
    }

    if (!level || !validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level.",
        validLevels,
      });
    }

    // Create the new skill
    const skill = new Skill({
      name,
      description,
      categories, // Accepts multiple categories
      level,
      tags: tags ? tags.split(",") : [], // Convert comma-separated tags to array
      imageUrl,
    });

    const savedSkill = await skill.save();

    res.status(201).json({
      success: true,
      message: "Skill created successfully",
      data: savedSkill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// 📍 Modifier une compétence (Privé)
exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.categories) {
      const validCategories = ["Développement", "Design", "Marketing", "Business", "Langues", "Musique", "Art", "Science", "Autres"];
      if (!Array.isArray(updateData.categories) || updateData.categories.some(cat => !validCategories.includes(cat))) {
        return res.status(400).json({ success: false, message: "Catégorie(s) invalide(s)", validCategories });
      }
    }

    if (updateData.level) {
      const validLevels = ["Débutant", "Intermédiaire", "Avancé"];
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

    const existingRatingIndex = skill.ratings.findIndex(r => r.userId === userId);

    if (existingRatingIndex !== -1) {
      skill.ratings[existingRatingIndex] = { userId, rating, comment };
    } else {
      skill.ratings.push({ userId, rating, comment });
    }

    skill.rating = skill.ratings.length > 0 
      ? skill.ratings.reduce((sum, r) => sum + r.rating, 0) / skill.ratings.length
      : 0;

    await skill.save();
    res.status(200).json({ success: true, message: "Note ajoutée avec succès", data: skill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Recherche des compétences (avec auto-complétion)
exports.searchSkills = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Le paramètre 'q' est requis." });

    const skills = await Skill.find({ name: new RegExp(query, "i") }).limit(10);
    res.json({ success: true, data: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// 📍 Récupérer les compétences avec recherche et tri (Public)
// 📍 Récupérer les compétences avec recherche, filtres et tri (Public)
exports.getSkills = async (req, res) => {
  try {
    // Récupération des paramètres de filtrage
    const { 
      query,                  // Recherche textuelle
      categories,             // Catégories séparées par virgule
      levels,                 // Niveaux séparés par virgule
      minRating,              // Note minimale
      sort                    // Option de tri (popular, rating, recent)
    } = req.query;
    
    // Initialisation de l'objet de requête
    let queryObj = {};
    
    // Filtre par recherche textuelle
    if (query) {
      queryObj.name = new RegExp(query, "i");
      
      // 🔥 Augmenter la popularité des compétences recherchées
      await Skill.updateMany(
        { name: new RegExp(query, "i") },
        { $inc: { popularity: 1 } } 
      );
    }
    
    // Filtre par catégories
    if (categories) {
      const categoryList = categories.split(',');
      queryObj.categories = { $in: categoryList };
    }
    
    // Filtre par niveaux
    if (levels) {
      const levelList = levels.split(',');
      queryObj.level = { $in: levelList };
    }
    
    // Filtre par note minimale
    if (minRating) {
      queryObj.rating = { $gte: parseFloat(minRating) };
    }
    
    // Option de tri
    let sortOption = {};
    if (sort === "popular") {
      sortOption = { popularity: -1 };
    } else if (sort === "rating") {
      sortOption = { rating: -1 };
    } else if (sort === "recent") {
      sortOption = { createdAt: -1 };
    } else {
      // Tri par défaut
      sortOption = { popularity: -1 };
    }
    
    // Exécution de la requête avec tous les filtres
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
