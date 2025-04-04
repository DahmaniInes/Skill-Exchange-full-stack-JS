const jwt = require("jsonwebtoken");
const messageController = require("../Controllers/messageController");

module.exports = (io, onlineUsers) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token?.split(" ")[1];
    if (!token) return next(new Error("Authentication error - No token provided"));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Authentication error - Invalid token"));
      socket.userId = decoded.userId;
      onlineUsers.add(decoded.userId); // Utilise le paramètre onlineUsers
      socket.join(decoded.userId);
      console.log(`Utilisateur ${socket.userId} connecté via Socket.IO`);
      io.emit("userStatus", { userId: socket.userId, isOnline: true });
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("authenticate", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} connected`);
    });

    socket.on("sendMessage", async (data) => {
      await messageController.sendMessage(socket, data);
    });

    socket.on("markAsRead", async ({ messageId, userId }) => {
      await messageController.markAsRead(socket, messageId, userId);
    });

    socket.on("getMessages", async ({ userId, otherUserId }) => {
      await messageController.getMessages(socket, userId, otherUserId);
    });

    socket.on("initiateCall", async (data) => {
      try {
        const call = await messageController.initiateCall(socket, data);
        socket.emit("callInitiated", call);
      } catch (error) {
        console.error("Call initiation error:", error);
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

    socket.on("deleteMessageForMe", async (data) => {
      await messageController.deleteMessageForMe(socket, data);
    });

    socket.on("deleteMessageForEveryone", async (data) => {
      await messageController.deleteMessageForEveryone(socket, data);
    });

    socket.on("editMessage", async (data) => {
      await messageController.editMessage(socket, data);
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit("userStatus", { userId: socket.userId, isOnline: false });
        console.log(`Client disconnected: ${socket.id}`);
      }
    });
  });
};