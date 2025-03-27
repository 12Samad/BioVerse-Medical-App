const mongoose = require("mongoose")

const badgeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Badge name is required"],
            trim: true,
            unique: true,
            minlength: [2, "Badge name must be at least 2 characters long"],
            maxlength: [50, "Badge name cannot exceed 50 characters"],
        },
        description: {
            type: String,
            required: [true, "Badge description is required"],
            trim: true,
            minlength: [5, "Description must be at least 5 characters long"],
            maxlength: [200, "Description cannot exceed 200 characters"],
        },
        icon: {
            type: String,
            required: [true, "Badge icon is required"],
        },
        criteria: {
            type: String,
            required: [true, "Badge criteria is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: ["achievement", "rank", "special", "improvement"],
            default: "achievement",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        representation: {
            type: String,
        },
    },
    { timestamps: true },
)

const Badge = mongoose.model("Badge", badgeSchema)

module.exports = Badge

