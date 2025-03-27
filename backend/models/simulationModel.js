// models/SimulationHistory.js
const mongoose = require('mongoose');

const SimulationHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    examName: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    questionsAnswered: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    timeSpent: {
        type: Number, // In seconds
        required: true
    },
    // Optional detailed data
    questions: [{
        questionId: String,
        question: String,
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        subject: String,
        difficulty: String
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Method to format the time spent for display
SimulationHistorySchema.methods.formatTimeSpent = function () {
    const mins = Math.floor(this.timeSpent / 60);
    const secs = this.timeSpent % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Create a stats virtual property for frontend display
SimulationHistorySchema.virtual('stats').get(function () {
    if (!this.questions || this.questions.length === 0) {
        return null;
    }

    // Group questions by subject
    const subjectPerformance = {};
    this.questions.forEach(q => {
        if (!subjectPerformance[q.subject]) {
            subjectPerformance[q.subject] = {
                total: 0,
                correct: 0
            };
        }

        subjectPerformance[q.subject].total++;
        if (q.isCorrect) {
            subjectPerformance[q.subject].correct++;
        }
    });

    // Calculate percentages
    Object.keys(subjectPerformance).forEach(subject => {
        const { total, correct } = subjectPerformance[subject];
        subjectPerformance[subject].percentage = Math.round((correct / total) * 100);
    });

    return {
        subjectPerformance,
        strengths: Object.keys(subjectPerformance)
            .filter(subject => subjectPerformance[subject].percentage >= 70)
            .sort((a, b) => subjectPerformance[b].percentage - subjectPerformance[a].percentage),
        weaknesses: Object.keys(subjectPerformance)
            .filter(subject => subjectPerformance[subject].percentage < 70)
            .sort((a, b) => subjectPerformance[a].percentage - subjectPerformance[b].percentage)
    };
});

module.exports = mongoose.model('SimulationHistory', SimulationHistorySchema);