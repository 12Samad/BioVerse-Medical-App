const mongoose = require("mongoose");

const questSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, "User ID is required"],
            index: true,
            ref: "User" // Add reference to User model for easier population
        },
        studyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Study",
            index: true,
            // Optional if you want to associate quests with specific studies
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [2, "Title must be at least 2 characters long"],
            maxlength: [100, "Title must be less than 100 characters"],
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            minlength: [2, "Subject must be at least 2 characters long"],
            maxlength: [100, "Subject must be less than 100 characters"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            minlength: [10, "Description must be at least 10 characters long"],
            maxlength: [1000, "Description must be less than 1000 characters"],
        },
        category: {
            type: String,
            enum: ["medication", "exercise", "diet", "monitoring", "assessment", "other"],
            default: "other",
            index: true
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
            index: true
        },
        targetHours: {
            type: Number,
            required: [true, "Target hours is required"],
            min: [0.25, "Target hours must be at least 15 minutes"],
            max: [168, "Target hours cannot exceed one week (168 hours)"],
        },
        completedHours: {
            type: Number,
            default: 0,
            min: [0, "Completed hours cannot be negative"],
            max: [168, "Completed hours cannot exceed one week (168 hours)"]
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        dueDate: {
            type: Date,
            required: [true, "Due date is required"],
            validate: {
                validator: function (value) {
                    return value > this.startDate;
                },
                message: "Due date must be after start date",
            },
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "overdue", "canceled"],
            default: "pending",
            index: true
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        completedAt: {
            type: Date,
            default: null
        },
        reminderSettings: {
            enabled: {
                type: Boolean,
                default: true
            },
            frequency: {
                type: String,
                enum: ["daily", "every_other_day", "weekly", "custom"],
                default: "daily"
            },
            customHours: [Number],
            lastSent: Date
        },
        attachments: [{
            type: {
                type: String,
                enum: ["image", "document", "video", "audio", "other"],
                required: true
            },
            url: String,
            name: String,
            size: Number,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        notes: [{
            content: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: Date
        }],
        metadata: {
            // For any additional study-specific data
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        tags: [{
            type: String,
            trim: true
        }]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtuals
questSchema.virtual('timeRemaining').get(function () {
    if (this.isCompleted) return 0;

    const now = new Date();
    const due = new Date(this.dueDate);
    return Math.max(0, Math.floor((due - now) / (1000 * 60 * 60))); // Hours remaining
});

questSchema.virtual('isOverdue').get(function () {
    if (this.isCompleted) return false;
    return new Date() > new Date(this.dueDate);
});

// Compound indexes for better query performance
questSchema.index({ userId: 1, status: 1, createdAt: -1 });
questSchema.index({ userId: 1, category: 1 });
questSchema.index({ dueDate: 1, status: 1 });

// Function to calculate elapsed hours since creation and update progress
questSchema.methods.updateProgress = function () {
    const now = new Date();
    const startDate = new Date(this.startDate);
    const elapsedHours = Math.max(0, (now - startDate) / (1000 * 60 * 60)); // Convert ms to hours

    if (!this.isCompleted) {
        this.completedHours = Math.min(elapsedHours, this.targetHours); // Cap at targetHours
        this.progress = Math.round((this.completedHours / this.targetHours) * 100);

        if (this.completedHours >= this.targetHours) {
            this.isCompleted = true;
            this.status = "completed";
            this.completedAt = now;
        } else if (now > this.dueDate) {
            this.status = "overdue";
        } else if (this.status === "pending" && this.completedHours > 0) {
            this.status = "in_progress";
        }
    }

    return this;
};

// Method to add a note to the quest
questSchema.methods.addNote = function (content) {
    this.notes.push({
        content,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return this;
};

// Method to add an attachment
questSchema.methods.addAttachment = function (attachmentData) {
    this.attachments.push({
        ...attachmentData,
        uploadedAt: new Date()
    });
    return this;
};

// Method to manually complete a quest
questSchema.methods.markAsCompleted = function (completedHours = null) {
    const now = new Date();
    this.isCompleted = true;
    this.status = "completed";
    this.completedAt = now;

    if (completedHours !== null) {
        this.completedHours = Math.min(completedHours, this.targetHours);
    } else {
        this.completedHours = this.targetHours;
    }

    this.progress = 100;
    return this;
};

// Middleware to auto-update when fetching the document
questSchema.pre("findOne", function () {
    this.populate("userId", "name email"); // Auto-populate user info
});

questSchema.pre("findOneAndUpdate", function (next) {
    this.getQuery().updatedAt = new Date(); // Trigger update timestamp
    next();
});

// Middleware to update progress on save
questSchema.pre("save", function (next) {
    this.updateProgress();
    next();
});

// Static method to find all overdue quests
questSchema.statics.findOverdue = function (userId = null) {
    const query = {
        dueDate: { $lt: new Date() },
        isCompleted: false
    };

    if (userId) {
        query.userId = userId;
    }

    return this.find(query).sort({ dueDate: 1 });
};

// Static method to get summary statistics
questSchema.statics.getStats = async function (userId) {
    return this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalTargetHours: { $sum: "$targetHours" },
                totalCompletedHours: { $sum: "$completedHours" }
            }
        },
        {
            $project: {
                status: "$_id",
                count: 1,
                totalTargetHours: 1,
                totalCompletedHours: 1,
                completionRate: {
                    $multiply: [
                        { $divide: ["$totalCompletedHours", "$totalTargetHours"] },
                        100
                    ]
                }
            }
        }
    ]);
};

const Quest = mongoose.model("Quest", questSchema);
module.exports = { Quest };