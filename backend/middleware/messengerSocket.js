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
  });
};