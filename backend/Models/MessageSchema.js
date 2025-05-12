const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return !this.isSystemMessage;
    },
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  }],
  isSystemMessage: {
    type: Boolean,
    default: false,
  },
  emotions: {
    anger: { type: Number, default: 0 },
    anticipation: { type: Number, default: 0 },
    disgust: { type: Number, default: 0 },
    fear: { type: Number, default: 0 },
    joy: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    positive: { type: Number, default: 0 },
    sadness: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
    trust: { type: Number, default: 0 }
  },
  emoji: {
    type: String,
    default: '😐'
  },
  receiverEmotions: {
    anger: { type: Number, default: 0 },
    anticipation: { type: Number, default: 0 },
    disgust: { type: Number, default: 0 },
    fear: { type: Number, default: 0 },
    joy: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    positive: { type: Number, default: 0 },
    sadness: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
    trust: { type: Number, default: 0 }
  },
  receiverEmoji: {
    type: String,
    default: '😐'
  },
  systemData: {
    action: {
      type: String,
      enum: [
        'group_name_updated',
        'group_photo_updated',
        'participant_added',
        'participant_removed',
        'user_added',
        'user_left',
        'user_blocked',
        'user_unblocked',
      ],
      required: function () {
        return this.isSystemMessage;
      },
    },
    actionBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.isSystemMessage;
      },
    },
    actionTarget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customContent: {
      forAuthor: String,
      forOthers: String,
    },
  },
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
  groupName: {
    type: String,
    default: "Groupe sans nom"
  },
  groupPhoto: {
    type: String,
    default: 'https://static.vecteezy.com/ti/vecteur-libre/p1/5194103-icone-de-personnes-conception-plate-de-symbole-de-personnes-sur-un-fond-blanc-gratuit-vectoriel.jpg',
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
  }],
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
}, {
  timestamps: true
});

module.exports = {
  Message: mongoose.model('Message', MessageSchema),
  Conversation: mongoose.model('Conversation', ConversationSchema)
};