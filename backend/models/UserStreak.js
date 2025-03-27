// models/UserStreak.js
const mongoose = require('mongoose');

// Check if the model already exists to prevent duplicate compilation
const UserStreakSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastTestDate: {
        type: Date,
        default: null
    },
    streakHistory: [{
        date: {
            type: Date,
            required: true
        },
        streak: {
            type: Number,
            required: true
        }
    }]
}, {
    timestamps: true
});


module.exports = mongoose.model('UserStreak', UserStreakSchema);