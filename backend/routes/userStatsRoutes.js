const express = require("express")
const User = require('../models/User');
const TestData = require('../models/testdata');
const Leaderboard = require('../models/leaderboard');
const Subscription = require('../models/Subscription');
const UserStats = require('../models/userStats');

const router = express.Router();

// Helper function to calculate activity frequency
const calculateActivityFrequency = async (userId) => {
    // Get last 7 days of test data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const testData = await TestData.find({
        userId,
        createdAt: { $gte: sevenDaysAgo }
    });

    // Group by day and count activities
    const activityByDay = Array(7).fill(0);
    testData.forEach(test => {
        const dayIndex = 6 - Math.floor((new Date() - test.createdAt) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
            activityByDay[dayIndex]++;
        }
    });

    return activityByDay;
};

// Helper function to calculate time spent
const calculateTimeSpent = async (userId) => {
    // Get last 7 days of test data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const testData = await TestData.find({
        userId,
        createdAt: { $gte: sevenDaysAgo }
    });

    // Group by day and sum time spent
    const timeByDay = Array(7).fill(0);
    testData.forEach(test => {
        const dayIndex = 6 - Math.floor((new Date() - test.createdAt) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
            timeByDay[dayIndex] += test.totalTime;
        }
    });

    return timeByDay;
};

router.get("/users", async (req, res) => {
    try {
        // Find all users with role not equal to "admin"
        const users = await User.find({ role: { $ne: "admin" } })
            .select("_id name email isVerified role")
            .sort({ name: 1 })

        return res.status(200).json({
            success: true,
            data: users,
            count: users.length,
        })
    } catch (error) {
        console.error("Error fetching users:", error)
        return res.status(500).json({
            success: false,
            message: "Error retrieving users",
            error: error.message,
        })
    }
})

// Get user stats
router.get("/getUserStats/:userId/stats", async (req, res) => {
    try {
        const { userId } = req.params;

        // Find existing stats or create new one
        let userStats = await UserStats.findOne({ userId });

        if (!userStats) {
            // If no stats exist, collect data and create new stats
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Collect data from different models
            const subscription = await Subscription.findOne({ userId });
            const leaderboard = await Leaderboard.findOne({ userId });
            const testData = await TestData.find({ userId });

            // Calculate activity frequency and time spent
            const activityFrequency = await calculateActivityFrequency(userId);
            const timeSpent = await calculateTimeSpent(userId);

            // Calculate test scores
            const quizScores = testData.map(test => test.percentage);
            const totalQuestions = testData.reduce((sum, test) => sum + test.questions.length, 0);
            const correctAnswers = testData.reduce((sum, test) => {
                return sum + test.questions.filter(q => q.userAnswer === q.correctAnswer).length;
            }, 0);

            // Create initial user stats
            userStats = new UserStats({
                userId,
                name: user.name,
                email: user.email,
                status: 'active',
                role: user.role,
                avatarUrl: '/placeholder.svg?height=40&width=40',
                engagement: {
                    activityFrequency,
                    timeSpent,
                    lastActive: new Date(),
                    totalSessions: testData.length,
                    averageSessionTime: testData.length > 0
                        ? testData.reduce((sum, test) => sum + test.totalTime, 0) / testData.length
                        : 0,
                    weeklyGrowth: 0, // Calculate based on historical data
                    monthlyActivity: [0, 0, 0, 0], // Placeholder
                    completionRate: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
                    streakDays: 0, // Calculate based on consecutive days of activity
                },
                progress: {
                    courseCompletion: 0, // Placeholder
                    assignmentScores: [], // Placeholder
                    quizScores,
                    totalQuestions,
                    correctAnswers,
                    improvementRate: 0, // Calculate based on historical data
                    weakestTopics: [], // Analyze from test data
                    strongestTopics: [], // Analyze from test data
                    recentImprovement: 0, // Calculate based on recent scores
                },
                subscription: subscription ? {
                    status: subscription.subscriptionStatus,
                    plan: subscription.planName || 'Free',
                    renewalDate: subscription.endDate,
                    startDate: subscription.startDate,
                    planLimit: subscription.planLimit,
                    usage: subscription.generatedVideos,
                    previousPlans: [], // Historical data
                    lifetimeValue: 0, // Calculate based on payment history
                    discountEligible: false,
                    referrals: 0,
                } : {
                    status: 'inactive',
                    plan: 'Free',
                    renewalDate: null,
                    startDate: null,
                    planLimit: 0,
                    usage: 0,
                    previousPlans: [],
                    lifetimeValue: 0,
                    discountEligible: false,
                    referrals: 0,
                },
                quests: {
                    total: 0,
                    completed: 0,
                    inProgress: 0,
                    overdue: 0,
                    byPriority: {
                        low: 0,
                        medium: 0,
                        high: 0,
                        urgent: 0,
                    },
                    byCategory: {
                        medication: 0,
                        exercise: 0,
                        diet: 0,
                        monitoring: 0,
                        assessment: 0,
                    },
                    completionTrend: [0, 0, 0, 0],
                },
            });

            await userStats.save();
        }

        // Format the response to match the example structure
        const formattedStats = {
            id: userStats.userId,
            name: userStats.name,
            email: userStats.email,
            status: userStats.status,
            role: userStats.role,
            avatarUrl: userStats.avatarUrl,
            engagement: {
                activityFrequency: userStats.engagement.activityFrequency,
                timeSpent: userStats.engagement.timeSpent,
                lastActive: userStats.engagement.lastActive,
                totalSessions: userStats.engagement.totalSessions,
                averageSessionTime: userStats.engagement.averageSessionTime,
                weeklyGrowth: userStats.engagement.weeklyGrowth,
                monthlyActivity: userStats.engagement.monthlyActivity,
                completionRate: userStats.engagement.completionRate,
                streakDays: userStats.engagement.streakDays
            },
            progress: {
                courseCompletion: userStats.progress.courseCompletion,
                assignmentScores: userStats.progress.assignmentScores,
                quizScores: userStats.progress.quizScores,
                totalQuestions: userStats.progress.totalQuestions,
                correctAnswers: userStats.progress.correctAnswers,
                improvementRate: userStats.progress.improvementRate,
                weakestTopics: userStats.progress.weakestTopics,
                strongestTopics: userStats.progress.strongestTopics,
                recentImprovement: userStats.progress.recentImprovement
            },
            subscription: {
                status: userStats.subscription.status,
                plan: userStats.subscription.plan,
                renewalDate: userStats.subscription.renewalDate,
                startDate: userStats.subscription.startDate,
                planLimit: userStats.subscription.planLimit,
                usage: userStats.subscription.usage,
                previousPlans: userStats.subscription.previousPlans,
                lifetimeValue: userStats.subscription.lifetimeValue,
                discountEligible: userStats.subscription.discountEligible,
                referrals: userStats.subscription.referrals
            },
            quests: {
                total: userStats.quests.total,
                completed: userStats.quests.completed,
                inProgress: userStats.quests.inProgress,
                overdue: userStats.quests.overdue,
                byPriority: {
                    low: userStats.quests.byPriority.low,
                    medium: userStats.quests.byPriority.medium,
                    high: userStats.quests.byPriority.high,
                    urgent: userStats.quests.byPriority.urgent
                },
                byCategory: {
                    medication: userStats.quests.byCategory.medication,
                    exercise: userStats.quests.byCategory.exercise,
                    diet: userStats.quests.byCategory.diet,
                    monitoring: userStats.quests.byCategory.monitoring,
                    assessment: userStats.quests.byCategory.assessment
                },
                completionTrend: userStats.quests.completionTrend
            }
        };

        return res.status(200).json({ success: true, data: formattedStats });
    } catch (error) {
        console.error('Error getting user stats:', error);
        return res.status(500).json({ success: false, message: 'Error retrieving user stats', error: error.message });
    }
})

// Update user stats
router.patch("/updateUserStats/:userId/stats", async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Find existing stats
        let userStats = await UserStats.findOne({ userId });

        if (!userStats) {
            return res.status(404).json({ success: false, message: 'User stats not found' });
        }

        // Update the fields based on received data
        if (updateData.engagement) {
            Object.assign(userStats.engagement, updateData.engagement);
        }

        if (updateData.progress) {
            Object.assign(userStats.progress, updateData.progress);
        }

        if (updateData.subscription) {
            Object.assign(userStats.subscription, updateData.subscription);
        }

        if (updateData.quests) {
            Object.assign(userStats.quests, updateData.quests);
        }

        await userStats.save();

        return res.status(200).json({ success: true, message: 'User stats updated successfully' });
    } catch (error) {
        console.error('Error updating user stats:', error);
        return res.status(500).json({ success: false, message: 'Error updating user stats', error: error.message });
    }
})

// Record a new test completion and update stats
router.patch("/recordTestCompletion/:userId/tests/:testId/completion", async (req, res) => {
    try {
        const { userId, testId } = req.params;

        // Find the test data
        const testData = await TestData.findById(testId);
        if (!testData || testData.userId !== userId) {
            return res.status(404).json({ success: false, message: 'Test data not found' });
        }

        // Find user stats
        let userStats = await UserStats.findOne({ userId });
        if (!userStats) {
            return res.status(404).json({ success: false, message: 'User stats not found' });
        }

        // Update engagement stats
        userStats.engagement.lastActive = new Date();
        userStats.engagement.totalSessions += 1;

        // Calculate new average session time
        const totalTime = (userStats.engagement.averageSessionTime * (userStats.engagement.totalSessions - 1) + testData.totalTime) / userStats.engagement.totalSessions;
        userStats.engagement.averageSessionTime = Math.round(totalTime);

        // Update activity frequency for today
        const today = new Date().getDay();
        if (!userStats.engagement.activityFrequency) {
            userStats.engagement.activityFrequency = Array(7).fill(0);
        }
        userStats.engagement.activityFrequency[today] += 1;

        // Update time spent for today
        if (!userStats.engagement.timeSpent) {
            userStats.engagement.timeSpent = Array(7).fill(0);
        }
        userStats.engagement.timeSpent[today] += testData.totalTime;

        // Update progress stats
        userStats.progress.quizScores.push(testData.percentage);
        userStats.progress.totalQuestions += testData.questions.length;

        const correctAnswers = testData.questions.filter(q => q.userAnswer === q.correctAnswer).length;
        userStats.progress.correctAnswers += correctAnswers;

        // Update completion rate
        userStats.engagement.completionRate = (userStats.progress.correctAnswers / userStats.progress.totalQuestions) * 100;

        // Save updated stats
        await userStats.save();

        return res.status(200).json({ success: true, message: 'Test completion recorded and stats updated' });
    } catch (error) {
        console.error('Error recording test completion:', error);
        return res.status(500).json({ success: false, message: 'Error recording test completion', error: error.message });
    }
})


module.exports = router