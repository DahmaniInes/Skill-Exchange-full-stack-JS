const { Conversation, Message } = require('../Models/MessageSchema');
const { upload } = require('../Config/cloudinaryMessenger');

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
  }
};


const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };
    
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      setAudioBlob(audioBlob);
      const audioUrl = URL.createObjectURL(audioBlob);
      setFilePreview(audioUrl);
    };
    
    mediaRecorderRef.current.start();
    setIsRecording(true);
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Microphone access denied or not available');
  }
};

const stopRecording = () => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  }
};

const handleSendVoiceMessage = async () => {
  if (!audioBlob) return;
  
  try {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.wav');
    
    const uploadResponse = await fetch('http://localhost:5000/MessengerRoute/upload', {
      method: 'POST',
      body: formData
    });
    
    const fileInfo = await uploadResponse.json();
    
    const messageData = {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      content: 'Voice message',
      attachments: [{
        url: fileInfo.url,
        fileType: 'audio',
        originalName: 'voice-message.wav'
      }]
    };
    
    socketRef.current.emit('sendMessage', messageData);
    
    // Reset audio state
    setAudioBlob(null);
    setFilePreview(null);
  } catch (error) {
    console.error('Error sending voice message:', error);
  } finally {
    setIsUploading(false);
  }
};

module.exports = messageController;