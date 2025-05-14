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
const Stripe = require("stripe");
const mongoose = require("mongoose");
const app = express();
const stripe = Stripe("sk_test_51RBp5T2RFwWmT2NugdywQ4CSCjxzON7PIFwZTx3KjrITvoFabnkkzM8AkzXUho4055sTVo0gEug28kDiHGoqORga00ltpGgb0v");//privateKey





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

    console.log('Message système créé et émis test test test :', systemMessage);
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