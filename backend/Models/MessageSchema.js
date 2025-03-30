const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: false,
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    },
    // Pour les fichiers/images partagés
    attachments: [{
      url: String,
      fileType: {
        type: String,
        enum: ["image", "video", "document", "audio", "other"]
      },
      originalName: String
    }],
    // Pour les messages supprimés
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    // Réponse à un message précédent
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    // Réactions aux messages
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      emoji: String
    }]
  },
  { timestamps: true }
);


const ConversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],
    messages: [MessageSchema],
    // Pour les conversations de groupe
    isGroup: {
      type: Boolean,
      default: false
    },
    groupName: {
      type: String,
      trim: true
    },
    groupPhoto: {
      type: String,
      default: "https://res.cloudinary.com/diahyrchf/group-default.png"
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    // Dernier message pour le tri
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    // Pour masquer la conversation pour certains utilisateurs
    archivedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      archivedAt: {
        type: Date,
        default: Date.now
      }
    
    }]
  ,
  isSelfConversation: {
    type: Boolean,
    default: false
  }},
  { timestamps: true }
);

// Index pour optimiser les requêtes
ConversationSchema.index({ participants: 1, lastMessage: -1 });
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = {
  Message: mongoose.model("Message", MessageSchema),
  Conversation: mongoose.model("Conversation", ConversationSchema)
};