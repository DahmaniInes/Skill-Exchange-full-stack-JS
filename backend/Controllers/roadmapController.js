const User = require('../Models/User');
const Roadmap = require('../Models/Roadmap');

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');
const { Ollama } = require('ollama'); // Correction ici

// Cache pour stocker les roadmaps générées
const roadmapCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 }); // TTL: 24h


const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://localhost:11435'
  });


const MODELS = {
  DEFAULT: "mistral", 
  FALLBACK: "tinyllama" 
};


function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}


async function callOllamaWithRateLimiting(messages, model = MODELS.DEFAULT, maxTokens = 1500) {
  const MAX_RETRIES = 8;
  const BASE_DELAY = 1000; 
  const MAX_DELAY = 120000; 
  
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      console.log(`Tentative d'appel Ollama (${attempts+1}/${MAX_RETRIES}) avec modèle ${model}`);
      
      // Formatage du prompt pour Ollama
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessage = messages.find(m => m.role === 'user')?.content || '';
      
      const prompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;
      
      const response = await ollama.generate({
        model: model,
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: maxTokens
        }
      });
      
      // Formater la réponse pour correspondre au format attendu
      return {
        choices: [{
          message: {
            content: response.response
          }
        }]
      };
    } catch (error) {
      attempts++;
      
      // Identifier si c'est une erreur de disponibilité du modèle ou du serveur
      const isModelError = error.message?.includes('model') || error.message?.includes('not found');
      const isServerError = error.message?.includes('connection') || error.message?.includes('timeout');
      
      // Décider si on réessaie
      if ((isModelError || isServerError) && attempts < MAX_RETRIES) {
        // Backoff exponentiel avec légère variation aléatoire pour éviter les collisions
        const delay = Math.min(
          BASE_DELAY * Math.pow(2, attempts - 1) * (1 + Math.random() * 0.2),
          MAX_DELAY
        );
        
        console.log(`Erreur API (${error.message}). Nouvelle tentative dans ${delay/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Si c'est une erreur de modèle et qu'on utilise le modèle par défaut, essayer le modèle de secours
        if (isModelError && model === MODELS.DEFAULT && attempts > 3) {
          console.log(`Passage au modèle de secours: ${MODELS.FALLBACK}`);
          model = MODELS.FALLBACK;
        }
        
        continue;
      }
      
      // Pour les autres erreurs ou si max d'essais atteint
      console.error(`Échec définitif après ${attempts} tentatives:`, error);
      throw error;
    }
  }
  
  throw new Error(`Nombre maximum de tentatives (${MAX_RETRIES}) dépassé pour l'appel à l'API Ollama`);
}

exports.generatePersonalizedRoadmap = async (req, res) => {
    try {
      const { skill, goals, timeframe = 3, preferences = {} } = req.body;
      const userId = req.userId; // Récupération depuis le middleware
  
      // Validation améliorée
      if (!skill?.id || !goals?.length) {
        return res.status(400).json({
          success: false,
          message: 'Les paramètres skill.id et goals sont obligatoires'
        });
      }
  
      // Vérification de la compétence avec population
      const skillExists = await mongoose.model('Skill')
        .findById(skill.id)
        .select('name level category')
        .lean();
  
      if (!skillExists) {
        return res.status(404).json({
          success: false,
          message: 'Compétence non trouvée'
        });
      }
      
      // Récupérer l'utilisateur - FIX: Ajouter cette ligne manquante
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
  
      // Construction sécurisée du cacheKey
      const cacheKeyComponents = [
        userId,
        skill.id,
        ...goals,
        timeframe,
        preferences.learningStyle || 'default'
      ];
      const cacheKey = `roadmap:${cacheKeyComponents.join('|')}`;
    
    // Vérifier si nous avons une version en cache
    const cachedRoadmap = roadmapCache.get(cacheKey);
    if (cachedRoadmap) {
      console.log("Utilisation d'une roadmap en cache");
      
      // Créer la nouvelle roadmap avec les données en cache
      const newRoadmap = new Roadmap({
        userId,
        skillId: skill.id,
        title: cachedRoadmap.title,
        description: cachedRoadmap.description,
        steps: cachedRoadmap.steps.map(step => ({
          skillId: skill.id,
          userId,
          title: step.title,
          description: step.description,
          duration: step.duration,
          resources: step.resources,
          progressIndicators: step.progressIndicators,
          completed: false
        })),
        overallProgress: 0,
        createdAt: Date.now()
      });
      
      const savedRoadmap = await newRoadmap.save();
      
      // Ajouter la référence à l'utilisateur
      user.roadmaps = user.roadmaps || [];
      user.roadmaps.push(savedRoadmap._id);
      await user.save();
      
      return res.status(201).json({
        success: true,
        roadmap: savedRoadmap,
        source: 'cache'
      });
    }
    
    // Générer une nouvelle roadmap
    try {
      // Préparer le prompt optimisé pour l'IA
      const prompt = generateOptimizedPrompt(user, skill, goals, timeframe, preferences);
      
      // Générer la roadmap avec l'IA
      const roadmapData = await generateRoadmapWithAI(prompt);
      
      // Mettre en cache pour les futures demandes
      roadmapCache.set(cacheKey, roadmapData);
      
      // Créer la nouvelle roadmap
      const newRoadmap = new Roadmap({
        userId,
        skillId: skill.id,
        title: roadmapData.title || `Roadmap: ${goals.join(', ')}`,
        description: roadmapData.description || `Roadmap pour atteindre: ${goals.join(', ')} en ${timeframe} mois`,
        steps: roadmapData.steps.map(step => ({
          skillId: skill.id,
          userId,
          title: step.title,
          description: step.description,
          duration: step.duration,
          resources: step.resources,
          progressIndicators: step.progressIndicators || [],
          completed: false
        })),
        overallProgress: 0,
        createdAt: Date.now()
      });
      
      const savedRoadmap = await newRoadmap.save();
      console.log("Nouvelle roadmap créée avec ID:", savedRoadmap._id);
      
      // Ajouter la référence à l'utilisateur
      user.roadmaps = user.roadmaps || [];
      user.roadmaps.push(savedRoadmap._id);
      await user.save();
      
      return res.status(201).json({
        success: true,
        roadmap: savedRoadmap
      });
    } catch (aiError) {
      console.error("Erreur lors de la génération avec IA:", aiError);
      
      // Générer une roadmap de secours
      const fallbackData = generateFallbackRoadmap(skill.level || 'Débutant', goals, timeframe);
      
      const newRoadmap = new Roadmap({
        userId,
        skillId: skill.id,
        title: fallbackData.title,
        description: fallbackData.description,
        steps: fallbackData.steps.map(step => ({
          skillId: skill.id,
          userId,
          title: step.title,
          description: step.description,
          duration: step.duration,
          resources: step.resources,
          progressIndicators: step.progressIndicators,
          completed: false
        })),
        overallProgress: 0,
        createdAt: Date.now()
      });
      
      const savedRoadmap = await newRoadmap.save();
      console.log("Roadmap de secours créée avec ID:", savedRoadmap._id);
      
      // Ajouter la référence à l'utilisateur
      user.roadmaps = user.roadmaps || [];
      user.roadmaps.push(savedRoadmap._id);
      await user.save();
      
      return res.status(201).json({
        success: true,
        roadmap: savedRoadmap,
        message: "Roadmap générée avec le système de secours"
      });
    }
  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).json({ 
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.stack : 'Erreur interne du serveur'
    });
  }
};


// Fonction pour générer un prompt optimisé pour l'IA
function generateOptimizedPrompt(user, skill, goals, timeframe, preferences) {
  return `
  Génère une roadmap d'apprentissage JSON pour:
  
  Utilisateur: niveau ${skill?.level || 'Débutant'} en ${skill?.category || 'Général'}
  Objectifs: ${(goals || ['Maîtriser les bases']).join(', ')}
  Durée: ${timeframe} mois, ${preferences.availability} heures/semaine, style: ${preferences.learningStyle}
  
  Format JSON requis:
  {
    "title": "titre concis",
    "description": "description brève",
    "steps": [
      {
        "title": "titre étape",
        "description": "description étape",
        "duration": "durée",
        "resources": ["ressource1", "ressource2"],
        "progressIndicators": ["indicateur1", "indicateur2"]
      }
    ]
  }
  `;
}

// Fonction optimisée pour appeler l'API de l'IA
async function generateRoadmapWithAI(prompt) {
  try {
    const promptTokens = estimateTokens(prompt);
    const maxResponseTokens = Math.min(2000, 4000 - promptTokens); // Ne pas dépasser le contexte total
    
    const messages = [
      { role: "system", content: "Tu es un expert en création de parcours d'apprentissage personnalisés. Tu réponds uniquement au format JSON." },
      { role: "user", content: prompt }
    ];
    
    const response = await callOllamaWithRateLimiting(messages, MODELS.DEFAULT, maxResponseTokens);
    
    // Traiter la réponse
    const content = response.choices[0].message.content;
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      // Tentative de nettoyage du contenu (supprimer les backticks et identifiants JSON)
      const cleanedContent = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      try {
        parsedContent = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        console.error("Échec du second parsing après nettoyage:", secondParseError);
        // Tenter une extraction avec regex pour le contenu JSON
        const jsonMatch = content.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            parsedContent = JSON.parse(jsonMatch[0]);
          } catch (thirdParseError) {
            console.error("Échec de toutes les tentatives de parsing. Génération d'une structure par défaut");
            // Structure par défaut si toutes les tentatives échouent
            parsedContent = {
              title: "Roadmap personnalisée",
              description: "Plan d'apprentissage généré automatiquement",
              steps: [
                {
                  title: "Démarrage",
                  description: "Première étape d'apprentissage",
                  duration: "2 semaines",
                  resources: ["Documentation en ligne"],
                  progressIndicators: ["Exercice pratique"]
                }
              ]
            };
          }
        } else {
          throw new Error("Format de réponse invalide: impossible d'extraire du JSON");
        }
      }
    }
    
    // S'assurer que la structure est correcte
    if (!parsedContent.steps || !Array.isArray(parsedContent.steps)) {
      throw new Error("Format de réponse invalide: 'steps' manquant ou pas un tableau");
    }
    
    return {
      title: parsedContent.title || "Roadmap personnalisée",
      description: parsedContent.description || "Roadmap générée par IA",
      steps: parsedContent.steps.map(step => ({
        title: step.title || "Étape",
        description: step.description || "Description de l'étape",
        duration: step.duration || "2 semaines",
        resources: Array.isArray(step.resources) ? step.resources : ["Documentation en ligne"],
        progressIndicators: Array.isArray(step.progressIndicators) ? 
                            step.progressIndicators : 
                            (Array.isArray(step.indicateurs) ? step.indicateurs : ["Exercice pratique"]),
        completed: false
      }))
    };
  } catch (error) {
    console.error("Échec de génération avec l'IA:", error);
    throw error;
  }
}

// Fonction améliorée pour générer une roadmap de secours
function generateFallbackRoadmap(level = 'Débutant', goals = [], timeframe = '3') {
  console.log("Génération d'une roadmap par défaut (fallback)");
  
  const goalText = goals.length > 0 ? goals.join(', ') : 'progression générale';
  const totalWeeks = parseInt(timeframe, 10) * 4; // Semaines approximatives
  
  // Adapter le nombre d'étapes en fonction de la durée
  const totalSteps = Math.max(3, Math.min(9, Math.ceil(parseInt(timeframe, 10) * 1.5)));
  
  // Difficulté adaptée au niveau
  const difficulty = level.toLowerCase().includes('débutant') ? 'fondamentaux' : 
                    level.toLowerCase().includes('intermédiaire') ? 'concepts intermédiaires' : 
                    'concepts avancés';
  
  // Phases d'apprentissage
  const phases = [
    { name: "Découverte", weight: 0.2, resources: ["Documentation officielle", "Tutoriels débutants", "Vidéos d'introduction"] },
    { name: "Fondamentaux", weight: 0.3, resources: ["Cours en ligne", "Exercices pratiques", "Documentation de référence"] },
    { name: "Pratique", weight: 0.3, resources: ["Projets guidés", "Études de cas", "Forums communautaires"] },
    { name: "Perfectionnement", weight: 0.2, resources: ["Livres spécialisés", "Cours avancés", "Projets personnels"] }
  ];
  
  const steps = [];
  let currentWeek = 0;
  
  // Générer les étapes
  for (let i = 0; i < Math.min(totalSteps, phases.length); i++) {
    const phase = phases[i];
    const phaseWeeks = Math.max(1, Math.round(totalWeeks * phase.weight));
    
    steps.push({
      title: `Phase ${i+1}: ${phase.name} des ${difficulty}`,
      description: `${phase.name} dans le domaine ciblant: ${goalText}`,
      duration: `${phaseWeeks} semaines`,
      resources: phase.resources,
      progressIndicators: [
        "Quiz de compréhension", 
        `Mini-projet de ${phase.name.toLowerCase()}`,
        "Auto-évaluation des compétences"
      ],
      completed: false
    });
    
    currentWeek += phaseWeeks;
  }
  
  return {
    title: `Roadmap: ${goalText} (${timeframe} mois)`,
    description: `Plan d'apprentissage pour ${goalText} adapté au niveau ${level}, sur ${timeframe} mois`,
    steps: steps
  };
}

// Adapter également la fonction pour les ajustements avec feedback
async function generateAdjustmentsWithRateLimiting(currentSteps, feedback, progress) {
  // Ne pas appeler l'IA si le feedback est vide ou trop court
  if (!feedback || feedback.length < 10) {
    console.log("Feedback trop court, pas d'appel à l'IA");
    return currentSteps;
  }
  
  const prompt = `
  Roadmap actuelle:
  ${JSON.stringify(currentSteps, null, 2)}
  
  Feedback utilisateur:
  ${feedback}
  
  Progression: ${progress || 'non spécifiée'}
  
  Ajuste les étapes de la roadmap selon le feedback et la progression. Modifie la difficulté, ajoute des ressources ou ajuste les durées si nécessaire.
  Retourne uniquement la liste des étapes modifiées au format JSON.
  `;
  
  try {
    const messages = [
      { role: "system", content: "Tu es un expert en adaptation de parcours d'apprentissage. Réponds uniquement au format JSON." },
      { role: "user", content: prompt }
    ];
    
    const response = await callOllamaWithRateLimiting(
      messages, 
      MODELS.DEFAULT, 
      1000 // Réduire les tokens pour cet appel moins critique
    );
    
    const content = response.choices[0].message.content;
    
    try {
      // Essayer de parser directement
      const adjustedSteps = JSON.parse(content);
      return Array.isArray(adjustedSteps) ? adjustedSteps : currentSteps;
    } catch (parseError) {
      // Tenter de nettoyer et réessayer de parser
      const cleanedContent = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      try {
        const adjustedSteps = JSON.parse(cleanedContent);
        return Array.isArray(adjustedSteps) ? adjustedSteps : currentSteps;
      } catch (secondParseError) {
        console.error("Impossible de parser la réponse après nettoyage:", secondParseError);
        return currentSteps;
      }
    }
  } catch (error) {
    console.error("Erreur lors de la génération des ajustements:", error);
    return currentSteps;
  }
}

// N'oubliez pas de mettre à jour la référence dans cette fonction
exports.updateRoadmapWithAIFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, progress } = req.body;
    
    console.log(`Mise à jour de la roadmap ${id} avec feedback`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Format d'ID invalide" 
      });
    }
    
    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Roadmap non trouvée' 
      });
    }
    
    try {
      // Vérifier si le feedback est substantiel
      if (feedback && feedback.length > 10) {
        // Générer des ajustements basés sur le feedback
        const adjustedSteps = await generateAdjustmentsWithRateLimiting(roadmap.steps, feedback, progress);
        roadmap.steps = adjustedSteps;
      }
      
      // Mettre à jour la progression globale si fournie
      if (progress && typeof progress === 'number') {
        roadmap.overallProgress = Math.min(100, Math.max(0, progress));
      }
      
      roadmap.lastUpdated = Date.now();
      const updatedRoadmap = await roadmap.save();
      
      return res.status(200).json({
        success: true,
        roadmap: updatedRoadmap
      });
    } catch (aiError) {
      console.error("Erreur avec l'IA pour les ajustements:", aiError);
      
      // En cas d'erreur, mettre à jour uniquement le timestamp
      roadmap.lastUpdated = Date.now();
      const updatedRoadmap = await roadmap.save();
      
      return res.status(200).json({
        success: true,
        roadmap: updatedRoadmap,
        message: "Feedback enregistré mais pas d'ajustements IA effectués"
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la roadmap',
      error: error.message
    });
  }
};
// Dans roadmapController.js (backend)
// Correction pour getRoadmapBySkillId  
exports.getRoadmapBySkillId = async (req, res) => {
    try {
      const { skillId } = req.params;
      
      // Debug: Vérifier les paramètres
      console.log("[DEBUG] Recherche roadmap pour skillId:", skillId);
      
      // Vérification de l'ObjectID
      if (!mongoose.Types.ObjectId.isValid(skillId)) {
        return res.status(400).json({ 
          success: false,
          message: "Format de skillId invalide" 
        });
      }
  
      // Récupération de l'ID utilisateur depuis le middleware
      const userId = req.userId;
  
      if (!userId) {
        console.error("[ERREUR] UserID manquant dans req.userId");
        return res.status(401).json({ 
          success: false,
          message: "Authentification requise" 
        });
      }
  
      // Debug: Afficher les IDs
      console.log(`[DEBUG] Recherche roadmap pour userId:${userId} | skillId:${skillId}`);
  
      // Vérification si l'utilisateur existe
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }
      
      const roadmap = await Roadmap.findOne({ 
        userId,
        skillId: skillId
      });
  
      if (!roadmap) {
        console.log(`[INFO] Aucune roadmap trouvée pour userId:${userId}, skillId:${skillId}`);
        return res.status(404).json({ 
          success: false,
          message: "Aucune roadmap trouvée pour cette compétence" 
        });
      }
  
      res.status(200).json({ success: true, roadmap });
      
    } catch (error) {
      console.error("[ERREUR] Recherche par compétence:", error);
      res.status(500).json({ 
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
};

exports.getUserRoadmaps = async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Récupération des roadmaps pour l'utilisateur:", userId);
      
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log("Format d'ID utilisateur invalide:", userId);
        return res.status(400).json({ 
          success: false, 
          message: "Format d'ID utilisateur invalide" 
        });
      }
      
      const roadmaps = await Roadmap.find({ userId }).sort({ createdAt: -1 });
      console.log(`${roadmaps.length} roadmaps trouvées pour l'utilisateur ${userId}`);
      
      return res.status(200).json({
        success: true,
        roadmaps
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des roadmaps:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des roadmaps',
        error: error.message
      });
    }
  };

exports.updateRoadmapStep = async (req, res) => {
  try {
    const { id, stepIndex } = req.params;
    const { completed, overallProgress } = req.body;
    
    console.log(`Mise à jour de l'étape ${stepIndex} de la roadmap ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Format d'ID invalide" 
      });
    }
    
    // Convertir l'index en nombre
    const stepIndexNum = parseInt(stepIndex, 10);
    if (isNaN(stepIndexNum)) {
      return res.status(400).json({ 
        success: false,
        message: "L'index de l'étape doit être un nombre" 
      });
    }
    
    // Trouver la roadmap
    const roadmap = await Roadmap.findById(id);
    
    if (!roadmap) {
      return res.status(404).json({ 
        success: false,
        message: "Roadmap non trouvée" 
      });
    }
    
    // Vérifier si l'index est valide
    if (stepIndexNum < 0 || stepIndexNum >= roadmap.steps.length) {
      return res.status(400).json({ 
        success: false,
        message: "Index d'étape invalide" 
      });
    }
    
    // Mettre à jour l'étape spécifique
    roadmap.steps[stepIndexNum].completed = completed;
    
    // Mettre à jour la progression globale si fournie, sinon la calculer
    if (typeof overallProgress === 'number') {
      roadmap.overallProgress = Math.min(100, Math.max(0, overallProgress));
    } else {
      // Calculer la progression basée sur les étapes complétées
      const completedSteps = roadmap.steps.filter(step => step.completed).length;
      roadmap.overallProgress = Math.round((completedSteps / roadmap.steps.length) * 100);
    }
    
    roadmap.lastUpdated = Date.now();
    
    // Sauvegarder la roadmap mise à jour
    const updatedRoadmap = await roadmap.save();
    
    return res.status(200).json({ 
      success: true, 
      roadmap: updatedRoadmap 
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'étape:", error);
    return res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la mise à jour de l'étape", 
      error: error.message 
    });
  }
};

// Controllers/roadmapController.js
exports.getRoadmapBySkillId = async (req, res) => {
    try {
        const { skillId } = req.params;
        const userId = req.userId;
    
        const roadmap = await Roadmap.findOne({ userId, skillId })
          .populate('skillId', 'name level category')
          .lean();
    
        if (!roadmap) {
          return res.status(404).json({
            success: false,
            message: "Aucune roadmap trouvée"
          });
        }      
    } catch (error) {
      console.error("[ERREUR] Recherche par compétence:", error);
      res.status(500).json({ 
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
// Nouvelle route pour supprimer une roadmap
exports.deleteRoadmap = async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Format d'ID invalide" 
        });
      }
      
      const roadmap = await Roadmap.findById(id);
      if (!roadmap) {
        return res.status(404).json({ 
          success: false,
          message: "Roadmap non trouvée" 
        });
      }
      
      // Vérifier si l'utilisateur est autorisé (Note: correction de req.user à req.userId)
      if (roadmap.userId.toString() !== req.userId) {
        return res.status(403).json({ 
          success: false,
          message: "Non autorisé à supprimer cette roadmap" 
        });
      }
      
      // Mettre à jour la référence dans l'objet utilisateur
      const user = await User.findById(req.userId);
      if (user && user.roadmaps) {
        user.roadmaps = user.roadmaps.filter(roadmapId => roadmapId.toString() !== id);
        await user.save();
      }
      
      await Roadmap.findByIdAndDelete(id);
      
      return res.status(200).json({ 
        success: true,
        message: "Roadmap supprimée avec succès" 
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la roadmap:", error);
      return res.status(500).json({ 
        success: false,
        message: "Erreur serveur lors de la suppression de la roadmap", 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  exports.getRoadmapById = async (req, res) => {
    try {
      const { id } = req.params;
      
      const roadmap = await Roadmap.findById(id);
      
      if (!roadmap) {
        return res.status(404).json({ 
          success: false,
          message: "Roadmap non trouvée" 
        });
      }
      
      // Vérifier si l'utilisateur est autorisé à voir cette roadmap
      if (roadmap.userId.toString() !== req.userId) {
        return res.status(403).json({ 
          success: false,
          message: "Non autorisé à accéder à cette roadmap" 
        });
      }
      
      res.status(200).json({ success: true, roadmap });
      
    } catch (error) {
      console.error("Erreur lors de la récupération de la roadmap:", error);
      res.status(500).json({ 
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };