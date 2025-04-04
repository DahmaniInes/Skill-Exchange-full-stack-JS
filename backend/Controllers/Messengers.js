const User = require("../Models/User"); // Adjust the path as needed
const { Conversation, Message } = require('../Models/MessageSchema');
const  onlineUsers  = require('../Utils/onlineUsers'); // Importez depuis app.js


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
          isOnline: p._id ? onlineUsers.has(p._id.toString()) : false, // Vérification sécurisée
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


const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({}).select('-password -authKeyTOTP'); // Exclude sensitive fields
    
    // Return the users
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message
    });
  }

}



const deleteConversationForUser = async (req, res) => {
  try {
      const { conversationId } = req.query;
      const userId = req.userId;

      if (!conversationId) {
          return res.status(400).json({
              success: false,
              message: "ID de conversation manquant"
          });
      }

      // 1. Trouver la conversation
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
          return res.status(404).json({
              success: false,
              message: "Conversation non trouvée"
          });
      }

      // 2. Vérifier que l'utilisateur fait partie de la conversation
      if (!conversation.participants.some(p => p.toString() === userId.toString())) {
          return res.status(403).json({
              success: false,
              message: "Vous n'êtes pas autorisé à modifier cette conversation"
          });
      }

      // 3. Supprimer tous les messages de la conversation
      await Message.deleteMany({ _id: { $in: conversation.messages } });

      // 4. Mettre à jour la conversation pour la vider
      await Conversation.findByIdAndUpdate(
          conversationId,
          { 
              $set: { 
                  messages: [],      // Vide le tableau des messages
                  lastMessage: null  // Réinitialise le dernier message
              } 
          }
      );

      res.status(200).json({
          success: true,
          message: "Tous les messages de la conversation ont été supprimés"
      });

  } catch (error) {
      console.error("Erreur lors de la suppression des messages:", error);
      res.status(500).json({
          success: false,
          message: "Erreur serveur lors de la suppression des messages",
          error: error.message
      });
  }
}











const getAllConversations = async (req, res) => {
  try {
    // 1. Récupérer toutes les conversations sans filtre
    const conversations = await Conversation.find()
      .populate({
        path: 'participants',
        select: 'firstName lastName profilePicture email'
      })
      .populate({
        path: 'groupAdmin',
        select: 'firstName lastName profilePicture'
      })
      .populate({
        path: 'lastMessage',
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
      })
      .sort({ updatedAt: -1 })
      .lean();

    // 2. Récupérer les messages pour chaque conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await Message.find({ _id: { $in: conversation.messages } })
          .populate('sender', 'firstName lastName profilePicture')
          .populate('receiver', 'firstName lastName profilePicture')
          .populate({
            path: 'replyTo',
            populate: {
              path: 'sender',
              select: 'firstName lastName'
            }
          })
          .sort({ createdAt: 1 })
          .lean();

        return {
          ...conversation,
          messages: messages.map(msg => ({
            ...msg,
            attachments: msg.attachments?.map(att => ({
              ...att,
              url: process.env.MEDIA_BASE_URL + att.url
            }))
          }))
        };
      })
    );

    // 3. Formater la réponse
    const response = conversationsWithMessages.map(conv => ({
      _id: conv._id,
      isGroup: conv.isGroup,
      isSelfConversation: conv.isSelfConversation,
      groupName: conv.groupName,
      groupPhoto: conv.groupPhoto,
      participants: conv.participants,
      groupAdmin: conv.groupAdmin,
      lastMessage: conv.lastMessage,
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: response.length,
      data: response
    });

  } catch (error) {
    console.error('Error fetching all conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des conversations',
      error: error.message
    });
  }
};


module.exports = { getAllUsers,deleteConversationForUser, getUserConversations,getAllConversations }