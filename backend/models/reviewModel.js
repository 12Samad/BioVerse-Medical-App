const mongoose = require("mongoose")

// Review Session Schema
const reviewSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["daily", "weekly", "monthly"],
            default: "daily",
        },
        stage: {
            type: Number,
            default: 1,
            min: 1,
            max: 3,
        },
        scheduledFor: {
            type: Date,
            required: true,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "missed"],
            default: "pending",
        },
        items: [
            {
                itemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                },
                itemType: {
                    type: String,
                    required: true,
                },
                difficulty: {
                    type: Number,
                    min: 1,
                    max: 5,
                    default: 3,
                },
                lastReviewed: {
                    type: Date,
                    default: null,
                },
            },
        ],
        performance: {
            correctAnswers: {
                type: Number,
                default: 0,
            },
            totalQuestions: {
                type: Number,
                default: 0,
            },
        },
    },
    { timestamps: true },
)

// User Review Preferences Schema
const reviewPreferencesSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        preferredTime: {
            type: String,
            default: "09:00",
        },
        preferredDays: {
            type: [String],
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            default: ["monday", "wednesday", "friday"],
        },
        maxReviewsPerDay: {
            type: Number,
            default: 10,
            min: 1,
            max: 50,
        },
        notificationsEnabled: {
            type: Boolean,
            default: true,
        },
        customIntervals: {
            type: Boolean,
            default: false,
        },
        intervals: {
            stage1: {
                type: Number,
                default: 24, // hours
                min: 1,
            },
            stage2: {
                type: Number,
                default: 7, // days
                min: 1,
            },
            stage3: {
                type: Number,
                default: 30, // days
                min: 1,
            },
        },
    },
    { timestamps: true },
)

// Review Completion Stats Schema
const reviewCompletionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        completedReviews: {
            type: Number,
            default: 0,
        },
        completionRate: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
)

// Create indexes for better query performance
reviewSessionSchema.index({ userId: 1, scheduledFor: 1 })
reviewSessionSchema.index({ userId: 1, status: 1 })
reviewPreferencesSchema.index({ userId: 1 })
reviewCompletionSchema.index({ userId: 1, date: 1 })

const ReviewSession = mongoose.model("ReviewSession", reviewSessionSchema)
const ReviewPreferences = mongoose.model("ReviewPreferences", reviewPreferencesSchema)
const ReviewCompletion = mongoose.model("ReviewCompletion", reviewCompletionSchema)

module.exports = {
    ReviewSession,
    ReviewPreferences,
    ReviewCompletion,
}

