const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event is required'],
    },
    reservedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Prevent duplicate reservations.js
reservationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Reservation', reservationSchema);