const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MessageSchema = new mongoose.Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation', // Référence au modèle Conversation
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return !this.isSystemMessage; // `sender` est requis uniquement si ce n'est pas un message système
    },
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
   // required: true
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
  isSystemMessage: { // Nouveau champ pour identifier les messages système
    type: Boolean,
    default: false,
  },

  systemData: {
    action: {
      type: String,
      enum: [
        'group_name_updated',    // Ajouté pour updateGroupName
        'group_photo_updated',   // Ajouté pour updateGroupPhoto
        'participant_added',     // Exemple d'autres actions possibles
        'participant_removed',   // Exemple d'autres actions possibles
      ],
      required: function () {
        return this.isSystemMessage; // `systemData.action` est requis pour les messages système
      },
    },
    actionBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.isSystemMessage; // `actionBy` est requis pour les messages système
      },
    },
    actionTarget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  groupName:{
    type:String,
    default: "Groupe sans nom"
  } ,
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
  }]
}, { 
  timestamps: true 
});

// Exportez les modèles
module.exports = {
  Message: mongoose.model('Message', MessageSchema),
  Conversation: mongoose.model('Conversation', ConversationSchema)
};