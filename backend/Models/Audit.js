const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    action: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    target: { type: mongoose.Schema.Types.ObjectId },
    details: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditSchema);