const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken"); // Ajouté pour jwt.verify
const messengerController = require('../Controllers/Messengers');
const messageController = require('../Controllers/messageController');
const { audioUpload, upload, callRecordingUpload } = require('../Config/cloudinaryMessenger');
const verifyToken = require('../middleware/verifySession');
const { Conversation, Message } = require('../Models/MessageSchema');
const User = require('../Models/User');
const Report = require('../Models/ReportSchema');




const Call = require('../models/CallSchema'); // Adjust path as needed



const ChatbotConversation = require('../Models/ChatbotConversationSchema');


const Stripe = require("stripe");
const mongoose = require("mongoose");
const app = express();
const stripe = Stripe("sk_test_51RBp5T2RFwWmT2NugdywQ4CSCjxzON7PIFwZTx3KjrITvoFabnkkzM8AkzXUho4055sTVo0gEug28kDiHGoqORga00ltpGgb0v");//privateKey
const TeacherRating = require('../Models/TeacherRatingSchema');
const Notification = require('../Models/notificationSchema');



const axios = require('axios');










// Function to analyze conversations and compute metrics
async function analyzeConversations(userId, teacherId) {
  try {
    // Trouver les conversations où l'utilisateur et l'enseignant sont participants
    const conversations = await Conversation.find({
      participants: { $all: [userId, teacherId] },
    }).populate('messages');

    // Initialiser les métriques avec des valeurs par défaut
    let nombre_sessions = 0;
    let temps_consacre_heures = 0;
    let progression = 0;
    let regularity_score = 0;
    let taux_reussite_exercices = 0;
    let risque_abandon = 0;
    let engagement_score = 0;
    let user_retention_days = 0;
    let firstInteractionDate = null;

    // Mots-clés pour les exercices réussis
    const successKeywords = ['exercice réussi', 'bien fait', 'excellent', 'bravo'];

    // Analyser les messages
    const messageDates = new Set();
    let totalMessages = 0;
    let successMessagesCount = 0;

    for (const convo of conversations) {
      if (!convo.messages || !Array.isArray(convo.messages)) {
        console.warn(`[ANALYZE_CONVERSATIONS] Conversation ${convo._id} sans messages valides`);
        continue;
      }

      const messages = convo.messages.filter((msg) => {
        if (!msg || !msg.sender) {
          console.warn(`[ANALYZE_CONVERSATIONS] Message invalide dans conversation ${convo._id}:`, msg);
          return false;
        }
        const senderId = msg.sender.toString();
        return senderId === userId || senderId === teacherId;
      });

      totalMessages += messages.length;
      nombre_sessions += messages.length;

      // Compter les messages avec des mots-clés de succès et ajouter du temps
      messages.forEach((msg) => {
        if (msg.content && successKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))) {
          successMessagesCount += 1;
        }
        // Ajouter 2 minutes (120 secondes) par message
        temps_consacre_heures += 120 / 3600; // Convertir en heures

        // Suivre les jours uniques pour la régularité
        const date = msg.createdAt.toISOString().split('T')[0];
        messageDates.add(date);
        if (!firstInteractionDate || msg.createdAt < firstInteractionDate) {
          firstInteractionDate = msg.createdAt;
        }
      });
    }

    // Analyser les appels
    const calls = await Call.find({
      $or: [
        { caller: userId, participants: teacherId },
        { caller: teacherId, participants: userId },
      ],
      status: 'ended',
    });

    calls.forEach((call) => {
      if (call.duration) {
        temps_consacre_heures += call.duration / 3600; // Ajouter la durée en heures
        nombre_sessions += 1;
      }
      if (!firstInteractionDate || call.startTime < firstInteractionDate) {
        firstInteractionDate = call.startTime;
      }
    });

    // Calculer la progression (basée sur le volume d'activité)
    progression = Math.min((nombre_sessions / 100) * 100, 100) || 0;

    // Calculer le taux de réussite des exercices
    taux_reussite_exercices = totalMessages > 0 ? (successMessagesCount / totalMessages) * 100 : 0;

    // Calculer la régularité
    regularity_score = Math.min(messageDates.size * 5, 100) || 0;

    // Calculer l'engagement (basé sur le nombre de sessions)
    engagement_score = Math.min((nombre_sessions / 50) * 100, 100) || 0;

    // Calculer le risque d'abandon (basé sur l'inactivité récente)
    if (firstInteractionDate) {
      const now = new Date();
      const lastMessageDate = Math.max(...Array.from(messageDates).map(d => new Date(d).getTime()), firstInteractionDate.getTime());
      const daysSinceLastActivity = Math.floor((now - new Date(lastMessageDate)) / (1000 * 60 * 60 * 24));
      risque_abandon = Math.min((daysSinceLastActivity / 30) * 100, 100) || 0;
    }

    // Calculer la rétention
    if (firstInteractionDate) {
      const now = new Date();
      user_retention_days = Math.floor((now - firstInteractionDate) / (1000 * 60 * 60 * 24)) || 0;
    }

    // S'assurer que tous les nombres sont valides
    const metrics = {
      nombre_sessions: Number(nombre_sessions) || 0,
      temps_consacre_heures: Number(temps_consacre_heures.toFixed(2)) || 0,
      progression: Number(progression.toFixed(2)) || 0,
      regularity_score: Number(regularity_score.toFixed(2)) || 0,
      taux_reussite_exercices: Number(taux_reussite_exercices.toFixed(2)) || 0,
      risque_abandon: Number(risque_abandon.toFixed(2)) || 0,
      engagement_score: Number(engagement_score.toFixed(2)) || 0,
      user_retention_days: Number(user_retention_days) || 0,
    };

    console.log(`[ANALYZE_CONVERSATIONS] Métriques calculées pour userId: ${userId}, teacherId: ${teacherId}`, metrics);
    return metrics;
  } catch (error) {
    console.error('[ANALYZE_CONVERSATIONS] Erreur:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}









// Route to get learning status predictions
router.get('/learning-status', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`[LEARNING-STATUS] Récupération des prédictions pour userId: ${userId}`);

    // Récupérer l'utilisateur et ses enseignants achetés
    const user = await User.findById(userId).populate('purchasedTeachers');
    if (!user) {
      console.log('[LEARNING-STATUS] Utilisateur non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    if (!user.purchasedTeachers || user.purchasedTeachers.length === 0) {
      console.log('[LEARNING-STATUS] Aucun enseignant acheté');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Aucun enseignant acheté trouvé',
      });
    }

    // Récupérer la vitesse d'apprentissage
    const user_learning_speed = user.learning_speed || 'medium';
    console.log('[LEARNING-STATUS] Vitesse d\'apprentissage:', user_learning_speed);

    // Préparer les données pour chaque enseignant
    const predictionData = [];
    for (const teacher of user.purchasedTeachers) {
      if (!teacher.skills || !Array.isArray(teacher.skills) || teacher.skills.length === 0 || !teacher.skills[0].name) {
        console.warn(`[LEARNING-STATUS] Enseignant sans compétences valides: ${teacher._id}`);
        continue;
      }

      const skill_name = teacher.skills[0].name;
      const competences_prealables = teacher.skills[0].name;
      console.log(`[LEARNING-STATUS] Traitement skill: ${skill_name} pour teacher: ${teacher._id}`);

      // Analyser les conversations
      let metrics;
      try {
        metrics = await analyzeConversations(userId, teacher._id);
      } catch (error) {
        console.warn(`[LEARNING-STATUS] Échec de l'analyse des conversations pour teacher: ${teacher._id}`, error.message);
        continue;
      }

      // Vérifier que les métriques sont valides
      if (!metrics || Object.values(metrics).some(val => val === null || val === undefined || isNaN(val))) {
        console.warn(`[LEARNING-STATUS] Métriques invalides pour teacher: ${teacher._id}`, metrics);
        continue;
      }

      predictionData.push({
        skill_name,
        progression: Number(metrics.progression) || 0,
        temps_consacre_heures: Number(metrics.temps_consacre_heures) || 0,
        nombre_sessions: Number(metrics.nombre_sessions) || 0,
        regularity_score: Number(metrics.regularity_score) || 0,
        taux_reussite_exercices: Number(metrics.taux_reussite_exercices) || 0,
        risque_abandon: Number(metrics.risque_abandon) || 0,
        engagement_score: Number(metrics.engagement_score) || 0,
        user_learning_speed,
        user_retention_days: Number(metrics.user_retention_days) || 0,
        competences_prealables,
      });
    }

    if (!predictionData.length) {
      console.log('[LEARNING-STATUS] Aucune donnée de prédiction disponible');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Aucune compétence en cours d\'étude',
      });
    }

    console.log('[LEARNING-STATUS] Envoi des données à Flask:', JSON.stringify(predictionData, null, 2));

    // Envoyer les données à Flask
    const flaskResponse = await axios.post(
      'http://localhost:5004/api/predict_learning_status',
      predictionData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    console.log('[LEARNING-STATUS] Réponse de Flask:', JSON.stringify(flaskResponse.data, null, 2));

    
    // Générer les messages personnalisés
    const results = flaskResponse.data.map((result) => {
      let message = '';
      switch (result.predicted_status) {
        case 'en cours':
      message = `You're making good progress in ${result.skill_name}! Keep it up.`;
      break;
    case 'terminé':
      message = `Congratulations! You've mastered ${result.skill_name}.`;
      break;
    case 'abandon':
      message = `It seems you're facing challenges with ${result.skill_name}. Reach out to your teacher for support.`;
      break;
    default:
      message = `Congratulations! You've mastered ${result.skill_name}.`;
  }
      return {
        skill_name: result.skill_name,
        predicted_status: result.predicted_status,
        confidence: result.confidence,
        message,
      };
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[LEARNING-STATUS] Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : null,
      axiosError: error.isAxiosError ? {
        code: error.code,
        config: error.config,
      } : null,
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prédiction des statuts d\'apprentissage',
      error: error.message,
    });
  }
});



// Route pour récupérer les recommandations de groupes
router.post('/get-recommendations', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // Récupéré via verifyToken
    console.log(`[GET-RECOMMENDATIONS] Requête pour userId: ${userId}`);

    if (!userId) {
      console.error('[GET-RECOMMENDATIONS] userId manquant');
      return res.status(400).json({ success: false, message: 'userId requis' });
    }

    // Appeler l'API Flask pour obtenir les recommandations
    const flaskResponse = await axios.post('http://localhost:5001/recommend', {
      user_id: userId,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[GET-RECOMMENDATIONS] Réponse brute de Flask:', JSON.stringify(flaskResponse.data, null, 2));

    // Vérifier si la réponse contient des recommandations
    if (!flaskResponse.data || !flaskResponse.data.recommendations) {
      console.warn('[GET-RECOMMENDATIONS] Réponse Flask invalide ou sans recommendations:', flaskResponse.data);
      return res.status(200).json({
        success: true,
        message: 'Aucune recommandation disponible',
        data: [],
      });
    }

    const recommendations = flaskResponse.data.recommendations;
    console.log('[GET-RECOMMENDATIONS] Recommandations extraites:', JSON.stringify(recommendations, null, 2));

    res.status(200).json({
      success: true,
      message: recommendations.length > 0 ? 'Recommandations récupérées avec succès' : 'Aucune recommandation disponible',
      data: recommendations,
    });
  } catch (error) {
    console.error('[GET-RECOMMENDATIONS] Erreur:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des recommandations',
      error: error.message,
    });
  }
});












// Proxy pour les messages du chatbot
router.post('/proxy/chatbot/message', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('Requête reçue pour /proxy/chatbot/message:', req.body);
    const flaskResponse = await axios.post('http://localhost:5002/chatbot/message', {
      ...req.body,
      user_id: userId
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    console.log('Réponse de Flask pour /chatbot/message:', flaskResponse.data);
    res.status(200).json(flaskResponse.data);
  } catch (error) {
    console.error('Erreur dans la route proxy /proxy/chatbot/message:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la communication avec le chatbot',
      error: error.message
    });
  }
});

// Proxy pour récupérer l'historique du chatbot
router.get('/proxy/chatbot/history', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`Requête reçue pour /proxy/chatbot/history pour userId: ${userId}`);
    const flaskResponse = await axios.get(`http://localhost:5002/chatbot/history/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    console.log('Réponse de Flask pour /chatbot/history:', flaskResponse.data);
    res.status(200).json(flaskResponse.data);
  } catch (error) {
    console.error('Erreur dans la route proxy /proxy/chatbot/history:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique du chatbot',
      error: error.message
    });
  }
});

// Proxy pour le message initial du chatbot
router.get('/proxy/chatbot/initial-message', async (req, res) => {
  try {
    console.log('Requête reçue pour /proxy/chatbot/initial-message');
    const flaskResponse = await axios.get('http://localhost:5001/api/chatbot/initial-message', {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    console.log('Réponse de Flask pour /api/chatbot/initial-message:', flaskResponse.data);
    res.status(200).json(flaskResponse.data);
  } catch (error) {
    console.error('Erreur dans la route proxy /proxy/chatbot/initial-message:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du message initial du chatbot',
      error: error.message
    });
  }
});





























router.post('/proxy/analyze-sentiment', async (req, res) => {
  try {
    console.log('Requête reçue pour /proxy/analyze-sentiment:', req.body);
    const flaskResponse = await axios.post('http://localhost:5001/api/analyze_sentiment', req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    console.log('Réponse de Flask pour /api/analyze_sentiment:', flaskResponse.data);
    res.status(200).json(flaskResponse.data);
  } catch (error) {
    console.error('Erreur dans la route proxy /proxy/analyze-sentiment:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse des sentiments',
      error: error.message
    });
  }
});






router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`[NOTIFICATION] Début de récupération des notifications pour userId: ${userId}`);

    if (!userId) {
      console.error(`[NOTIFICATION] Échec: userId manquant ou non authentifié`);
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    const notifications = await Notification.find({ recipient: userId })
      .sort({ timestamp: -1 })
      .limit(50);

    console.log(`[NOTIFICATION] Succès: ${notifications.length} notifications récupérées pour userId: ${userId}`);
    console.log(`[NOTIFICATION] Détails:`, notifications.map(n => ({
      _id: n._id,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read
    })));

    res.status(200).json({
      success: true,
      message: notifications.length > 0 ? 'Notifications récupérées avec succès' : 'Aucune notification',
      data: notifications,
    });
  } catch (error) {
    console.error(`[NOTIFICATION] Erreur lors de la récupération des notifications pour userId: ${req.userId}`, error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des notifications',
      error: error.message,
    });
  }
});




































































router.post('/upload', upload.single('file'), messageController.uploadFile);
router.get('/users', messengerController.getAllUsers);
// Dans votre fichier de routes (ex: messengerRoutes.js)
router.put('/upgradeToTeacher/:userId', messengerController.upgradeToTeacher);
router.delete('/deleteConversationForUser', verifyToken, messengerController.deleteConversationForUser);
router.get('/conversations', verifyToken, messengerController.getUserConversations);
router.post('/upload-audio', audioUpload.single('file'), messageController.uploadAudio);
router.post('/select-conversation', messageController.selectConversation);
router.post(
  '/upload-call-recording',
  verifyToken,
  callRecordingUpload.single('recording'),
  messageController.uploadCallRecording
);

router.post('/createGroupConversation', verifyToken, messengerController.createGroupConversation);
router.put('/addParticipantToGroup', verifyToken, messengerController.addParticipantToGroup);
router.post('/sendSystemMessage', verifyToken, messengerController.sendSystemMessage);
router.get('/currentUser', verifyToken, messengerController.getCurrentUser);
router.post('/createGroupFromConversation', verifyToken, messengerController.createGroupFromConversation); // Nouvelle route
router.post('/leaveGroupConversation', verifyToken, messengerController.leaveGroupConversation); // Nouvelle route
router.get('/conversationParticipants', verifyToken, messengerController.getConversationParticipants);

router.post('/blockUser', verifyToken, messengerController.blockUser); // Nouvelle route
router.post('/unblockUser', verifyToken, messengerController.unblockUser); // Nouvelle route


// Mettre à jour le nom du groupe
router.put('/updateGroupName', verifyToken, async (req, res) => {
  try {
    const { conversationId, groupName } = req.body;
    if (!conversationId || !groupName) {
      return res.status(400).json({ success: false, message: 'conversationId et groupName sont requis' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Conversation de groupe non trouvée' });
    }

    conversation.groupName = groupName;
    await conversation.save();

    if (!req.io) {
      console.error('Erreur: req.io est undefined.');
      return res.status(500).json({ success: false, message: 'Erreur serveur: Socket.IO non configuré' });
    }

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;

    const currentUser = await User.findById(currentUserId).select('firstName lastName');
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    const userFullName = `${currentUser.firstName} ${currentUser.lastName}`;

    const systemMessage = await Message.create({
      conversation: conversationId,
      isSystemMessage: true,
      content: `${userFullName} a changé le nom du groupe en "${groupName}"`,
      systemData: {
        action: 'group_name_updated',
        actionBy: currentUserId,
        actionTarget: null,
        customContent: {
          forAuthor: `Vous avez changé le nom du groupe en "${groupName}"`,
          forOthers: `${userFullName} a changé le nom du groupe en "${groupName}"`,
        },
      },
      createdAt: new Date(),
    });

    conversation.messages = conversation.messages || [];
    conversation.messages.push(systemMessage._id);
    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    console.log('Message système créé et émis :', systemMessage);
    req.io.to(conversationId).emit('newMessage', systemMessage);

    res.status(200).json({ success: true, message: 'Nom du groupe mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});
// Mettre à jour la photo du groupe

router.put('/updateGroupPhoto', verifyToken, async (req, res) => {
  try {
    const { conversationId, groupPhoto } = req.body;
    if (!conversationId || !groupPhoto) {
      return res.status(400).json({ success: false, message: 'conversationId et groupPhoto sont requis' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Conversation de groupe non trouvée' });
    }

    conversation.groupPhoto = groupPhoto;
    await conversation.save();

    if (!req.io) {
      console.error('Erreur: req.io est undefined.');
      return res.status(500).json({ success: false, message: 'Erreur serveur: Socket.IO non configuré' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.userId;

    // Récupérer les informations de l'utilisateur
    const currentUser = await User.findById(currentUserId).select('firstName lastName');
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    const userFullName = `${currentUser.firstName} ${currentUser.lastName}`;

    // Créer le message système
    const systemMessage = await Message.create({
      conversation: conversationId,
      isSystemMessage: true,
      content: `${userFullName} a mis à jour la photo du groupe`, // Message par défaut
      systemData: {
        action: 'group_photo_updated',
        actionBy: currentUserId,
        actionTarget: null,
        customContent: {
          forAuthor: "Vous avez mis à jour la photo du groupe",
          forOthers: `${userFullName} a mis à jour la photo du groupe`,
        },
      },
      createdAt: new Date(),
    });

    // Ajouter le message au tableau messages de la conversation
    conversation.messages = conversation.messages || [];
    conversation.messages.push(systemMessage._id);
    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    req.io.to(conversationId).emit('newMessage', systemMessage);
    req.io.to(conversationId).emit('groupUpdated', {
      conversationId,
      groupName: conversation.groupName,
      groupPhoto,
    });

    res.status(200).json({ success: true, message: 'Photo du groupe mise à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});















router.post('/rateTeacher', verifyToken, async (req, res) => {
  const { conversationId, teacherId, ratings } = req.body;
  const studentId = req.userId;

  try {
    // Validate inputs
    if (!conversationId || !teacherId || !ratings || !Array.isArray(ratings)) {
      console.error('Validation failed:', { conversationId, teacherId, ratings });
      return res.status(400).json({ success: false, message: 'Paramètres manquants ou invalides' });
    }

    // Validate conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $all: [studentId, teacherId] },
      isGroup: false,
    });
    if (!conversation) {
      console.error('Conversation invalid:', { conversationId, studentId, teacherId });
      return res.status(404).json({ success: false, message: 'Conversation non trouvée ou accès refusé' });
    }

    // Verify teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      console.error('Teacher invalid:', { teacherId, teacher });
      return res.status(400).json({ success: false, message: 'Utilisateur non trouvé ou n’est pas un professeur' });
    }

    // Validate ratings
    const validCriteria = ['explains_well', 'availability', 'responsiveness'];
    for (const rating of ratings) {
      if (!validCriteria.includes(rating.criterion) || !Number.isInteger(rating.score) || rating.score < 1 || rating.score > 5) {
        console.error('Invalid rating:', rating);
        return res.status(400).json({ success: false, message: 'Critère ou score invalide' });
      }
    }

    // Check existing rating
    const existingRating = await TeacherRating.findOne({
      teacher: teacherId,
      student: studentId,
      conversation: conversationId,
    });
    if (existingRating) {
      console.error('Existing rating found:', { teacherId, studentId, conversationId });
      return res.status(400).json({ success: false, message: 'Vous avez déjà évalué ce professeur dans cette conversation' });
    }

    // Create new rating
    const teacherRating = new TeacherRating({
      teacher: teacherId,
      student: studentId,
      conversation: conversationId,
      ratings,
    });
    await teacherRating.save();

    // Update teacher's average ratings
    const allRatings = await TeacherRating.find({ teacher: teacherId });
    const criteriaSums = { explains_well: 0, availability: 0, responsiveness: 0 };
    const criteriaCounts = { explains_well: 0, availability: 0, responsiveness: 0 };
    let overallSum = 0;
    let overallCount = 0;

    for (const rating of allRatings) {
      for (const r of rating.ratings) {
        criteriaSums[r.criterion] += r.score;
        criteriaCounts[r.criterion]++;
        overallSum += r.score;
        overallCount++;
      }
    }

    const updatedRatings = {
      explains_well: {
        average: criteriaCounts.explains_well ? (criteriaSums.explains_well / criteriaCounts.explains_well).toFixed(1) : 0,
        count: criteriaCounts.explains_well,
      },
      availability: {
        average: criteriaCounts.availability ? (criteriaSums.availability / criteriaCounts.availability).toFixed(1) : 0,
        count: criteriaCounts.availability,
      },
      responsiveness: {
        average: criteriaCounts.responsiveness ? (criteriaSums.responsiveness / criteriaCounts.responsiveness).toFixed(1) : 0,
        count: criteriaCounts.responsiveness,
      },
      overall: {
        average: overallCount ? (overallSum / overallCount).toFixed(1) : 0,
        count: overallCount,
      },
    };

    await User.findByIdAndUpdate(teacherId, {
      teacherRatings: updatedRatings,
    });

    res.status(200).json({ success: true, message: 'Évaluation soumise avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’évaluation du professeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});



























































































































router.get('/dashboard', verifyToken, async (req, res) => {
  console.log('Requête reçue pour dashboard');
  try {
    // Extraire le token de l'en-tête Authorization
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    // Décoder le token pour obtenir l'ID utilisateur
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log('Utilisateur connecté, userId:', userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId).select('firstName lastName role');
    console.log('Utilisateur trouvé:', user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Récupérer les conversations
    const conversations = await Conversation.find({
      participants: userId,
    }).populate({
      path: 'messages',
      populate: { path: 'sender' }
    }).populate('participants');

    // Calculer les statistiques
    let messagesToTeachers = 0;
    let messagesToOthers = 0;
    let groupMessages = 0;
    let individualMessages = 0;
    let totalMessages = 0;
    let groupCount = 0;
    let avgParticipantsPerGroup = 0;
    const dailyProgress = {};
    const weeklyProgress = {};
    let activeDays = new Set();

    for (const conv of conversations) {
      const isGroup = conv.isGroup || false;
      if (isGroup) {
        groupCount++;
        avgParticipantsPerGroup += conv.participants.length;
      }

      for (const msg of conv.messages) {
        // Vérifier que le message et le sender existent
        if (!msg || !msg.sender || !msg.sender._id) {
         // console.warn('Message ignoré (sender manquant ou invalide):', msg);
          continue;
        }

        if (msg.sender._id.toString() === userId) {
          totalMessages++;
          if (isGroup) {
            groupMessages++;
          } else {
            individualMessages++;
          }

          // Vérifier si le destinataire est un professeur (pour conversations individuelles)
          if (!isGroup && conv.participants.length === 2) {
            const recipientId = conv.participants.find((p) => p._id.toString() !== userId);
            const recipient = await User.findById(recipientId);
            if (recipient && recipient.role === 'teacher') {
              messagesToTeachers++;
            } else {
              messagesToOthers++;
            }
          }

          // Statistiques quotidiennes et hebdomadaires
          const date = new Date(msg.createdAt);
          const day = date.toISOString().split('T')[0];
          const week = `${date.getFullYear()}-W${Math.floor(date.getDate() / 7) + 1}`;
          dailyProgress[day] = (dailyProgress[day] || 0) + 1;
          weeklyProgress[week] = (weeklyProgress[week] || 0) + 1;
          activeDays.add(day);
        }
      }
    }

    avgParticipantsPerGroup = groupCount ? avgParticipantsPerGroup / groupCount : 0;

    // Calculer le rating global (existant)
    const engagementScore = totalMessages / (activeDays.size || 1);
    const rating = Math.min(5, Math.floor(engagementScore / 5) + 1);

    // Calculer le rating quotidien
    const totalDailyMessages = Object.values(dailyProgress).reduce((sum, count) => sum + count, 0);
    const avgDailyMessages = activeDays.size ? totalDailyMessages / activeDays.size : 0;
    const dailyRating = Math.min(5, Math.floor(avgDailyMessages / 5) + 1);

    // Calculer le rating professeur
    const teacherRating = Math.min(5, Math.floor(messagesToTeachers / 5) + 1);

    const dashboardData = {
      userName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      totalMessages,
      messagesToTeachers,
      messagesToOthers,
      groupMessages,
      individualMessages,
      groupCount,
      avgParticipantsPerGroup: avgParticipantsPerGroup.toFixed(1),
      activeDays: activeDays.size,
      rating,
      dailyRating,
      teacherRating,
      dailyProgress: Object.entries(dailyProgress).map(([date, messageCount]) => ({
        date,
        messageCount,
      })),
      weeklyProgress: Object.entries(weeklyProgress).map(([week, messageCount]) => ({
        week,
        messageCount,
      })),
    };


    if (user.role === 'teacher') {
      const teacherUser = await User.findById(userId).select('teacherRatings');
      dashboardData.teacherRatings = teacherUser.teacherRatings;
    }

    //console.log('Données envoyées:', dashboardData);
    res.json({ success: true, data: dashboardData });
  } catch (err) {
    console.error('Erreur dans /dashboard:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});
























// Route à ajouter dans votre fichier de routes (probablement MessengerRoutes.js)
router.post('/mark-messages-as-read', verifyToken, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId requis' });
  }

  try {
    // Mettre à jour tous les messages non lus pour cet utilisateur dans toutes les conversations
    const updatedMessages = await Message.updateMany(
      {
        sender: { $ne: userId }, // Ne pas mettre à jour les messages envoyés par l'utilisateur lui-même
        read: false, // Seulement les messages non lus
        conversation: { $in: await Conversation.find({ participants: userId }).distinct('_id') }, // Conversations de l'utilisateur
      },
      { $set: { read: true } }
    );

    // Émettre un événement pour informer les clients (optionnel)
    if (req.io) {
      req.io.emit('messagesMarkedAsRead', { userId });
    }

    res.json({
      success: true,
      message: 'Tous les messages ont été marqués comme lus',
      modifiedCount: updatedMessages.modifiedCount,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages comme lus:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});













router.post("/create-checkout-session", async (req, res) => {
  const { teacherId, teacherName, studentId } = req.body;

  if (!teacherId || !teacherName || !studentId) {
    return res.status(400).json({ error: "teacherId, teacherName et studentId sont requis" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Session avec ${teacherName}`,
            },
            unit_amount: 5000,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:5173/ConfirmPagePaiement?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:5173/CancelPagePaiement",
      metadata: {
        teacherId: teacherId, // Définir les métadonnées au niveau de la session
        studentId: studentId,
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Erreur lors de la création de la session Stripe :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Vérification de la session Stripe (inchangée, mais incluse pour référence)
router.get('/verify-checkout-session', async (req, res) => {
  const { session_id } = req.query;

  try {
    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id requis' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const { teacherId, studentId } = session.metadata;

      if (!teacherId || !studentId) {
        return res.status(400).json({ success: false, message: 'teacherId ou studentId manquant dans les métadonnées' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        studentId,
        { $addToSet: { purchasedTeachers: teacherId } },
        { new: true }
      );

      console.log(`Teacher ${teacherId} ajouté à purchasedTeachers pour l'utilisateur ${studentId}`);
      return res.json({ success: true, message: 'Paiement confirmé', user: updatedUser });
    } else {
      return res.status(400).json({ success: false, message: 'Paiement non confirmé ou annulé' });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la session Stripe :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});



router.post('/reportUser', verifyToken, async (req, res) => {
  const { conversationId, reportedUserId, reason } = req.body;
  const reporterId = req.userId; // Récupéré via verifyToken

  try {
    // Vérifier les paramètres
    if (!conversationId || !reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: 'Paramètres manquants' });
    }

    // Vérifier que la conversation existe et que l'utilisateur en fait partie
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: reporterId,
    });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation non trouvée ou accès refusé' });
    }

    // Vérifier que l'utilisateur signalé est dans la conversation
    if (!conversation.participants.some(p => p._id.toString() === reportedUserId)) {
      return res.status(400).json({ success: false, message: 'Utilisateur signalé non trouvé dans cette conversation' });
    }

    // Créer un nouveau signalement
    const report = new Report({
      reporter: reporterId,
      reportedUser: reportedUserId,
      conversation: conversationId,
      reason,
    });

    await report.save();

    console.log(`Signalement enregistré: Reporter ${reporterId}, Reported ${reportedUserId}, Raison: ${reason}`);
    res.status(200).json({ success: true, message: 'Utilisateur signalé avec succès' });
  } catch (error) {
    console.error('Erreur lors du signalement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors du signalement' });
  }
});







// Récupérer tous les signalements (reports) sans authentification
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'firstName lastName email')
      .populate('reportedUser', 'firstName lastName email')
      .populate('conversation', 'groupName participants');

    res.status(200).json({
      success: true,
      message: 'Liste des signalements récupérée avec succès',
      data: reports,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des signalements',
      error: error.message,
    });
  }
});







// Example in Express.js
router.patch('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewed', 'blocked_3days', 'blocked_permanent', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Signalement non trouvé' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



module.exports = router;