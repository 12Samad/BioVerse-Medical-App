const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schemas
const StudyPlanWeeklyGoalSchema = new Schema({
    subject: { type: String, required: true },
    description: { type: String, required: true }
});

const StudyPlanResourceSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String },
    description: { type: String, required: true }
});

const StudyPlanTaskSchema = new Schema({
    subject: { type: String, required: true },
    duration: { type: Number, required: true },
    activity: { type: String, required: true },
    resources: [StudyPlanResourceSchema]
});

const StudyPlanDaySchema = new Schema({
    dayOfWeek: { type: String, required: true },
    focusAreas: [String],
    tasks: [StudyPlanTaskSchema]
});

const StudyPlanWeekSchema = new Schema({
    weekNumber: { type: Number, required: true },
    theme: { type: String, required: true },
    focusAreas: [String],
    weeklyGoals: [StudyPlanWeeklyGoalSchema],
    days: [StudyPlanDaySchema]
});

const StudyPlanBookSchema = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    relevantTopics: [String]
});

const StudyPlanVideoSchema = new Schema({
    title: { type: String, required: true },
    platform: { type: String, required: true },
    description: { type: String, required: true },
    relevantTopics: [String]
});

const StudyPlanQuestionBankSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    relevantTopics: [String]
});

const StudyPlanResourcesSchema = new Schema({
    books: [StudyPlanBookSchema],
    videos: [StudyPlanVideoSchema],
    questionBanks: [StudyPlanQuestionBankSchema]
});

const StudyPlanTipSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true }
});

const StudyPlanExamInfoSchema = new Schema({
    exam: { type: String, required: true },
    targetDate: { type: Date },
    targetScore: { type: String }
});

const StudyPlanDataSchema = new Schema({
    title: { type: String, required: true },
    overview: { type: String, required: true },
    examInfo: StudyPlanExamInfoSchema,
    weeklyPlans: [StudyPlanWeekSchema],
    resources: StudyPlanResourcesSchema,
    studyTips: [StudyPlanTipSchema]
});

const StudyPlanMetadataSchema = new Schema({
    generatedAt: { type: Date, required: true, default: Date.now },
    model: { type: String, required: true },
    examName: { type: String, required: true },
    duration: { type: String, required: true }
});

const UserDataSchema = new Schema({
    // Personal details
    name: { type: String, required: true },
    email: { type: String, required: true },
    currentLevel: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },

    // Exam details
    targetExam: { type: String, required: true },
    examDate: { type: Date },

    // Subject preferences
    strongSubjects: { type: [String], required: true },
    weakSubjects: { type: [String], required: true },

    // Study preferences
    availableHours: { type: Number, required: true, min: 1, max: 24 },
    daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    preferredTimeOfDay: {
        type: String,
        required: true,
        enum: ['morning', 'afternoon', 'evening', 'night', 'mixed']
    },
    preferredLearningStyle: {
        type: String,
        required: true,
        enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed']
    },

    // Goals and objectives
    targetScore: { type: String },
    specificGoals: { type: String },

    // Additional information
    additionalInfo: { type: String },
    previousScores: { type: String }
});

const WeeklyProgressSchema = new Schema({
    weekNumber: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedTasks: { type: Number, default: 0 },
    totalTasks: { type: Number, required: true }
});

const CompletionStatusSchema = new Schema({
    weeklyProgress: [WeeklyProgressSchema],
    overallProgress: { type: Number, default: 0, min: 0, max: 100 }
});

// Main Study Plan Schema
const StudyPlanSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userData: {
        type: UserDataSchema,
        required: true
    },
    plan: {
        type: StudyPlanDataSchema,
        required: true
    },
    metadata: {
        type: StudyPlanMetadataSchema,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastAccessed: {
        type: Date
    },
    completionStatus: CompletionStatusSchema
}, {
    timestamps: true
});

// Indexes for better query performance
StudyPlanSchema.index({ userId: 1, createdAt: -1 });
StudyPlanSchema.index({ 'userData.email': 1 });
StudyPlanSchema.index({ 'userData.targetExam': 1 });
StudyPlanSchema.index({ isActive: 1 });

// Virtual for calculating study duration in weeks
StudyPlanSchema.virtual('durationInWeeks').get(function () {
    return this.plan.weeklyPlans.length;
});

// Method to update completion status
StudyPlanSchema.methods.updateTaskCompletion = function (weekNumber, taskIndex, completed) {
    const weekProgress = this.completionStatus.weeklyProgress.find(
        (wp) => wp.weekNumber === weekNumber
    );

    if (weekProgress) {
        if (completed) {
            weekProgress.completedTasks += 1;
        } else {
            weekProgress.completedTasks = Math.max(0, weekProgress.completedTasks - 1);
        }

        weekProgress.completed = weekProgress.completedTasks === weekProgress.totalTasks;

        // Recalculate overall progress
        const totalTasks = this.completionStatus.weeklyProgress.reduce(
            (sum, week) => sum + week.totalTasks, 0
        );

        const completedTasks = this.completionStatus.weeklyProgress.reduce(
            (sum, week) => sum + week.completedTasks, 0
        );

        this.completionStatus.overallProgress = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;
    }

    return this;
};

// Initialize completion status when creating a new study plan
StudyPlanSchema.pre('save', function (next) {
    if (this.isNew && this.plan && this.plan.weeklyPlans) {
        if (!this.completionStatus) {
            this.completionStatus = {
                weeklyProgress: [],
                overallProgress: 0
            };
        }

        // Initialize weekly progress tracking
        this.completionStatus.weeklyProgress = this.plan.weeklyPlans.map(week => {
            const totalTasks = week.days?.reduce(
                (sum, day) => sum + (day.tasks?.length || 0), 0
            ) || 0;

            return {
                weekNumber: week.weekNumber,
                completed: false,
                completedTasks: 0,
                totalTasks
            };
        });
    }

    next();
});

// Create and export the model
const StudyPlan = mongoose.models.StudyPlan || mongoose.model('StudyPlan', StudyPlanSchema);

module.exports = StudyPlan;