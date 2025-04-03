const messageController = require('../Controllers/messageController');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Authentification de l'utilisateur
    socket.on('authenticate', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} connected`);
    });

    // Envoyer un message
    socket.on('sendMessage', async (data) => {
      await messageController.sendMessage(socket, data);
    });

    // Marquer un message comme lu
    socket.on('markAsRead', async ({ messageId, userId }) => {
      await messageController.markAsRead(socket, messageId, userId);
    });

    // Récupérer l'historique des messages
    socket.on('getMessages', async ({ userId, otherUserId }) => {
      await messageController.getMessages(socket, userId, otherUserId);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Dans votre configuration Socket.IO
socket.on('initiateCall', async (data) => {
  try {
    const call = await messageController.initiateCall(socket, data);
    socket.emit('callInitiated', call);
  } catch (error) {
    console.error('Call initiation error:', error);
  }
});

socket.on('callResponse', async (data) => {
  try {
    await messageController.handleCallResponse(socket, data);
  } catch (error) {
    console.error('Call response error:', error);
  }
});

socket.on('endCall', async (data) => {
  try {
    await messageController.endCall(socket, data);
  } catch (error) {
    console.error('Call end error:', error);
  }
});

socket.on('cancelCall', async (data) => {
  await messageController.cancelCall(socket, data);
});

socket.on('callIgnored', async (data) => {
  await messageController.handleIgnoredCall(socket, data);
});

socket.on('callMissed', async (data) => {
  await messageController.handleMissedCall(socket, data);
});

  });
};