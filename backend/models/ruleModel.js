const mongoose = require("mongoose")

const ruleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Rule name is required"],
            trim: true,
            unique: true,
            minlength: [2, "Rule name must be at least 2 characters long"],
            maxlength: [50, "Rule name cannot exceed 50 characters"],
        },
        description: {
            type: String,
            required: [true, "Rule description is required"],
            trim: true,
            minlength: [5, "Description must be at least 5 characters long"],
            maxlength: [200, "Description cannot exceed 200 characters"],
        },
        trigger: {
            type: String,
            required: [true, "Trigger event is required"],
            enum: ["quiz_completion", "leaderboard_update", "streak_update", "score_threshold", "time_threshold"],
        },
        condition: {
            type: String,
            required: [true, "Condition is required"],
            trim: true,
        },
        action: {
            type: String,
            required: [true, "Action is required"],
            enum: ["award_badge", "add_points", "send_notification", "unlock_content"],
        },
        actionValue: {
            type: String,
            required: [true, "Action value is required"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        }
    },
    { timestamps: true },
)

const Rule = mongoose.model("Rule", ruleSchema)

module.exports = Rule