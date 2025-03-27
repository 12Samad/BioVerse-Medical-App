const router = require("express").Router()
const { ReviewSession, ReviewPreferences, ReviewCompletion } = require("../models/reviewModel")
const mongoose = require("mongoose")
const Question = require('../models/questionModel');
const { v4: uuidv4 } = require('uuid');


// Spaced repetition algorithm based on Ebbinghaus forgetting curve
const calculateNextReviewDate = async (userId, stage, difficulty = 3, customIntervals = null) => {
    try {
        // Get user preferences or use default intervals
        let intervals = { stage1: 24, stage2: 7, stage3: 30 }

        if (customIntervals) {
            intervals = customIntervals
        } else {
            const userPrefs = await ReviewPreferences.findOne({ userId })
            if (userPrefs && userPrefs.customIntervals) {
                intervals = userPrefs.intervals
            }
        }

        const now = new Date()
        const nextDate = new Date()

        // Apply difficulty modifier (1-5 scale)
        // Higher difficulty = shorter intervals
        const difficultyModifier = 1 - (difficulty - 1) * 0.1 // 0.6 to 1.0

        switch (stage) {
            case 1:
                // Stage 1: hours (default 24 hours)
                nextDate.setHours(now.getHours() + intervals.stage1 * difficultyModifier)
                break
            case 2:
                // Stage 2: days (default 7 days)
                nextDate.setDate(now.getDate() + intervals.stage2 * difficultyModifier)
                break
            case 3:
                // Stage 3: days (default 30 days)
                nextDate.setDate(now.getDate() + intervals.stage3 * difficultyModifier)
                break
            default:
                // Default to 24 hours
                nextDate.setHours(now.getHours() + 24)
        }

        return nextDate
    } catch (error) {
        console.error("Error calculating next review date:", error)
        // Default fallback
        const nextDate = new Date()
        nextDate.setHours(nextDate.getHours() + 24)
        return nextDate
    }
}

// Get dashboard data
router.get("/dashboard", async (req, res) => {
    try {
        const userId = req.query.userId

        // Get completion rate
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)

        const completionStats = await ReviewCompletion.findOne({
            userId,
            date: { $gte: lastWeek },
        }).sort({ date: -1 })

        // Get total and completed reviews
        const totalReviews = await ReviewSession.countDocuments({ userId })
        const completedReviews = await ReviewSession.countDocuments({
            userId,
            status: "completed",
        })

        // Get upcoming reviews
        const upcomingReviews = await ReviewSession.find({
            userId,
            status: "pending",
            scheduledFor: { $gte: new Date() },
        })
            .sort({ scheduledFor: 1 })
            .limit(5)

        res.status(200).json({
            completionRate: completionStats ? completionStats.completionRate : 0,
            totalReviews,
            completedReviews,
            upcomingReviews,
        })
    } catch (error) {
        console.error("Error fetching dashboard data:", error)
        res.status(500).json({ message: "Failed to fetch dashboard data" })
    }
})

// Get user preferences
router.get("/preferences", async (req, res) => {
    try {
        const userId = req.query.userId

        let preferences = await ReviewPreferences.findOne({ userId })

        if (!preferences) {
            // Create default preferences if not found
            preferences = await ReviewPreferences.create({ userId })
        }

        res.status(200).json(preferences)
    } catch (error) {
        console.error("Error fetching preferences:", error)
        res.status(500).json({ message: "Failed to fetch preferences" })
    }
})

// Update user preferences
router.post("/preferences", async (req, res) => {
    try {
        const userId = req.query.userId
        const updates = req.body

        const preferences = await ReviewPreferences.findOneAndUpdate({ userId }, updates, { new: true, upsert: true })

        res.status(200).json(preferences)
    } catch (error) {
        console.error("Error updating preferences:", error)
        res.status(500).json({ message: "Failed to update preferences" })
    }
})

// Start a review session
router.post("/start-session", async (req, res) => {
    try {
        const userId = req.query.userId

        // Find items that need review
        // This would typically come from your medical content database
        // For this example, we'll create a placeholder session

        const session = await ReviewSession.create({
            userId,
            title: "Medical Review Session",
            type: "daily",
            stage: 1,
            scheduledFor: new Date(),
            items: [
                // Sample items - in a real app, these would be fetched from your content database
                { itemId: new mongoose.Types.ObjectId(), itemType: "flashcard", difficulty: 3 },
                { itemId: new mongoose.Types.ObjectId(), itemType: "question", difficulty: 2 },
                { itemId: new mongoose.Types.ObjectId(), itemType: "case_study", difficulty: 4 },
            ],
            performance: {
                totalQuestions: 3,
                correctAnswers: 0,
            },
        })

        res.status(201).json({
            message: "Review session created",
            sessionId: session._id,
        })
    } catch (error) {
        console.error("Error starting review session:", error)
        res.status(500).json({ message: "Failed to start review session" })
    }
})

// Complete a review session
router.post("/:sessionId/complete", async (req, res) => {
    try {
        const { sessionId } = req.params
        const { performance } = req.body
        const userId = req.query.userId

        // Update session status
        const session = await ReviewSession.findOneAndUpdate(
            { _id: sessionId, userId },
            {
                status: "completed",
                completedAt: new Date(),
                performance,
            },
            { new: true },
        )

        if (!session) {
            return res.status(404).json({ message: "Session not found" })
        }

        // Schedule next review based on performance
        const correctRate = performance.correctAnswers / performance.totalQuestions
        let nextStage = session.stage

        // Progress to next stage if performance is good
        if (correctRate >= 0.8) {
            nextStage = Math.min(session.stage + 1, 3)
        }
        // Stay at same stage if performance is average
        else if (correctRate >= 0.6) {
            nextStage = session.stage
        }
        // Go back a stage if performance is poor
        else {
            nextStage = Math.max(session.stage - 1, 1)
        }

        // Calculate difficulty based on performance
        const avgDifficulty = session.items.reduce((sum, item) => sum + item.difficulty, 0) / session.items.length
        const adjustedDifficulty = avgDifficulty * (1 - correctRate + 0.5) // Higher difficulty for lower performance

        // Schedule next review
        const nextReviewDate = await calculateNextReviewDate(userId, nextStage, adjustedDifficulty)

        // Create next review session
        await ReviewSession.create({
            userId,
            title: `Medical Review Session - Stage ${nextStage}`,
            type: nextStage === 1 ? "daily" : nextStage === 2 ? "weekly" : "monthly",
            stage: nextStage,
            scheduledFor: nextReviewDate,
            items: session.items.map((item) => ({
                ...item,
                lastReviewed: new Date(),
            })),
        })

        // Update completion stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let completionStats = await ReviewCompletion.findOne({
            userId,
            date: today,
        })

        if (!completionStats) {
            completionStats = new ReviewCompletion({
                userId,
                date: today,
                totalReviews: 1,
                completedReviews: 1,
                completionRate: 100,
            })
        } else {
            completionStats.totalReviews += 1
            completionStats.completedReviews += 1
            completionStats.completionRate = (completionStats.completedReviews / completionStats.totalReviews) * 100
        }

        await completionStats.save()

        res.status(200).json({
            message: "Review session completed",
            nextReview: nextReviewDate,
        })
    } catch (error) {
        console.error("Error completing review session:", error)
        res.status(500).json({ message: "Failed to complete review session" })
    }
})

// Reschedule a review session
router.post("/:reviewId/reschedule", async (req, res) => {
    try {
        const { reviewId } = req.params
        const { scheduledFor } = req.body
        const userId = req.query.userId

        const review = await ReviewSession.findOneAndUpdate(
            { _id: reviewId, userId },
            { scheduledFor: new Date(scheduledFor) },
            { new: true },
        )

        if (!review) {
            return res.status(404).json({ message: "Review not found" })
        }

        res.status(200).json({
            message: "Review rescheduled",
            review,
        })
    } catch (error) {
        console.error("Error rescheduling review:", error)
        res.status(500).json({ message: "Failed to reschedule review" })
    }
})

// Get completion stats for charts
router.get("/completion-stats", async (req, res) => {
    try {
        const userId = req.query.userId

        // Get daily stats for the last 7 days
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 6)

        const dailyStats = await ReviewCompletion.find({
            userId,
            date: { $gte: lastWeek, $lte: today },
        }).sort({ date: 1 })

        // Fill in missing days
        const dailyData = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(lastWeek)
            date.setDate(date.getDate() + i)

            const existingStat = dailyStats.find((stat) => stat.date.toDateString() === date.toDateString())

            dailyData.push({
                label: date.toLocaleDateString("en-US", { weekday: "short" }),
                completionRate: existingStat ? existingStat.completionRate : 0,
                date: date.toISOString().split("T")[0],
            })
        }

        // Get weekly stats for the last 4 weeks
        const fourWeeksAgo = new Date(today)
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

        const weeklyData = []
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(fourWeeksAgo)
            weekStart.setDate(weekStart.getDate() + i * 7)

            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)

            const weekStats = await ReviewCompletion.find({
                userId,
                date: { $gte: weekStart, $lte: weekEnd },
            })

            const totalCompletionRate = weekStats.reduce((sum, stat) => sum + stat.completionRate, 0)
            const avgCompletionRate = weekStats.length > 0 ? totalCompletionRate / weekStats.length : 0

            weeklyData.push({
                label: `Week ${i + 1}`,
                completionRate: Math.round(avgCompletionRate),
                date: weekStart.toISOString().split("T")[0],
            })
        }

        // Get monthly stats for the last 6 months
        const sixMonthsAgo = new Date(today)
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)

        const monthlyData = []
        for (let i = 0; i < 6; i++) {
            const monthStart = new Date(sixMonthsAgo)
            monthStart.setMonth(monthStart.getMonth() + i)
            monthStart.setDate(1)

            const monthEnd = new Date(monthStart)
            monthEnd.setMonth(monthEnd.getMonth() + 1)
            monthEnd.setDate(0)

            const monthStats = await ReviewCompletion.find({
                userId,
                date: { $gte: monthStart, $lte: monthEnd },
            })

            const totalCompletionRate = monthStats.reduce((sum, stat) => sum + stat.completionRate, 0)
            const avgCompletionRate = monthStats.length > 0 ? totalCompletionRate / monthStats.length : 0

            monthlyData.push({
                label: monthStart.toLocaleDateString("en-US", { month: "short" }),
                completionRate: Math.round(avgCompletionRate),
                date: monthStart.toISOString().split("T")[0],
            })
        }

        res.status(200).json({
            daily: dailyData,
            weekly: weeklyData,
            monthly: monthlyData,
        })
    } catch (error) {
        console.error("Error fetching completion stats:", error)
        res.status(500).json({ message: "Failed to fetch completion stats" })
    }
})


router.get('/random', async (req, res) => {
    try {
        // Only filter out "Unknown" specialties
        const matchCriteria = {
            specialty: { $ne: "Unknown" }
        };

        // Use aggregation with $sample to get 10 random documents
        const randomQuestions = await Question.aggregate([
            // Apply minimal filter
            { $match: matchCriteria },
            // Get random selection
            { $sample: { size: 10 } }
        ]);

        // If no questions found, return an appropriate message
        if (randomQuestions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No questions found'
            });
        }

        // Transform questions into the expected format
        const sessionItems = randomQuestions.map(question => {
            // Determine item type based on question_type field
            let itemType = "question"; // Default

            if (question.question_type === "case_based") {
                itemType = "case_study";
            } else if (question.question.length < 100) {
                // Short questions can be treated as flashcards
                itemType = "flashcard";
            }

            return {
                _id: question._id.toString(),
                itemType,
                question: question.question,
                answer: question.answer,
                options: question.options,
                // Include additional fields that might be useful
                explanation: question.explanation,
                difficulty: question.difficulty,
                specialty: question.specialty,
                topic: question.topic
            };
        });

        // Prepare the response object in the requested format
        const mockSession = {
            _id: uuidv4(), // Generate a unique session ID
            title: "Medical Review Session",
            type: "daily",
            stage: 1,
            items: sessionItems,
            performance: {
                totalQuestions: sessionItems.length,
                correctAnswers: 0, // Initially 0 since the user hasn't answered yet
            }
        };

        res.json(mockSession);

    } catch (error) {
        console.error('Error creating random session:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while creating random session'
        });
    }
});


module.exports = router