const jwt = require("jsonwebtoken");
const messageController = require("../Controllers/messageController");
const mongoose = require("mongoose");
const Conversation = mongoose.model("Conversation");
const Message = mongoose.model("Message");

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
      socket.join(decoded.userId); // Rejoindre une salle personnelle pour les notifications utilisateur
      console.log(`Utilisateur ${socket.userId} connecté via Socket.IO`);
      io.emit("userStatus", { userId: socket.userId, isOnline: true });
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Authentification explicite (optionnel, déjà géré par le middleware)
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

        // Vérifier si l'utilisateur fait partie de la conversation
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
      const { senderId, content, attachments, tempId, conversationId, isGroup } = data;

      try {
        // Vérifier que l'utilisateur est authentifié
        if (!socket.userId || socket.userId !== senderId) {
          console.error("Utilisateur non authentifié ou non autorisé");
          socket.emit("error", { message: "Utilisateur non authentifié ou non autorisé" });
          return;
        }

        // Trouver la conversation
        const conversation = await Conversation.findById(conversationId).populate("participants");
        if (!conversation) {
          console.error("Conversation non trouvée:", conversationId);
          socket.emit("error", { message: "Conversation non trouvée" });
          return;
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        const isParticipant = conversation.participants.some(
          (participant) => participant._id.toString() === senderId
        );
        if (!isParticipant) {
          console.error("Utilisateur non autorisé dans cette conversation");
          socket.emit("error", { message: "Utilisateur non autorisé dans cette conversation" });
          return;
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

        // Ajouter le message au tableau messages de la conversation
        conversation.messages = conversation.messages || [];
        conversation.messages.push(newMessage._id);
        conversation.lastMessage = newMessage._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Peupler les informations du sender pour l'envoi aux clients
        const populatedMessage = await Message.findById(newMessage._id)
          .populate("sender", "firstName lastName profilePicture")
          .populate("conversation");

        // Émettre le message à tous les participants via la salle de la conversation
        console.log(`Émission de newMessage à la salle de la conversation ${conversationId}`);
        io.to(conversationId).emit("newMessage", populatedMessage);

        // Confirmer l'envoi à l'expéditeur
        console.log(`Confirmation de l'envoi à l'expéditeur ${senderId} avec tempId ${tempId}`);
        socket.emit("messageSent", { ...populatedMessage.toObject(), tempId });
      } catch (error) {
        console.error("Erreur lors de l’envoi du message:", error);
        socket.emit("error", { message: "Erreur lors de l’envoi du message" });
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