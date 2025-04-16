const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters'],
        trim: true,
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
        trim: true,
    },
    location: {
        type: String,
        maxlength: [200, 'Location cannot exceed 200 characters'],
        default: 'TBD',
        trim: true,
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
    },
    registrationDeadline: {
        type: Date,
        required: [true, 'Registration deadline is required'],
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1'],
    },
    reservedCount: {
        type: Number,
        default: 0,
        min: [0, 'Reserved count cannot be negative'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required'],
    },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);