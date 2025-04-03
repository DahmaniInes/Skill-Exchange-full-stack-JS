const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
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
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: String,
    fileType: {
      type: String,
      enum: ["image", "video", "document", "audio", "other"],
      required: true
    },
    originalName: String,
    _id: false
  }],
  tempId: String,
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  isCall: {
    type: Boolean,
    default: false
  },
  callData: {
    callId: mongoose.Schema.Types.ObjectId,
    duration: Number,
    type: {
      type: String,
      enum: ['audio', 'video']
    },
    status: {
      type: String,
      enum: ['initiated', 'ongoing', 'ended', 'missed', 'rejected', 'cancelled']
    },
    startTime: Date,
    endTime: Date,
    _id: false
  },
  edited: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    emoji: String,
    _id: false
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: String,
  groupPhoto: {
    type: String,
    default: "https://res.cloudinary.com/diahyrchf/group-default.png"
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  isSelfConversation: {
    type: Boolean,
    default: false
  },
  archivedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    archivedAt: {
      type: Date,
      default: Date.now
    },
    _id: false
  }]
}, { 
  timestamps: true 
});

// Exportez les modèles
module.exports = {
  Message: mongoose.model('Message', MessageSchema),
  Conversation: mongoose.model('Conversation', ConversationSchema)
};