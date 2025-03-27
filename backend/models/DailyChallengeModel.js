const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        questions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Question",
                required: true,
            },
        ],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        answers: {
            type: [String],
            default: [],
        },
        score: {
            type: Number,
            default: 0,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        isGlobal: {
            type: Boolean,
            default: false,
            description: "If true, this is the global challenge for all users. If false, this is a user's submission.",
        },
    },
    {
        timestamps: true,
    },
);

const DailyChallenge = mongoose.model("DailyChallenge", dailyChallengeSchema);

module.exports = DailyChallenge;