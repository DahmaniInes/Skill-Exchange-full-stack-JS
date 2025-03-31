const { Conversation, Message } = require('../Models/MessageSchema');
const { upload } = require('../Config/cloudinaryMessenger');
const { v4: uuidv4 } = require('uuid');

const messageController = {
  // Uploader un fichier
  async uploadFile(req, res) {
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
  async sendMessage(socket, data) {
    try {
      const { senderId, receiverId, content = '', attachments = [] } = data;
      
      const isSelfConversation = senderId === receiverId;

      // Trouver ou créer une conversation
      let conversation = await Conversation.findOne({
        participants: isSelfConversation ? [senderId] : { $all: [senderId, receiverId] },
        isGroup: false,
        isSelfConversation: isSelfConversation
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: isSelfConversation ? [senderId] : [senderId, receiverId],
          messages: [],
          isGroup: false,
          isSelfConversation: isSelfConversation
        });
      }

      // Créer le nouveau message
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content: content || '',
        read: false,
        isSelfMessage: isSelfConversation,
        attachments: attachments.map(file => ({
          url: file.url,
          fileType: file.fileType,
          originalName: file.originalName
        }))
      });

      // Ajouter le message à la conversation
      conversation.messages.push(newMessage);
      conversation.lastMessage = newMessage._id;
      
      await Promise.all([newMessage.save(), conversation.save()]);

      // Populer les informations avant d'émettre
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'firstName lastName profilePicture')
        .populate('receiver', 'firstName lastName profilePicture');

      // Émettre le message
      socket.to(receiverId).emit('newMessage', populatedMessage);
      socket.emit('messageSent', populatedMessage);

      return populatedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  },

  // Marquer un message comme lu
  async markAsRead(socket, messageId, userId) {
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
  async getMessages(socket, userId, otherUserId) {
    try {
      const isSelfConversation = userId === otherUserId;
      const conversation = await Conversation.findOne({
        participants: isSelfConversation ? [userId] : { $all: [userId, otherUserId] },
        isGroup: false,
        isSelfConversation: isSelfConversation
      })
      .populate({
        path: 'messages',
        populate: [
          { path: 'sender', select: 'firstName lastName profilePicture' },
          { path: 'receiver', select: 'firstName lastName profilePicture' }
        ]
      });

      if (conversation) {
        socket.emit('messageHistory', conversation.messages);
      } else {
        socket.emit('messageHistory', []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      socket.emit('error', { message: 'Failed to load messages' });
    }
  },

  // Ajoutez cette méthode au messageController
  

async uploadAudio(req, res) {
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
}
};

module.exports = messageController;