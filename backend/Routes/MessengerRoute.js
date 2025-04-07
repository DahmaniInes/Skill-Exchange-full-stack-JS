const express = require('express');
const router = express.Router();
const messengerController = require('../Controllers/Messengers');
const messageController = require('../Controllers/messageController');
const { audioUpload, upload, callRecordingUpload } = require('../Config/cloudinaryMessenger');
const verifyToken = require('../middleware/verifySession');
const { Conversation, Message } = require('../Models/MessageSchema');
const User = require('../Models/User');

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // Ajouté pour jwt.verify

router.post('/upload', upload.single('file'), messageController.uploadFile);
router.get('/users', messengerController.getAllUsers);
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

module.exports = router;