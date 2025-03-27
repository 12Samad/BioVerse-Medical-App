// models/ChallengeSession.js
const mongoose = require('mongoose');

/**
 * Schema for tracking challenge sessions where users practice difficult questions
 */
const ChallengeSessionSchema = new mongoose.Schema({
    // User who attempted the challenge
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Date when the challenge was started
    date: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Challenge session status
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'abandoned'],
        default: 'in_progress'
    },

    // Questions included in this challenge session
    questions: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        userAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number // in seconds
    }],

    // Performance metrics
    metrics: {
        totalQuestions: {
            type: Number,
            default: 0
        },
        correctAnswers: {
            type: Number,
            default: 0
        },
        incorrectAnswers: {
            type: Number,
            default: 0
        },
        totalTimeSpent: {
            type: Number,
            default: 0
        },
        averageTimePerQuestion: Number,
        score: Number // percentage
    },

    // Additional metadata
    metadata: {
        specialties: [String],
        topics: [String],
        difficultyLevel: {
            type: String,
            default: 'hard'
        },
        questionCount: {
            type: Number,
            default: 10
        }
    }
}, {
    timestamps: true
});


// Pre-save hook to calculate metrics before saving
ChallengeSessionSchema.pre('save', function (next) {
    if (this.isModified('questions') || this.isModified('status')) {
        // Update metrics
        const answered = this.questions.filter(q => q.userAnswer);
        const correct = this.questions.filter(q => q.isCorrect);

        this.metrics.totalQuestions = this.questions.length;
        this.metrics.correctAnswers = correct.length;
        this.metrics.incorrectAnswers = answered.length - correct.length;

        // Calculate time metrics
        const totalTimeSpent = this.questions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
        this.metrics.totalTimeSpent = totalTimeSpent;

        if (answered.length > 0) {
            this.metrics.averageTimePerQuestion = totalTimeSpent / answered.length;
        }

        // Calculate score as percentage
        if (answered.length > 0) {
            this.metrics.score = (correct.length / answered.length) * 100;
        } else {
            this.metrics.score = 0;
        }
    }
    next();
});

module.exports = mongoose.model('ChallengeSession', ChallengeSessionSchema);