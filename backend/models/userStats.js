// models/UserStats.js
const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
    },
    role: {
        type: String,
        default: 'user',
    },
    avatarUrl: {
        type: String,
        default: '/placeholder.svg?height=40&width=40',
    },
    engagement: {
        activityFrequency: [Number],
        timeSpent: [Number],
        lastActive: {
            type: Date,
            default: Date.now,
        },
        totalSessions: {
            type: Number,
            default: 0,
        },
        averageSessionTime: {
            type: Number,
            default: 0,
        },
        weeklyGrowth: {
            type: Number,
            default: 0,
        },
        monthlyActivity: [Number],
        completionRate: {
            type: Number,
            default: 0,
        },
        streakDays: {
            type: Number,
            default: 0,
        },
    },
    progress: {
        courseCompletion: {
            type: Number,
            default: 0,
        },
        assignmentScores: [Number],
        quizScores: [Number],
        totalQuestions: {
            type: Number,
            default: 0,
        },
        correctAnswers: {
            type: Number,
            default: 0,
        },
        improvementRate: {
            type: Number,
            default: 0,
        },
        weakestTopics: [String],
        strongestTopics: [String],
        recentImprovement: {
            type: Number,
            default: 0,
        },
    },
    subscription: {
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'inactive',
        },
        plan: {
            type: String,
            default: 'Free',
        },
        renewalDate: Date,
        startDate: Date,
        planLimit: {
            type: Number,
            default: 0,
        },
        usage: {
            type: Number,
            default: 0,
        },
        previousPlans: [String],
        lifetimeValue: {
            type: Number,
            default: 0,
        },
        discountEligible: {
            type: Boolean,
            default: false,
        },
        referrals: {
            type: Number,
            default: 0,
        },
    },
    quests: {
        total: {
            type: Number,
            default: 0,
        },
        completed: {
            type: Number,
            default: 0,
        },
        inProgress: {
            type: Number,
            default: 0,
        },
        overdue: {
            type: Number,
            default: 0,
        },
        byPriority: {
            low: {
                type: Number,
                default: 0,
            },
            medium: {
                type: Number,
                default: 0,
            },
            high: {
                type: Number,
                default: 0,
            },
            urgent: {
                type: Number,
                default: 0,
            },
        },
        byCategory: {
            medication: {
                type: Number,
                default: 0,
            },
            exercise: {
                type: Number,
                default: 0,
            },
            diet: {
                type: Number,
                default: 0,
            },
            monitoring: {
                type: Number,
                default: 0,
            },
            assessment: {
                type: Number,
                default: 0,
            },
        },
        completionTrend: [Number],
    },
}, { timestamps: true });

const UserStats = mongoose.model('UserStats', userStatsSchema);

module.exports = UserStats;
