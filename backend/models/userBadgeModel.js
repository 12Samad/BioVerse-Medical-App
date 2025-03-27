const mongoose = require("mongoose")

const userBadgeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true,
        },
        badgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Badge",
            required: [true, "Badge ID is required"],
        },
        awardedAt: {
            type: Date,
            default: Date.now,
        },
        awardedBy: {
            type: String,
            enum: ["system", "admin"],
            default: "system",
        },
        awardReason: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
)

// Compound index to ensure a user can only have a badge once
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true })

const UserBadge = mongoose.model("UserBadge", userBadgeSchema)

module.exports = UserBadge