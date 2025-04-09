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
   sendMessage : async (socket, io, data) => {
    const { senderId, content, attachments, tempId, conversationId, isGroup } = data;
  
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!socket.userId || socket.userId !== senderId) {
        throw new Error("Utilisateur non authentifié ou non autorisé");
      }
  
      // Trouver la conversation
      const conversation = await Conversation.findById(conversationId).populate("participants");
      if (!conversation) {
        throw new Error("Conversation non trouvée");
      }
  
      // Vérifier que l'utilisateur fait partie de la conversation
      const isParticipant = conversation.participants.some(
        (participant) => participant._id.toString() === senderId
      );
      if (!isParticipant) {
        throw new Error("Utilisateur non autorisé dans cette conversation");
      }
  
      // Créer un nouveau message
      const newMessage = new Message({
        conversation: conversationId,
        sender: senderId,
        content,
        attachments,
        createdAt: new Date(),
      });
  
      // Sauvegarder le message dans la base de données
      await newMessage.save();
  
      // Mettre à jour la conversation avec le dernier message
      conversation.lastMessage = newMessage._id;
      conversation.updatedAt = new Date();
      await conversation.save();
  
      // Peupler les informations du sender pour l'envoi aux clients
      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "firstName lastName profilePicture")
        .populate("conversation");
  
      // Émettre le message à tous les participants
      if (isGroup) {
        conversation.participants.forEach((participant) => {
          io.to(participant._id.toString()).emit("newMessage", populatedMessage);
        });
      } else {
        const otherParticipant = conversation.participants.find(
          (p) => p._id.toString() !== senderId
        );
        io.to(senderId).emit("newMessage", populatedMessage);
        if (otherParticipant) {
          io.to(otherParticipant._id.toString()).emit("newMessage", populatedMessage);
        }
      }
  
      // Confirmer l'envoi à l'expéditeur
      socket.emit("messageSent", { ...populatedMessage.toObject(), tempId });
    } catch (error) {
      console.error("Erreur lors de l’envoi du message:", error);
      socket.emit("error", { message: error.message });
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


  initiateCall: async (socket, data) => {
    try {
      const { callerId, conversationId, type } = data;
  
      console.log('Initiating call with data:', { callerId, conversationId, type });
  
      if (!callerId || !conversationId || !type) {
        throw new Error('Missing required parameters');
      }
  
      const conversation = await Conversation.findById(conversationId).populate('participants');
      if (!conversation) throw new Error('Conversation not found');
  
      const participants = conversation.participants.map(p => p._id);
      const isGroupCall = conversation.isGroup;
  
      const call = new Call({
        caller: callerId,
        participants,
        type,
        startTime: new Date(),
        status: 'initiated',
        conversation: conversationId,
        isGroupCall
      });
  
      await call.save();
      console.log('Call saved:', call._id);
  
      // Convertir l'objet Mongoose en POJO pour éviter les références circulaires
      const callData = call.toObject();
  
      participants.forEach(participantId => {
        if (participantId.toString() !== callerId) {
          console.log('Emitting incomingCall to:', participantId.toString());
          socket.to(participantId.toString()).emit('incomingCall', {
            _id: callData._id,
            callerId,
            conversationId,
            type,
            startTime: callData.startTime,
            isGroupCall
          });
        }
      });
  
      socket.emit('callInitiated', callData);
      console.log('callInitiated emitted to caller:', callerId);
  
      // Stocker le timeout dans une Map globale ou une propriété de l'objet call
      const missedCallTimeout = setTimeout(async () => {
        const updatedCall = await Call.findById(call._id);
        if (updatedCall && updatedCall.status === 'initiated') {
          updatedCall.status = 'missed';
          updatedCall.endTime = new Date();
          await updatedCall.save();
  
          const callMessage = await module.exports.saveCallToConversation(updatedCall, socket);
          const callDataMissed = {
            callId: updatedCall._id,
            status: 'missed',
            callerId: updatedCall.caller,
            conversationId: updatedCall.conversation,
            type: updatedCall.type,
            isGroupCall: updatedCall.isGroupCall,
            message: callMessage
          };
  
          participants.forEach(participantId => {
            socket.to(participantId.toString()).emit('callMissed', callDataMissed);
          });
          socket.emit('callMissed', callDataMissed);
          console.log('Call marked as missed after 20 seconds:', call._id);
        } else {
          console.log('Call not marked as missed, current status:', updatedCall?.status);
        }
      }, 40000);
  
      // Stocker le timeout dans l'objet call pour pouvoir l'annuler plus tard
      call.missedCallTimeout = missedCallTimeout;
  
      return call; // Retourner l'objet call avec le timeout
    } catch (error) {
      console.error('Call initiation error:', error);
      socket.emit('error', { message: 'Failed to initiate call', error: error.message });
    }
  },






  cancelCall: async (socket, data) => {
    try {
      const { callId } = data;
  
      const call = await Call.findByIdAndUpdate(
        callId,
        {
          status: 'cancelled',
          endTime: new Date()
        },
        { new: true }
      ).populate('participants caller'); // Remplace "receiver" par "participants" et "caller"
  
      if (!call) throw new Error('Call not found');
  
      const callMessage = await module.exports.saveCallToConversation(call, socket);
  
      const callData = {
        callId: call._id,
        status: call.status,
        conversationId: call.conversation,
        message: callMessage
      };
  
      // Notifier tous les participants
      call.participants.forEach(participantId => {
        socket.to(participantId.toString()).emit('callCancelled', callData);
      });
      socket.emit('callCancelled', callData);
  
      console.log('Call cancelled successfully:', call._id);
      return call;
    } catch (error) {
      console.error('Error cancelling call:', error);
      socket.emit('error', { message: 'Failed to cancel call', error: error.message });
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
    ).populate('caller participants');

    if (!call) throw new Error('Call not found');

    const callMessage = await module.exports.saveCallToConversation(call, socket);

    const callData = {
      callId: call._id,
      duration: call.duration,
      type: call.type,
      status: call.status,
      conversationId: call.conversation,
      isGroupCall: call.isGroupCall,
      message: callMessage
    };

    // Notifier tous les participants
    call.participants.forEach(participant => {
      socket.to(participant._id.toString()).emit('callEnded', callData);
    });
    socket.emit('callEnded', callData);

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

handleCallResponse: async (socket, data) => {
  try {
    const { callId, accepted, receiverId } = data;

    const call = await Call.findById(callId).populate('caller participants');
    if (!call) throw new Error('Call not found');

    call.status = accepted ? 'ongoing' : 'rejected';
    if (accepted) call.acceptedAt = new Date();
    else call.endTime = new Date();
    await call.save();

    let callMessage;
    if (!accepted) {
      callMessage = await module.exports.saveCallToConversation(call, socket);
    }

    const callData = {
      callId: call._id,
      status: call.status,
      callerId: call.caller._id,
      conversationId: call.conversation,
      type: call.type,
      isGroupCall: call.isGroupCall,
      message: callMessage
    };

    // Si accepté, annuler le timeout du "missed"
    if (accepted && call.missedCallTimeout) {
      clearTimeout(call.missedCallTimeout);
      console.log('Missed call timeout cleared for call:', call._id);
    }

    call.participants.forEach(participant => {
      socket.to(participant._id.toString()).emit('callStatusUpdate', callData);
    });
    socket.emit('callStatusUpdate', callData);

    if (accepted) {
      call.participants.forEach(participant => {
        socket.to(participant._id.toString()).emit('callStarted', callData);
      });
      socket.emit('callStarted', callData);
    }

    return call;
  } catch (error) {
    console.error('Error handling call response:', error);
    socket.emit('error', { message: 'Failed to handle call response' });
  }
},




saveCallToConversation: async function (call, socket) {
  try {
    const conversation = await Conversation.findById(call.conversation).populate('participants');
    if (!conversation) throw new Error('Conversation not found');

    let callStatusText = '';
    let iconColor = 'green';
    let callClass = 'ended-call';

    switch (call.status) {
      case 'ended':
        callStatusText = call.duration ? ` (${Math.round(call.duration)}s)` : '';
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
      case 'cancelled':
        callStatusText = ' - Appel annulé';
        iconColor = 'orange';
        callClass = 'cancelled-call';
        break;
      default:
        callStatusText = '';
    }

    const callMessage = new Message({
      _id: call._id,
      sender: call.caller,
      conversation: call.conversation,
      content: `${call.isGroupCall ? 'Appel de groupe' : 'Appel'} ${call.type === 'video' ? 'vidéo' : 'audio'}${callStatusText}`,
      isCall: true,
      callData: {
        callId: call._id,
        duration: call.duration || 0,
        type: call.type,
        status: call.status,
        startTime: call.startTime,
        endTime: call.endTime,
        iconColor,
        callClass
      },
      createdAt: new Date()
    });

    // Ajouter ou remplacer le message dans la conversation
    conversation.messages = conversation.messages.filter(
      msg => msg.callData?.callId?.toString() !== call._id.toString()
    );
    conversation.messages.push(callMessage);
    conversation.lastMessage = callMessage._id;
    conversation.updatedAt = new Date();

    await Promise.all([callMessage.save(), conversation.save()]);
    const populatedMessage = await Message.findById(callMessage._id)
      .populate('sender', 'firstName lastName profilePicture');

    // Émettre à tous les participants
    conversation.participants.forEach(participant => {
      socket.to(participant._id.toString()).emit('newMessage', populatedMessage);
    });
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
