const mongoose = require('mongoose'); // Ajoutez cette ligne
const { Conversation, Message } = require('../Models/MessageSchema');
const { upload } = require('../Config/cloudinaryMessenger');
const { v4: uuidv4 } = require('uuid');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const  Call  = require('../Models/CallSchema');
module.exports = {
  // Uploader un fichier





  selectConversation: async (req, res) => {
    try {
      const { conversationId, userId } = req.body;
  
      if (!conversationId || !userId) {
        return res.status(400).json({ message: 'Missing parameters' });
      }
  
      if (!isValidObjectId(conversationId) || !isValidObjectId(userId)) {
        return res.status(400).json({ message: 'Invalid conversationId or userId' });
      }
  
      // Vérifier que l'utilisateur fait partie de la conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).populate({
        path: 'messages',
        match: {
          $or: [
            { deletedFor: { $ne: userId } },
            { deletedFor: { $exists: false } },
          ],
        },
        options: { sort: { createdAt: 1 } },
        populate: [
          { path: 'sender', select: 'firstName lastName profilePicture' },
          { path: 'receiver', select: 'firstName lastName profilePicture' },
        ],
      });
  
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found or user not a participant' });
      }
  
      console.log(`Conversation ${conversationId} selected by user ${userId}`);
  
      // Renvoyer les messages de la conversation
      res.status(200).json({
        success: true,
        conversationId: conversation._id,
        messages: conversation.messages,
      });
    } catch (error) {
      console.error('Error in selectConversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to select conversation',
        error: error.message,
      });
    }
  },










   uploadFile : async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Déterminer le type de fichier
      let fileType = 'other';
      const mimeType = req.file.mimetype;
      
      if (mimeType.startsWith('image/')) {
        fileType = 'image';
      } else if (mimeType.startsWith('video/')) {
        fileType = 'video';
      } else if (mimeType.startsWith('audio/')) {
        fileType = 'audio';
      } else if (mimeType === 'application/pdf' || 
                 mimeType === 'application/msword' || 
                 mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'document';
      }

      // Créer l'URL de téléchargement avec le flag Cloudinary
      const downloadUrl = `${req.file.path}?fl_attachment`;

      res.status(200).json({
        url: req.file.path, // URL Cloudinary standard
        downloadUrl,        // URL spéciale pour téléchargement
        fileType,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Upload failed', 
        error: error.message 
      });
    }
  },
  

  // Envoyer un message
  sendMessage: async (socket, data) => {
    try {
      const { senderId, receiverId, content = '', attachments = [], tempId } = data;
  
      const isSelfConversation = senderId === receiverId;
  
      let conversation = await Conversation.findOne({
        participants: isSelfConversation ? [senderId] : { $all: [senderId, receiverId] },
        isGroup: false,
        isSelfConversation: isSelfConversation,
      });
  
      if (!conversation) {
        conversation = new Conversation({
          participants: isSelfConversation ? [senderId] : [senderId, receiverId],
          messages: [],
          isGroup: false,
          isSelfConversation: isSelfConversation,
        });
      }
  
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content: content || '',
        read: false,
        isSelfMessage: isSelfConversation,
        attachments: attachments.map(file => ({
          url: file.url,
          fileType: file.fileType,
          originalName: file.originalName,
        })),
        tempId: tempId, // Ajouter le champ tempId pour les messages optimistes
      });
  
      conversation.messages.push(newMessage);
      conversation.lastMessage = newMessage._id;
  
      await Promise.all([newMessage.save(), conversation.save()]);
  
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'firstName lastName profilePicture')
        .populate('receiver', 'firstName lastName profilePicture');
  
      socket.to(receiverId).emit('newMessage', populatedMessage);
      socket.emit('messageSent', { ...populatedMessage.toObject(), tempId }); // Renvoyer tempId avec le message confirmé
  
      return populatedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  },

  // Marquer un message comme lu
  markAsRead :async (socket, messageId, userId) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { read: true },
        { new: true }
      );

      if (message) {
        socket.emit('messageRead', messageId);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  },




  // Récupérer l'historique des messages
  getMessages: async (socket, { conversationId, userId }) => {
    try {
      console.log('getMessages request received', { conversationId, userId });
  
      if (!conversationId || !userId) {
        console.error('Missing parameters', { conversationId, userId });
        return socket.emit('error', { message: 'Missing parameters' });
      }
  
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      }).populate({
        path: 'messages',
        match: { 
          $or: [
            { deletedFor: { $ne: userId } },
            { deletedFor: { $exists: false } }
          ]
        },
        options: { sort: { createdAt: 1 } },
        populate: [
          { 
            path: 'sender', 
            select: 'firstName lastName profilePicture' 
          },
          { 
            path: 'receiver', 
            select: 'firstName lastName profilePicture' 
          }
        ]
      });
  
      if (!conversation) {
        console.log('No conversation found, sending empty array');
        return socket.emit('messageHistory', []);
      }
  
      console.log(`Found ${conversation.messages.length} messages for conversation ${conversationId}`);
      
      // Émettre directement au socket concerné
      socket.emit('messageHistory', conversation.messages);
      
      // Alternative si besoin d'émettre à une room spécifique
      // socket.to(userId).emit('messageHistory', conversation.messages);
  
    } catch (error) {
      console.error('Error in getMessages:', error);
      socket.emit('error', { 
        message: 'Failed to load messages',
        error: error.message 
      });
    }
  },



// Dans votre contrôleur messageController.js
initiateCall: async (socket, data) => {
  try {
    const { callerId, receiverId, type } = data;

    const call = new Call({
      caller: callerId,
      receiver: receiverId,
      type,
      startTime: new Date(),
      status: 'initiated'
    });

    await call.save();

    socket.to(receiverId).emit('incomingCall', {
      _id: call._id,
      callerId,
      receiverId,
      type,
      startTime: call.startTime
    });
    socket.emit('callInitiated', call); // Émettre callInitiated au caller
    return call;
  } catch (error) {
    console.error('Error initiating call:', error);
    socket.emit('error', { message: 'Failed to initiate call' });
  }
},

cancelCall: async (socket, data) => {
  try {
    const { callId, receiverId } = data;

    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: 'cancelled',
        endTime: new Date()
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) throw new Error('Call not found');

    // Ne pas appeler saveCallToConversation ici pour éviter le message
    // Notifier les deux parties pour cacher la notification
    socket.to(receiverId).emit('callCancelled', { callId: call._id });
    socket.emit('callCancelled', { callId: call._id });

    return call;
  } catch (error) {
    console.error('Error cancelling call:', error);
    socket.emit('error', { message: 'Failed to cancel call' });
  }
},

// Moodifiez la fonction endCall
endCall: async (socket, data) => {
  try {
    const { callId, duration, type } = data;

    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: 'ended',
        endTime: new Date(),
        duration: duration || 0,
        type: type || 'audio'
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) {
      console.warn('Call not found with ID:', callId);
      return null;
    }

    // Sauvegarder le message d'appel dans la conversation
    const callMessage = await module.exports.saveCallToConversation(call, socket);

    const callData = {
      callId: call._id,
      duration: call.duration,
      type: call.type,
      status: call.status,
      callerId: call.caller._id,
      receiverId: call.receiver._id,
      iconColor: 'green',
      callClass: 'ended-call',
      message: callMessage
    };

    // Émettre à tous les participants via socket.to()
    socket.to(call.caller._id.toString()).emit('callStatusUpdate', callData);
    socket.to(call.receiver._id.toString()).emit('callStatusUpdate', callData);
    socket.emit('callStatusUpdate', callData); // Émettre aussi à l'émetteur

    // Émettre l'événement callEnded pour synchroniser l'interface
    socket.to(call.caller._id.toString()).emit('callEnded', callData);
    socket.to(call.receiver._id.toString()).emit('callEnded', callData);
    socket.emit('callEnded', callData);

    console.log('Call ended successfully:', {
      callId: call._id,
      duration: call.duration,
      participants: [call.caller._id, call.receiver._id]
    });

    return { success: true, call, message: callMessage };
  } catch (error) {
    console.error('Error in endCall:', error);
    socket.emit('callError', { message: 'Failed to end call', error: error.message });
    return { success: false, error: error.message };
  }
},

  

  uploadAudio : async (req, res) => {
  try {
    console.log('Upload audio request received');
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ 
        success: false,
        message: 'Aucun fichier audio reçu',
        code: 'NO_FILE'
      });
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Validation du type de fichier
    const validAudioTypes = [
      'audio/mpeg',    // mp3
      'audio/wav',     // wav
      'audio/ogg',     // ogg
      'audio/x-m4a',   // m4a
      'audio/webm',    // webm
      'audio/aac'      // aac
    ];

    if (!validAudioTypes.includes(req.file.mimetype)) {
      console.log('Invalid file type:', req.file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'Type de fichier audio non supporté',
        receivedType: req.file.mimetype,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Vérification que Cloudinary a bien retourné un path
    if (!req.file.path) {
      console.error('Cloudinary upload failed - no path returned');
      return res.status(500).json({
        success: false,
        message: 'Échec de l\'upload sur Cloudinary',
        code: 'CLOUDINARY_ERROR'
      });
    }

    // Génération de l'URL de téléchargement
    const downloadUrl = `${req.file.path}?fl_attachment`;

    console.log('Upload successful:', {
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    return res.status(200).json({
      success: true,
      url: req.file.path,
      downloadUrl,
      fileType: 'audio',
      originalName: req.file.originalname,
      size: req.file.size,
      publicId: req.file.filename
    });

  } catch (error) {
    console.error('Server error during audio upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'upload audio',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
},
// Dans messageController.js
uploadCallRecording: async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No recording file uploaded',
        code: 'NO_FILE'
      });
    }

    const callId = req.body.callId;
    const duration = parseInt(req.body.duration) || 0;
    
    const call = await Call.findByIdAndUpdate(
      callId,
      {
        recording: {
          url: req.file.path,
          publicId: req.file.filename,
          duration,
          format: req.file.mimetype,
          size: req.file.size
        },
        status: 'ended',
        endTime: new Date(),
        duration
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found',
        code: 'CALL_NOT_FOUND'
      });
    }

    // Sauvegarder dans la conversation
    const callMessage = await module.exports.saveCallToConversation(call);

    res.status(200).json({
      success: true,
      url: req.file.path,
      callId: call._id,
      duration: call.duration,
      message: callMessage
    });

  } catch (error) {
    console.error('Recording upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Recording upload failed', 
      error: error.message,
      code: 'UPLOAD_ERROR'
    });
  }
},

// Modifiez handleCallResponse
handleCallResponse: async (socket, data) => {
  try {
    const { callId, accepted, receiverId } = data;
    
    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: accepted ? 'ongoing' : 'rejected',
        [accepted ? 'acceptedAt' : 'rejectedAt']: new Date()
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) throw new Error('Call not found');

    let callMessage;
    if (!accepted) {
      callMessage = await module.exports.saveCallToConversation(call, socket);
    }

    const callData = {
      callId: call._id,
      status: call.status,
      callerId: call.caller._id,
      receiverId: call.receiver._id,
      type: call.type,
      iconColor: accepted ? 'green' : 'red',
      callClass: accepted ? 'ongoing-call' : 'rejected-call',
      message: callMessage
    };

    socket.to(call.caller._id.toString()).emit('callStatusUpdate', callData);
    socket.to(receiverId).emit('callStatusUpdate', callData);
    socket.emit('callStatusUpdate', callData);

    return call;
  } catch (error) {
    console.error('Error handling call response:', error);
    socket.emit('error', { message: 'Failed to handle call response' });
  }
},




// Modifiez saveCallToConversation
saveCallToConversation: async function (call, socket) {
  try {
    const isSelfConversation = call.caller._id.toString() === call.receiver._id.toString();

    let conversation = await Conversation.findOne({
      participants: isSelfConversation ? [call.caller._id] : { $all: [call.caller._id, call.receiver._id] },
      isGroup: false,
      isSelfConversation
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: isSelfConversation ? [call.caller._id] : [call.caller._id, call.receiver._id],
        messages: [],
        isGroup: false,
        isSelfConversation
      });
    }

    let callStatusText = '';
    let iconColor = 'green';
    let callClass = 'ended-call';

    switch (call.status) {
      case 'ended':
        callStatusText = ` (${Math.round(call.duration)}s)`;
        iconColor = 'green';
        callClass = 'ended-call';
        break;
      case 'rejected':
        callStatusText = ' - Appel refusé';
        iconColor = 'red';
        callClass = 'rejected-call';
        break;
      case 'missed':
        callStatusText = ' - Appel manqué';
        iconColor = 'red';
        callClass = 'missed-call';
        break;
      case 'ignored':
        callStatusText = ' - Appel ignoré';
        iconColor = 'orange';
        callClass = 'ignored-call';
        break;
      case 'cancelled':
        callStatusText = ' - Appel annulé';
        iconColor = 'orange';
        callClass = 'cancelled-call';
        break;
      default:
        callStatusText = ' - Statut inconnu';
        iconColor = 'gray';
        callClass = 'unknown-call';
    }

    const callMessage = new Message({
      _id: call._id, // Utiliser l'ID de l'appel comme clé unique
      sender: call.caller._id,
      receiver: call.receiver._id,
      content: `Appel ${call.type === 'video' ? 'vidéo' : 'audio'}${callStatusText}`,
      isCall: true,
      callData: {
        callId: call._id,
        duration: call.duration || 0,
        type: call.type,
        status: call.status,
        caller: call.caller._id,
        receiver: call.receiver._id,
        iconColor,
        callClass,
        startTime: call.startTime,
        endTime: call.endTime
      },
      createdAt: new Date()
    });

    // Remplacer tout message existant avec le même callId
    conversation.messages = conversation.messages.filter(
      (msg) => msg.callData?.callId?.toString() !== call._id.toString()
    );
    conversation.messages.push(callMessage);
    conversation.lastMessage = callMessage._id;
    conversation.updatedAt = new Date();

    await Promise.all([callMessage.save(), conversation.save()]);
    call.conversation = conversation._id;
    await call.save();

    const populatedMessage = await Message.findById(callMessage._id)
      .populate('sender', 'firstName lastName profilePicture')
      .populate('receiver', 'firstName lastName profilePicture');

    socket.to(call.caller._id.toString()).emit('newMessage', populatedMessage);
    socket.to(call.receiver._id.toString()).emit('newMessage', populatedMessage);
    socket.emit('newMessage', populatedMessage);

    return populatedMessage;
  } catch (error) {
    console.error('Error saving call to conversation:', error);
    throw error;
  }
},


cancelCall: async (socket, data) => {
  try {
    const { callId, receiverId } = data;

    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: 'cancelled',
        endTime: new Date()
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) throw new Error('Call not found');

    // Ne pas sauvegarder dans la conversation pour éviter le message
    // Notifier les deux parties pour cacher la notification immédiatement
    socket.to(receiverId).emit('callCancelled', { callId: call._id });
    socket.emit('callCancelled', { callId: call._id });

    return call;
  } catch (error) {
    console.error('Error cancelling call:', error);
    socket.emit('error', { message: 'Failed to cancel call' });
  }
},


handleMissedCall: async (socket, data) => {
  try {
    console.log('Handling missed call:', data);
    const { callId, receiverId } = data;
    
    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: 'missed',
        endTime: new Date(),
        duration: 0
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) {
      throw new Error('Call not found');
    }

    console.log('Call marked as missed:', call);
    
    const callMessage = await module.exports.saveCallToConversation(call, socket);
    console.log('Call message created:', callMessage);

    const callData = {
      callId: call._id,
      status: 'missed',
      callerId: call.caller._id,
      receiverId: call.receiver._id,
      type: call.type,
      message: callMessage
    };

    socket.to(call.caller._id.toString()).emit('callMissed', callData);
    socket.to(call.receiver._id.toString()).emit('callMissed', callData);
    socket.emit('callMissed', callData);

    return call;
  } catch (error) {
    console.error('Error handling missed call:', error);
    socket.emit('error', { message: 'Failed to handle missed call' });
    throw error;
  }
},


handleIgnoredCall: async (socket, data) => {
  try {
    const { callId, receiverId } = data;
    
    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: 'ignored',
        endTime: new Date()
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) {
      throw new Error('Call not found');
    }

    const callMessage = await module.exports.saveCallToConversation(call, socket); // Correction ici

    socket.to(receiverId).emit('callMissedOrIgnored', {
      callId: call._id,
      message: callMessage
    });

    return call;
  } catch (error) {
    console.error('Error handling ignored call:', error);
    throw error;
  }
},

handleIgnoredCall: async (socket, data) => {
  try {
    const { callId, receiverId } = data;
    
    const call = await Call.findByIdAndUpdate(
      callId,
      {
        status: 'ignored',
        endTime: new Date()
      },
      { new: true }
    ).populate('caller receiver');

    if (!call) {
      throw new Error('Call not found');
    }

    // Sauvegarder dans la conversation et émettre le message
    const callMessage = await module.exports.saveCallToConversation(call, socket.io);

    // Émettre un événement spécifique pour les appels ignorés
    socket.to(receiverId).emit('callMissedOrIgnored', {
      callId: call._id,
      message: callMessage
    });

    return call;
  } catch (error) {
    console.error('Error handling ignored call:', error);
    throw error;
  }
},

deleteMessageForMe: async (socket, data) => {
  try {
    const { messageId, userId } = data;

    let message;
    if (!isValidObjectId(messageId)) {
      message = await Message.findOne({ tempId: messageId });
      if (!message) throw new Error('Message non trouvé avec ce tempId');
    } else {
      message = await Message.findById(messageId);
      if (!message) throw new Error('Message non trouvé');
    }

    if (!message.deletedFor) message.deletedFor = [];
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    const conversation = await Conversation.findOne({ messages: message._id });
    if (conversation) {
      // Émettre l'événement avec l'identifiant utilisé par le client
      const emittedMessageId = message.tempId || message._id;
      conversation.participants.forEach((participant) => {
        socket.to(participant.toString()).emit('messageDeletedForMe', { messageId: emittedMessageId, userId });
      });
      socket.emit('messageDeletedForMe', { messageId: emittedMessageId, userId });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression pour moi :', error);
    socket.emit('error', { message: 'Échec de la suppression pour moi' });
  }
},


deleteMessageForEveryone: async (socket, data) => {
  try {
    const { messageId } = data;

    let message;
    if (!isValidObjectId(messageId)) {
      message = await Message.findOne({ tempId: messageId });
      if (!message) throw new Error('Message non trouvé avec ce tempId');
    } else {
      message = await Message.findById(messageId);
      if (!message) throw new Error('Message non trouvé');
    }

    message.content = '*Message supprimé*';
    message.isDeleted = true;
    message.attachments = [];
    await message.save();

    const conversation = await Conversation.findOne({ messages: messageId });
    if (conversation) {
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'firstName lastName profilePicture')
        .populate('receiver', 'firstName lastName profilePicture');
      conversation.participants.forEach((participant) => {
        socket.to(participant.toString()).emit('messageDeletedForEveryone', populatedMessage);
      });
      socket.emit('messageDeletedForEveryone', populatedMessage);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression pour tous :', error);
    socket.emit('error', { message: 'Échec de la suppression pour tous' });
  }
},



editMessage: async (socket, data) => {
  try {
    const { messageId, content } = data;

    let message;
    if (!isValidObjectId(messageId)) {
      message = await Message.findOne({ tempId: messageId });
      if (!message) throw new Error('Message non trouvé avec ce tempId');
    } else {
      message = await Message.findById(messageId);
      if (!message) throw new Error('Message non trouvé');
    }

    const now = new Date();
    const messageTime = new Date(message.createdAt);
    const diffInMinutes = (now - messageTime) / (1000 * 60);
    if (diffInMinutes > 5) throw new Error('Délai de modification du message dépassé');

    message.content = content;
    message.edited = true;
    message.updatedAt = new Date();
    await message.save();

    const conversation = await Conversation.findOne({ messages: message._id });
    if (conversation) {
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'firstName lastName profilePicture')
        .populate('receiver', 'firstName lastName profilePicture');
      conversation.participants.forEach((participant) => {
        socket.to(participant.toString()).emit('messageEdited', populatedMessage);
      });
      socket.emit('messageEdited', populatedMessage);
    }
  } catch (error) {
    console.error('Erreur lors de la modification du message :', error);
    socket.emit('error', { message: 'Échec de la modification du message' });
  }
},

};
