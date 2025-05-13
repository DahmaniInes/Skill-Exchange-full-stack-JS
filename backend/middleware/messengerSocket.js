const jwt = require("jsonwebtoken");
const messageController = require("../Controllers/messageController");
const mongoose = require("mongoose");
const Conversation = mongoose.model("Conversation");
const Message = mongoose.model("Message");
const axios = require('axios');


module.exports = (io, onlineUsers) => {
  // Vérifier que io est bien défini
  if (!io) {
    console.error("Erreur: l'instance Socket.IO (io) n'est pas définie.");
    throw new Error("Socket.IO instance (io) is not defined.");
  }

  // Middleware d'authentification
  io.use((socket, next) => {
    const token = socket.handshake.auth.token?.split(" ")[1];
    if (!token) {
      console.error("Authentication error - No token provided");
      return next(new Error("Authentication error - No token provided"));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("Authentication error - Invalid token:", err.message);
        return next(new Error("Authentication error - Invalid token"));
      }
      socket.userId = decoded.userId;
      onlineUsers.add(decoded.userId);
      socket.join(decoded.userId);
      console.log(`Utilisateur ${socket.userId} connecté via Socket.IO`);
      io.emit("userStatus", { userId: socket.userId, isOnline: true });
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Authentification explicite (optionnel)
    socket.on("authenticate", (userId) => {
      if (socket.userId !== userId) {
        console.error(`Authentification échouée: userId ${userId} ne correspond pas à socket.userId ${socket.userId}`);
        return;
      }
      console.log(`User ${userId} authenticated`);
    });

    // Rejoindre une conversation spécifique
    socket.on("joinConversation", async (conversationId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          console.error(`ID de conversation invalide: ${conversationId}`);
          socket.emit("error", { message: "ID de conversation invalide" });
          return;
        }

        const conversation = await Conversation.findById(conversationId).populate("participants");
        if (!conversation) {
          console.error(`Conversation non trouvée: ${conversationId}`);
          socket.emit("error", { message: "Conversation non trouvée" });
          return;
        }

        const isParticipant = conversation.participants.some(
          (participant) => participant._id.toString() === socket.userId
        );
        if (!isParticipant) {
          console.error(`Utilisateur ${socket.userId} non autorisé dans la conversation ${conversationId}`);
          socket.emit("error", { message: "Utilisateur non autorisé dans cette conversation" });
          return;
        }

        socket.join(conversationId);
        console.log(`Utilisateur ${socket.userId} a rejoint la conversation ${conversationId}`);
      } catch (error) {
        console.error(`Erreur lors de la tentative de rejoindre la conversation ${conversationId}:`, error);
        socket.emit("error", { message: "Erreur lors de la tentative de rejoindre la conversation" });
      }
    });

    // Gestion de l'envoi de messages
    socket.on("sendMessage", async (data) => {
      try {
        console.log('Événement sendMessage reçu:', data);
        await messageController.sendMessage(socket, io, data);
      } catch (error) {
        console.error("Erreur dans l'événement sendMessage:", error);
        socket.emit("error", { message: "Erreur lors de l’envoi du message" });
      }
    });




      // Ajout d'un écouteur pour déboguer emotionalAlert
      socket.on("emotionalAlert", (alertData) => {
        console.log(`Événement emotionalAlert reçu pour l'utilisateur ${socket.userId}:`, alertData);
      });
  
      socket.on("initiateCall", async (data) => {
        try {
          const call = await messageController.initiateCall(socket, data);
          socket.emit("callInitiated", call);
        } catch (error) {
          console.error("Call initiation error:", error);
          socket.emit("error", { message: "Erreur lors de l'initiation de l'appel" });
        }
      });














// Gestion des messages du chatbot en temps réel
socket.on("sendChatbotMessage", async (data) => {
  try {
    console.log('Événement sendChatbotMessage reçu:', data);
    const { message } = data;
    const userId = socket.userId;

    if (!message || !userId) {
      socket.emit("error", { message: "Message ou userId manquant" });
      return;
    }

    // Appeler l'API Flask via axios
    const flaskResponse = await axios.post('http://localhost:5002/chatbot/message', {
      user_id: userId,
      message
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });

    const response = flaskResponse.data.response;
    console.log('Réponse du chatbot:', response);

    // Émettre la réponse du chatbot au client
    socket.emit("chatbotMessage", { message, response });
  } catch (error) {
    console.error("Erreur dans l'événement sendChatbotMessage:", error);
    socket.emit("error", { message: "Erreur lors de l'envoi du message au chatbot" });
  }
});
















    // Gestion des appels
    socket.on("initiateCall", async (data) => {
      try {
        const call = await messageController.initiateCall(socket, data);
        socket.emit("callInitiated", call);
      } catch (error) {
        console.error("Call initiation error:", error);
        socket.emit("error", { message: "Erreur lors de l'initiation de l'appel" });
      }
    });

    socket.on("callResponse", async (data) => {
      await messageController.handleCallResponse(socket, data);
    });

    socket.on("endCall", async (data) => {
      await messageController.endCall(socket, data);
    });

    socket.on("cancelCall", async (data) => {
      await messageController.cancelCall(socket, data);
    });

    socket.on("callIgnored", async (data) => {
      await messageController.handleIgnoredCall(socket, data);
    });

    socket.on("callMissed", async (data) => {
      await messageController.handleMissedCall(socket, data);
    });

    // Gestion des messages (lecture, suppression, modification)
    socket.on("markAsRead", async ({ messageId, userId }) => {
      await messageController.markAsRead(socket, messageId, userId);
    });

    socket.on("getMessages", async ({ userId, otherUserId }) => {
      await messageController.getMessages(socket, userId, otherUserId);
    });

    socket.on("deleteMessageForMe", async (data) => {
      await messageController.deleteMessageForMe(socket, data);
    });

    socket.on("deleteMessageForEveryone", async (data) => {
      await messageController.deleteMessageForEveryone(socket, data);
    });

    socket.on("editMessage", async (data) => {
      await messageController.editMessage(socket, data);
    });

    // Déconnexion
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit("userStatus", { userId: socket.userId, isOnline: false });
        console.log(`Client disconnected: ${socket.id}, userId: ${socket.userId}`);
      }
    });
  });
};