const User = require("../Models/User");
const { Conversation, Message } = require('../Models/MessageSchema');
const onlineUsers = require('../Utils/onlineUsers');

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Fonction existante : getUserConversations
const getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("[1/8] Début de getUserConversations pour l’utilisateur:", userId);

    console.log("[2/8] Récupération des utilisateurs");
    const allUsers = await User.find({ _id: { $ne: userId } })
      .select("_id firstName lastName profilePicture")
      .lean();
    if (!allUsers || allUsers.length === 0) {
      console.log("[2/8] Aucun autre utilisateur trouvé");
    }

    console.log("[3/8] Vérification/Création des conversations");
    const createdConversations = [];
    await Promise.all(
      allUsers.map(async (user) => {
        const existing = await Conversation.findOne({
          participants: { $all: [userId, user._id] },
          isGroup: false,
        });
        if (!existing) {
          const newConv = await Conversation.create({
            participants: [userId, user._id],
            isGroup: false,
            isSelfConversation: false,
            messages: [],
          });
          createdConversations.push(newConv._id);
          console.log(`[3/8] Nouvelle conversation créée avec ${user._id}`);
        }
      })
    );

    console.log("[4/8] Gestion de la conversation personnelle");
    let selfConv = await Conversation.findOne({
      participants: { $size: 1, $all: [userId] },
      isGroup: false,
    });
    if (!selfConv) {
      selfConv = await Conversation.create({
        participants: [userId],
        isGroup: false,
        isSelfConversation: true,
        messages: [],
      });
      createdConversations.push(selfConv._id);
      console.log("[4/8] Conversation personnelle créée");
    }

    console.log("[5/8] Récupération des conversations");
    const conversations = await Conversation.find({
      participants: userId,
      "archivedBy.user": { $ne: userId },
    })
      .populate({
        path: "participants",
        select: "firstName lastName profilePicture",
      })
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "firstName lastName profilePicture" },
      })
      .sort({ updatedAt: -1 })
      .lean();

    if (!conversations.length) {
      console.log("[6/8] Aucune conversation trouvée");
    } else {
      console.log("[6/8] Conversations récupérées:", conversations.length);
    }

    console.log("[7/8] Formatage des conversations");
    const formatted = conversations.map((conv) => {
      const isSelf = conv.isSelfConversation === true;
      const otherParticipant = isSelf
        ? null
        : conv.participants?.find((p) => p?._id?.toString() !== userId.toString());

      return {
        _id: conv._id,
        name: isSelf
          ? "Moi-même"
          : conv.isGroup
          ? conv.groupName || "Groupe sans nom"
          : otherParticipant
          ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
          : "Utilisateur inconnu",
        isGroup: conv.isGroup || false,
        isSelfConversation: isSelf,
        image: isSelf
          ? "https://example.com/self-conversation.png"
          : conv.isGroup
          ? conv.groupPhoto
          : otherParticipant?.profilePicture || "https://example.com/user-default.png",
        lastMessage: conv.lastMessage || {
          content: isSelf ? "Écrivez-vous un message" : "Nouveau message",
          createdAt: null,
        },
        time: formatDate(conv.lastMessage?.createdAt),
        participants: conv.participants.map((p) => ({
          ...p,
          isOnline: p._id ? onlineUsers.has(p._id.toString()) : false,
        })),
        senderId: conv.lastMessage?.sender?._id?.toString(),
      };
    });

    console.log("[8/8] Envoi de la réponse", { conversations: formatted.length });
    res.status(200).json({
      success: true,
      data: formatted,
      created: createdConversations,
    });
  } catch (error) {
    console.error("❌ ERREUR dans getUserConversations:", error.stack);
    res.status(500).json({
      success: false,
      message: "Échec du chargement des conversations",
      error: error.message,
    });
  }
};

// Fonction existante : getAllUsers
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -authKeyTOTP');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// Fonction existante : deleteConversationForUser
const deleteConversationForUser = async (req, res) => {
  try {
    const { conversationId } = req.query;
    const userId = req.userId;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "ID de conversation manquant",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cette conversation",
      });
    }

    await Message.deleteMany({ _id: { $in: conversation.messages } });
    await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { messages: [], lastMessage: null } }
    );

    res.status(200).json({
      success: true,
      message: "Tous les messages de la conversation ont été supprimés",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression des messages:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression des messages",
      error: error.message,
    });
  }
};

// Nouvelle fonction : createGroupConversation
const createGroupConversation = async (req, res) => {
  try {
    const { participants, name } = req.body;
    const userId = req.userId;

    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({
        success: false,
        message: "La liste des participants doit contenir au moins 2 utilisateurs",
      });
    }

    if (!participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Vous devez être inclus dans les participants",
      });
    }

    const conversation = await Conversation.create({
      participants,
      isGroup: true,
      groupName: name || "Nouveau groupe",
      messages: [],
      groupAdmin: userId,
    });

    res.status(201).json({
      success: true,
      message: "Groupe créé avec succès",
      conversation,
    });
  } catch (error) {
    console.error("Erreur lors de la création du groupe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du groupe",
      error: error.message,
    });
  }
};

// Nouvelle fonction : addParticipantToGroup
const addParticipantToGroup = async (req, res) => {
  try {
    const { conversationId, userId: newUserId } = req.body;
    const currentUserId = req.userId;

    if (!conversationId || !newUserId) {
      return res.status(400).json({
        success: false,
        message: "ID de conversation et ID d'utilisateur requis",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: "Cette conversation n'est pas un groupe",
      });
    }

    if (!conversation.participants.some((p) => p.toString() === currentUserId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce groupe",
      });
    }

    if (conversation.participants.some((p) => p.toString() === newUserId.toString())) {
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà dans le groupe",
      });
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $push: { participants: newUserId } },
      { new: true }
    ).populate("participants", "firstName lastName profilePicture");

    res.status(200).json({
      success: true,
      message: "Utilisateur ajouté au groupe",
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout au groupe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout au groupe",
      error: error.message,
    });
  }
};

// Nouvelle fonction : sendSystemMessage (corrigée)
const sendSystemMessage = async (req, res) => {
  try {
    const { conversationId, content, action, actionBy, actionTarget } = req.body;
    const userId = req.userId;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        message: "ID de conversation et contenu requis",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à envoyer un message dans cette conversation",
      });
    }

    // Création du message système avec le champ `conversation`
    const systemMessage = await Message.create({
      conversation: conversationId, // Ajout du champ `conversation`
      sender: userId,
      content, // Contenu générique, par ex. "User added to conversation"
      isSystemMessage: true,
      systemData: {
        action: action || "user_added",
        actionBy: actionBy || userId,
        actionTarget: actionTarget,
      },
    });

    // Mise à jour de la conversation avec le nouveau message
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: systemMessage._id },
        $set: { lastMessage: systemMessage._id },
      },
      { new: true }
    );

    // Émettre l'événement newMessage via Socket.IO si nécessaire
    if (req.io) {
      const populatedMessage = await Message.findById(systemMessage._id)
        .populate('sender')
        .populate('conversation')
        .exec();

      const participants = conversation.participants.map((p) => p.toString());
      participants.forEach((participantId) => {
        const participantSocketId = onlineUsers.get(participantId);
        if (participantSocketId) {
          req.io.to(participantSocketId).emit('newMessage', populatedMessage);
          console.log(`newMessage émis à ${participantId} (socket: ${participantSocketId})`);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Message système envoyé",
      data: systemMessage,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi du message système:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'envoi du message système",
      error: error.message,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('firstName lastName profilePicture');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  deleteConversationForUser,
  getUserConversations,
  createGroupConversation,
  addParticipantToGroup,
  sendSystemMessage,
  getCurrentUser,
};