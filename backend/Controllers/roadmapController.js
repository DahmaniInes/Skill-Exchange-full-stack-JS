const User = require('../Models/User');
const Roadmap = require('../Models/Roadmap');
const Skill = require('../Models/Skill');
const mongoose = require('mongoose');
const NodeCache = require('node-cache');
const { Ollama } = require('ollama');
const PDFDocument = require('pdfkit'); // Ajouter pour générer des PDFs
const fs = require('fs'); // Pour écrire des fichiers
const path = require('path'); // Pour gérer les chemins de fichiers
const { Parser } = require('json2csv'); // Ajouter pour générer des CSVs

// Cache for storing generated roadmaps
const roadmapCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11435'
});

const MODELS = {
  DEFAULT: "mistral",
  FALLBACK: "tinyllama"
};

// Estimate the number of tokens
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Call Ollama with rate limiting
async function callOllamaWithRateLimiting(messages, model = MODELS.DEFAULT, maxTokens = 1500) {
  const MAX_RETRIES = 8;
  const BASE_DELAY = 1000;
  const MAX_DELAY = 120000;

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      console.log(`Attempting Ollama call (${attempts + 1}/${MAX_RETRIES}) with model ${model}`);

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

      return {
        choices: [{
          message: {
            content: response.response
          }
        }]
      };
    } catch (error) {
      attempts++;
      const isModelError = error.message?.includes('model') || error.message?.includes('not found');
      const isServerError = error.message?.includes('connection') || error.message?.includes('timeout');

      if ((isModelError || isServerError) && attempts < MAX_RETRIES) {
        const delay = Math.min(
          BASE_DELAY * Math.pow(2, attempts - 1) * (1 + Math.random() * 0.2),
          MAX_DELAY
        );

        console.log(`API error (${error.message}). Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        if (isModelError && model === MODELS.DEFAULT && attempts > 3) {
          console.log(`Switching to fallback model: ${MODELS.FALLBACK}`);
          model = MODELS.FALLBACK;
        }
        continue;
      }

      console.error(`Failed after ${attempts} attempts:`, error);
      throw error;
    }
  }

  throw new Error(`Maximum attempts (${MAX_RETRIES}) exceeded for Ollama API call`);
}

// Generate a personalized roadmap
exports.generatePersonalizedRoadmap = async (req, res) => {
  try {
    const { skill, goals, timeframe = 3, preferences = {} } = req.body;
    const userId = req.userId;

    if (!skill?.id || !goals?.length) {
      return res.status(400).json({
        success: false,
        message: 'Parameters skill.id and goals are required'
      });
    }

    const skillExists = await Skill.findById(skill.id).select('name level categories').lean();
    if (!skillExists) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const cacheKeyComponents = [
      userId,
      skill.id,
      ...goals,
      timeframe,
      preferences.learningStyle || 'default'
    ];
    const cacheKey = `roadmap:${cacheKeyComponents.join('|')}`;

    const cachedRoadmap = roadmapCache.get(cacheKey);
    if (cachedRoadmap) {
      console.log("Using cached roadmap");

      const newRoadmap = new Roadmap({
        user: userId,
        skill: skill.id,
        title: cachedRoadmap.title,
        description: cachedRoadmap.description,
        steps: cachedRoadmap.steps.map(step => ({
          title: step.title,
          description: step.description,
          duration: step.duration,
          resources: step.resources,
          progressIndicators: step.progressIndicators,
          completed: false,
          notes: step.notes || '',
          dependencies: step.dependencies || []
        })),
        createdAt: Date.now()
      });

      const savedRoadmap = await newRoadmap.save();

      return res.status(201).json({
        success: true,
        roadmap: savedRoadmap,
        source: 'cache'
      });
    }

    try {
      const prompt = generateOptimizedPrompt(user, skillExists, goals, timeframe, preferences);
      const roadmapData = await generateRoadmapWithAI(prompt);

      roadmapCache.set(cacheKey, roadmapData);

      const newRoadmap = new Roadmap({
        user: userId,
        skill: skill.id,
        title: roadmapData.title,
        description: roadmapData.description,
        steps: roadmapData.steps.map(step => ({
          title: step.title,
          description: step.description,
          duration: step.duration,
          resources: step.resources,
          progressIndicators: step.progressIndicators,
          completed: false,
          notes: step.notes || '',
          dependencies: step.dependencies || []
        })),
        createdAt: Date.now()
      });

      const savedRoadmap = await newRoadmap.save();
      console.log("New roadmap created with ID:", savedRoadmap._id);

      return res.status(201).json({
        success: true,
        roadmap: savedRoadmap
      });
    } catch (aiError) {
      console.error("Error during AI generation:", aiError);

      const fallbackData = generateFallbackRoadmap(skillExists.level || 'Beginner', goals, timeframe);

      const newRoadmap = new Roadmap({
        user: userId,
        skill: skill.id,
        title: fallbackData.title,
        description: fallbackData.description,
        steps: fallbackData.steps.map(step => ({
          title: step.title,
          description: step.description,
          duration: step.duration,
          resources: step.resources,
          progressIndicators: step.progressIndicators,
          completed: false,
          notes: step.notes || '',
          dependencies: step.dependencies || []
        })),
        createdAt: Date.now()
      });

      const savedRoadmap = await newRoadmap.save();
      console.log("Fallback roadmap created with ID:", savedRoadmap._id);

      return res.status(201).json({
        success: true,
        roadmap: savedRoadmap,
        message: "Roadmap generated using fallback system"
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error'
    });
  }
};

// Function to generate an optimized prompt for AI
function generateOptimizedPrompt(user, skill, goals, timeframe, preferences) {
  return `
  Generate a personalized learning roadmap in JSON format for:

  User: ${skill?.level || 'Beginner'} level in ${skill?.categories?.join(', ') || 'General'}
  Goals: ${(goals || ['Master the basics']).join(', ')}
  Duration: ${timeframe} months, ${preferences.availability || '10'} hours/week, style: ${preferences.learningStyle || 'balanced'}

  Required JSON format:
  {
    "title": "concise title",
    "description": "brief description",
    "steps": [
      {
        "title": "step title",
        "description": "step description",
        "duration": "duration",
        "resources": ["resource1", "resource2"],
        "progressIndicators": ["indicator1", "indicator2"],
        "notes": "initial notes (optional)",
        "dependencies": ["id of a dependent step (optional)"]
      }
    ]
  }
  `;
}

// Function to generate a roadmap using AI
async function generateRoadmapWithAI(prompt) {
  try {
    const promptTokens = estimateTokens(prompt);
    const maxResponseTokens = Math.min(2000, 4000 - promptTokens);

    const messages = [
      { role: "system", content: "You are an expert in creating personalized learning paths. Respond only in JSON format." },
      { role: "user", content: prompt }
    ];

    const response = await callOllamaWithRateLimiting(messages, MODELS.DEFAULT, maxResponseTokens);

    const content = response.choices[0].message.content;
    let parsedContent;

    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      parsedContent = {
        title: "Custom Roadmap",
        description: "Automatically generated learning plan",
        steps: [
          {
            title: "Getting Started",
            description: "First step in the learning journey",
            duration: "2 weeks",
            resources: ["Online Documentation"],
            progressIndicators: ["Complete a practice exercise"],
            notes: "",
            dependencies: []
          }
        ]
      };
    }

    if (!parsedContent.steps || !Array.isArray(parsedContent.steps)) {
      throw new Error("Invalid response format: 'steps' missing or not an array");
    }

    return {
      title: parsedContent.title || "Custom Roadmap",
      description: parsedContent.description || "AI-generated Roadmap",
      steps: parsedContent.steps.map(step => ({
        title: step.title || "Step",
        description: step.description || "Step description",
        duration: step.duration || "2 weeks",
        resources: Array.isArray(step.resources) ? step.resources : ["Online Documentation"],
        progressIndicators: Array.isArray(step.progressIndicators) ?
          step.progressIndicators :
          (Array.isArray(step.indicators) ? step.indicators : ["Practice exercise"]),
        completed: false,
        notes: step.notes || "",
        dependencies: step.dependencies || []
      }))
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    throw error;
  }
}

// Function to generate a fallback roadmap
function generateFallbackRoadmap(level = 'Beginner', goals = [], timeframe = '3') {
  console.log("Generating a default (fallback) roadmap");

  const goalText = goals.length > 0 ? goals.join(', ') : 'general progress';
  const totalWeeks = parseInt(timeframe, 10) * 4;
  const totalSteps = Math.max(3, Math.min(9, Math.ceil(parseInt(timeframe, 10) * 1.5)));

  const difficulty = level.toLowerCase().includes('beginner') ? 'fundamentals' :
    level.toLowerCase().includes('intermediate') ? 'intermediate concepts' :
    'advanced concepts';

  const phases = [
    { name: "Discovery", weight: 0.2, resources: ["Official Documentation", "Beginner Tutorials", "Introductory Videos"] },
    { name: "Fundamentals", weight: 0.3, resources: ["Online Courses", "Practice Exercises", "Reference Documentation"] },
    { name: "Practice", weight: 0.3, resources: ["Guided Projects", "Case Studies", "Community Forums"] },
    { name: "Mastery", weight: 0.2, resources: ["Specialized Books", "Advanced Courses", "Personal Projects"] }
  ];

  const steps = [];
  let currentWeek = 0;

  for (let i = 0; i < Math.min(totalSteps, phases.length); i++) {
    const phase = phases[i];
    const phaseWeeks = Math.max(1, Math.round(totalWeeks * phase.weight));

    steps.push({
      title: `Phase ${i + 1}: ${phase.name} of ${difficulty}`,
      description: `${phase.name} in the field targeting: ${goalText}`,
      duration: `${phaseWeeks} weeks`,
      resources: phase.resources,
      progressIndicators: [
        "Complete a comprehension quiz",
        `Create a mini-project for ${phase.name.toLowerCase()}`,
        "Self-assess skills"
      ],
      completed: false,
      notes: "",
      dependencies: []
    });

    currentWeek += phaseWeeks;
  }

  return {
    title: `Roadmap: ${goalText} (${timeframe} months)`,
    description: `Learning plan for ${goalText} tailored to ${level} level, over ${timeframe} months`,
    steps: steps
  };
}

// Update roadmap with AI feedback
exports.updateRoadmapWithAIFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, progress } = req.body;

    console.log(`Updating roadmap ${id} with feedback`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found'
      });
    }

    if (roadmap.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this roadmap"
      });
    }

    try {
      if (feedback && feedback.length > 10) {
        const adjustedSteps = await generateAdjustmentsWithRateLimiting(roadmap.steps, feedback, progress);
        roadmap.steps = adjustedSteps.map(step => ({
          title: step.title,
          description: step.description,
          completed: step.completed || false,
          notes: step.notes || '',
          dependencies: step.dependencies || []
        }));
      }

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
      console.error("AI adjustment error:", aiError);

      roadmap.lastUpdated = Date.now();
      const updatedRoadmap = await roadmap.save();

      return res.status(200).json({
        success: true,
        roadmap: updatedRoadmap,
        message: "Feedback recorded but no AI adjustments made"
      });
    }
  } catch (error) {
    console.error('Error updating roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating roadmap',
      error: error.message
    });
  }
};

// Generate adjustments with AI feedback
async function generateAdjustmentsWithRateLimiting(currentSteps, feedback, progress) {
  if (!feedback || feedback.length < 10) {
    console.log("Feedback too short, skipping AI call");
    return currentSteps;
  }

  const prompt = `
  Current Roadmap:
  ${JSON.stringify(currentSteps, null, 2)}
  
  User Feedback:
  ${feedback}
  
  Progress: ${progress || 'not specified'}
  
  Adjust the roadmap steps based on the feedback and progress. Modify difficulty, add resources, or adjust durations if needed.
  Return only the modified steps list in JSON format.
  `;

  try {
    const messages = [
      { role: "system", content: "You are an expert in adjusting learning paths. Respond only in JSON format." },
      { role: "user", content: prompt }
    ];

    const response = await callOllamaWithRateLimiting(messages, MODELS.DEFAULT, 1000);

    const content = response.choices[0].message.content;

    try {
      const adjustedSteps = JSON.parse(content);
      return Array.isArray(adjustedSteps) ? adjustedSteps : currentSteps;
    } catch (parseError) {
      console.error("Failed to parse response after cleanup:", parseError);
      return currentSteps;
    }
  } catch (error) {
    console.error("Error generating adjustments:", error);
    return currentSteps;
  }
}

// Get roadmap by skill ID
exports.getRoadmapBySkillId = async (req, res) => {
  try {
    const userId = req.userId; // Utiliser req.userId pour cohérence
    const skillId = req.params.skillId;

    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      return res.status(400).json({ success: false, message: 'Invalid skill ID format' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    console.log(`Fetching roadmap for skillId: ${skillId}, user: ${userId}`);
    const roadmap = await Roadmap.findOne({ skill: skillId, user: userId });
    if (!roadmap) {
      console.log('No roadmap found for this skill and user');
      return res.status(404).json({ success: false, message: 'Roadmap non trouvée pour cette compétence' });
    }
    res.status(200).json({ success: true, roadmap });
  } catch (error) {
    console.error('Error fetching roadmap by skillId:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all user roadmaps
exports.getUserRoadmaps = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("Fetching roadmaps for user:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user ID format:", userId);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }

    const roadmaps = await Roadmap.find({ user: userId })
      .populate('skill', 'name level categories')
      .sort({ createdAt: -1 });

    console.log(`${roadmaps.length} roadmaps found for user ${userId}`);

    return res.status(200).json({
      success: true,
      roadmaps
    });
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching roadmaps',
      error: error.message
    });
  }
};

// Update a roadmap step
exports.updateRoadmapStep = async (req, res) => {
  try {
    const { id, stepIndex } = req.params;
    const { completed, overallProgress } = req.body;

    console.log(`Updating step ${stepIndex} of roadmap ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const stepIndexNum = parseInt(stepIndex, 10);
    if (isNaN(stepIndexNum)) {
      return res.status(400).json({
        success: false,
        message: "Step index must be a number"
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found"
      });
    }

    if (roadmap.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this roadmap"
      });
    }

    if (stepIndexNum < 0 || stepIndexNum >= roadmap.steps.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid step index"
      });
    }

    roadmap.steps[stepIndexNum].completed = completed;

    if (typeof overallProgress === 'number') {
      roadmap.overallProgress = Math.min(100, Math.max(0, overallProgress));
    } else {
      const completedSteps = roadmap.steps.filter(step => step.completed).length;
      roadmap.overallProgress = Math.round((completedSteps / roadmap.steps.length) * 100);
    }

    roadmap.lastUpdated = Date.now();
    const updatedRoadmap = await roadmap.save();

    return res.status(200).json({
      success: true,
      roadmap: updatedRoadmap
    });
  } catch (error) {
    console.error("Error updating step:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating step",
      error: error.message
    });
  }
};

// Delete a roadmap
exports.deleteRoadmap = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found"
      });
    }

    if (roadmap.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this roadmap"
      });
    }

    await Roadmap.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Roadmap deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting roadmap",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get roadmap by ID
exports.getRoadmapById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const roadmap = await Roadmap.findById(id)
      .populate('skill', 'name level categories')
      .populate('user', 'username email');

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found"
      });
    }

    if (roadmap.user._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this roadmap"
      });
    }

    res.status(200).json({ success: true, roadmap });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a specific step
exports.updateStep = async (req, res) => {
  try {
    const { id, stepId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roadmap ID format"
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found"
      });
    }

    if (roadmap.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this roadmap"
      });
    }

    const stepIndex = roadmap.steps.findIndex(step => step._id.toString() === stepId);
    if (stepIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Step not found"
      });
    }

    // Mettre à jour les champs de l'étape
    roadmap.steps[stepIndex] = { ...roadmap.steps[stepIndex], ...updates };
    roadmap.lastUpdated = Date.now();
    const updatedRoadmap = await roadmap.save();

    res.status(200).json({ success: true, roadmap: updatedRoadmap });
  } catch (error) {
    console.error("Error updating step:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Reorder steps
exports.reorderSteps = async (req, res) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    if (!Array.isArray(newOrder)) {
      return res.status(400).json({
        success: false,
        message: "New order must be an array of step IDs"
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found"
      });
    }

    if (roadmap.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this roadmap"
      });
    }

    // Vérifier que tous les IDs dans newOrder existent dans roadmap.steps
    const stepIds = roadmap.steps.map(step => step._id.toString());
    if (!newOrder.every(id => stepIds.includes(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid step IDs in new order"
      });
    }

    // Réorganiser les étapes
    const newSteps = newOrder.map(stepId => roadmap.steps.find(step => step._id.toString() === stepId));
    roadmap.steps = newSteps;
    roadmap.lastUpdated = Date.now();
    const updatedRoadmap = await roadmap.save();

    res.status(200).json({ success: true, roadmap: updatedRoadmap });
  } catch (error) {
    console.error("Error reordering steps:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Download roadmap
exports.downloadRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found"
      });
    }

    if (roadmap.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download this roadmap"
      });
    }

    // Créer un dossier downloads s'il n'existe pas
    const downloadsDir = path.join(__dirname, '../downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    let filePath;
    if (format === 'pdf') {
      // Générer le PDF
      const doc = new PDFDocument();
      filePath = path.join(downloadsDir, `roadmap-${id}.pdf`);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);
      doc.fontSize(20).text(roadmap.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(roadmap.description, { align: 'left' });
      doc.moveDown();

      doc.fontSize(16).text('Étapes :', { underline: true });
      roadmap.steps.forEach((step, index) => {
        doc.moveDown();
        doc.fontSize(14).text(`Étape ${index + 1}: ${step.title}`);
        doc.fontSize(12).text(`Description: ${step.description}`);
        doc.text(`Durée: ${step.duration}`);
        doc.text(`Ressources: ${step.resources.join(', ')}`);
        doc.text(`Notes: ${step.notes || 'Aucune note'}`);
        doc.text(`Complété: ${step.completed ? 'Oui' : 'Non'}`);
      });

      doc.end();

      // Attendre que le fichier soit écrit
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      res.download(filePath, `roadmap-${id}.pdf`, (err) => {
        if (err) {
          console.error("Error sending PDF:", err);
          res.status(500).json({ success: false, message: "Error sending PDF" });
        }
        // Supprimer le fichier après téléchargement
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting PDF file:", unlinkErr);
        });
      });
    } else if (format === 'csv') {
      // Générer le CSV
      const steps = roadmap.steps.map((step, index) => ({
        Step: `Étape ${index + 1}`,
        Title: step.title,
        Description: step.description,
        Duration: step.duration,
        Resources: step.resources.join('; '),
        Notes: step.notes || 'Aucune note',
        Completed: step.completed ? 'Oui' : 'Non',
      }));

      const fields = ['Step', 'Title', 'Description', 'Duration', 'Resources', 'Notes', 'Completed'];
      const parser = new Parser({ fields });
      const csv = parser.parse(steps);

      filePath = path.join(downloadsDir, `roadmap-${id}.csv`);
      fs.writeFileSync(filePath, csv);

      res.download(filePath, `roadmap-${id}.csv`, (err) => {
        if (err) {
          console.error("Error sending CSV:", err);
          res.status(500).json({ success: false, message: "Error sending CSV" });
        }
        // Supprimer le fichier après téléchargement
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting CSV file:", unlinkErr);
        });
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid format. Use 'pdf' or 'csv'."
      });
    }
  } catch (error) {
    console.error("Error downloading roadmap:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};