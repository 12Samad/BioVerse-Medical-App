// utils/streakManager.js
const mongoose = require('mongoose');

/**
 * Dynamic streak manager that checks across all relevant collections
 * with improved debugging and timezone handling
 */
const streakManager = {
    /**
     * Update user streak based on activity across all collections
     * @param {string} userId - The user's ID
     * @param {boolean} forceUpdate - Force update even if activity exists today
     * @returns {Promise<Object|null>} - Updated streak data or null if error
     */
    updateStreak: async (userId, forceUpdate = false) => {
        try {
            if (!userId) {
                console.log('No userId provided for streak update');
                return null;
            }

            // Load models (safely)
            const UserStreak = mongoose.models.UserStreak ||
                require('../models/UserStreak');

            // Get references to all collections that count toward streaks
            const collections = {
                TestData: mongoose.models.TestData,
                SimulationHistory: mongoose.models.SimulationHistory,
                ChallengeSession: mongoose.models.ChallengeSession,
                DailyChallenge: mongoose.models.DailyChallenge
            };

            // Filter out any undefined collections
            const availableCollections = Object.entries(collections)
                .filter(([_, model]) => model !== undefined)
                .reduce((acc, [name, model]) => {
                    acc[name] = model;
                    return acc;
                }, {});

            console.log(`Checking streak for user ${userId} across ${Object.keys(availableCollections).length} collections`);

            if (Object.keys(availableCollections).length === 0) {
                console.error('No valid collections found for streak tracking');
                return null;
            }

            // Get current date boundaries (using UTC to avoid timezone issues)
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date(today.getTime() + 86400000); // Add 24 hours

            console.log(`Date boundaries: ${today.toISOString()} to ${todayEnd.toISOString()}`);

            if (!forceUpdate) {
                // Check if user already has activity today in any collection
                const activityPromises = Object.entries(availableCollections).map(async ([name, model]) => {
                    const result = await model.exists({
                        userId,
                        createdAt: { $gte: today, $lt: todayEnd }
                    });

                    return { collection: name, hasActivity: result !== null };
                });

                const activityResults = await Promise.all(activityPromises);

                // Log which collections have activity
                activityResults.forEach(({ collection, hasActivity }) => {
                    if (hasActivity) {
                        console.log(`Found activity in ${collection} collection for user ${userId} today`);
                    }
                });

                const hasActivityToday = activityResults.some(result => result.hasActivity);

                // If user already has activity today, no need to update streak
                if (hasActivityToday) {
                    console.log(`User ${userId} already has activity today. Streak not updated.`);

                    // Return current streak data without updating
                    const currentStreak = await UserStreak.findOne({ userId }).lean();
                    return currentStreak || { currentStreak: 0, longestStreak: 0 };
                }
            } else {
                console.log(`Force updating streak for user ${userId} regardless of today's activity`);
            }

            // Find or create user streak
            let userStreak = await UserStreak.findOne({ userId });

            if (!userStreak) {
                console.log(`Creating new streak record for user ${userId}`);
                userStreak = new UserStreak({
                    userId,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastTestDate: null,
                    streakHistory: []
                });
            }

            // Get yesterday's date
            const yesterday = new Date(today);
            yesterday.setUTCDate(today.getUTCDate() - 1);

            // Check for activity yesterday across all collections
            const yesterdayPromises = Object.entries(availableCollections).map(async ([name, model]) => {
                const result = await model.exists({
                    userId,
                    createdAt: { $gte: yesterday, $lt: today }
                });

                return { collection: name, hasActivity: result !== null };
            });

            const yesterdayResults = await Promise.all(yesterdayPromises);

            // Log which collections had activity yesterday
            yesterdayResults.forEach(({ collection, hasActivity }) => {
                if (hasActivity) {
                    console.log(`Found activity in ${collection} collection for user ${userId} yesterday`);
                }
            });

            const hadActivityYesterday = yesterdayResults.some(result => result.hasActivity);

            if (hadActivityYesterday) {
                // Increment streak for consistent daily activity
                userStreak.currentStreak += 1;
                console.log(`Incrementing streak to ${userStreak.currentStreak} for user ${userId}`);

                // Update longest streak if needed
                if (userStreak.currentStreak > userStreak.longestStreak) {
                    userStreak.longestStreak = userStreak.currentStreak;
                    console.log(`New longest streak: ${userStreak.longestStreak}`);
                }
            } else {
                // Check when was the last activity
                const lastTestDate = userStreak.lastTestDate;
                console.log(`Last activity date: ${lastTestDate ? lastTestDate.toISOString() : 'never'}`);

                // If there was no activity yesterday, reset streak
                userStreak.currentStreak = 1;
                console.log(`Resetting streak to 1 for user ${userId} (no activity yesterday)`);
            }

            // Update last activity date
            userStreak.lastTestDate = today;

            // Add to streak history
            userStreak.streakHistory.push({
                date: today,
                streak: userStreak.currentStreak
            });

            // Save updated streak
            await userStreak.save();

            console.log(`Successfully updated streak for user ${userId}: ${userStreak.currentStreak} days`);
            return userStreak;
        } catch (error) {
            console.error('Error updating streak:', error);
            return null;
        }
    },

    /**
     * Get user's current streak data
     * @param {string} userId - The user's ID
     * @returns {Promise<Object>} - Streak data including current and longest streaks
     */
    getStreakData: async (userId) => {
        try {
            if (!userId) {
                return { currentStreak: 0, longestStreak: 0 };
            }

            // Load models
            const UserStreak = mongoose.models.UserStreak ||
                require('../models/UserStreak');

            // Get user streak
            const userStreak = await UserStreak.findOne({ userId }).lean();

            if (!userStreak) {
                return { currentStreak: 0, longestStreak: 0 };
            }

            return {
                currentStreak: userStreak.currentStreak,
                longestStreak: userStreak.longestStreak,
                lastActivityDate: userStreak.lastTestDate,
                streakHistory: userStreak.streakHistory || []
            };
        } catch (error) {
            console.error('Error getting streak data:', error);
            return { currentStreak: 0, longestStreak: 0 };
        }
    },

    /**
     * Force create or reset a user's streak
     * @param {string} userId - The user's ID
     * @param {number} startValue - Starting streak value (default: 1)
     * @returns {Promise<Object|null>} - Created/reset streak data or null if error
     */
    resetStreak: async (userId, startValue = 1) => {
        try {
            if (!userId) {
                console.log('No userId provided for streak reset');
                return null;
            }

            // Load UserStreak model
            const UserStreak = mongoose.models.UserStreak ||
                require('../models/UserStreak');

            // Find or create streak record
            let userStreak = await UserStreak.findOne({ userId });

            if (!userStreak) {
                userStreak = new UserStreak({
                    userId,
                    currentStreak: startValue,
                    longestStreak: startValue,
                    lastTestDate: new Date(),
                    streakHistory: []
                });
            } else {
                // Reset the streak
                userStreak.currentStreak = startValue;
                userStreak.lastTestDate = new Date();
            }

            // Add to history
            userStreak.streakHistory.push({
                date: new Date(),
                streak: startValue
            });

            // Update longest streak if needed
            if (startValue > userStreak.longestStreak) {
                userStreak.longestStreak = startValue;
            }

            // Save changes
            await userStreak.save();

            console.log(`Streak reset to ${startValue} for user ${userId}`);
            return userStreak;
        } catch (error) {
            console.error('Error resetting streak:', error);
            return null;
        }
    },

    /**
     * Get activity data for the last 7 days across all collections
     * @param {string} userId - The user's ID
     * @returns {Promise<Array>} - Activity data for the last 7 days
     */
    getActivityData: async (userId) => {
        try {
            if (!userId) return [];

            // Load models
            const collections = {
                TestData: { model: mongoose.models.TestData, type: 'test' },
                SimulationHistory: { model: mongoose.models.SimulationHistory, type: 'simulation' },
                ChallengeSession: { model: mongoose.models.ChallengeSession, type: 'challenge' },
                DailyChallenge: { model: mongoose.models.DailyChallenge, type: 'daily' }
            };

            // Filter available collections
            const availableCollections = Object.entries(collections)
                .filter(([_, { model }]) => model !== undefined)
                .reduce((acc, [name, data]) => {
                    acc[name] = data;
                    return acc;
                }, {});

            // Set date range for last 7 days (using UTC)
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setUTCDate(today.getUTCDate() - 6);

            console.log(`Getting activity from ${sevenDaysAgo.toISOString()} to ${today.toISOString()}`);

            // Aggregate activity across all collections
            const aggregationPromises = Object.values(availableCollections).map(({ model, type }) =>
                model.aggregate([
                    {
                        $match: {
                            userId: userId,
                            createdAt: {
                                $gte: sevenDaysAgo,
                                $lte: new Date(today.getTime() + 86400000)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: "$createdAt"
                                }
                            },
                            count: { $sum: 1 },
                            type: { $first: type }
                        }
                    }
                ])
            );

            // Run all aggregations in parallel
            const results = await Promise.all(aggregationPromises);
            const allActivities = results.flat();

            console.log(`Found ${allActivities.length} activity records`);

            // Format into a daily activity map
            const activityMap = new Map();

            // Initialize with all 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setUTCDate(date.getUTCDate() - i);
                const dateString = date.toISOString().split('T')[0];

                activityMap.set(dateString, {
                    date: dateString,
                    count: 0,
                    activities: {}
                });
            }

            // Fill in activity data
            allActivities.forEach(activity => {
                const dateStr = activity._id;
                const current = activityMap.get(dateStr) || {
                    date: dateStr,
                    count: 0,
                    activities: {}
                };

                current.count += activity.count;
                current.activities[activity.type] = (current.activities[activity.type] || 0) + activity.count;

                activityMap.set(dateStr, current);
            });

            // Convert to sorted array
            return Array.from(activityMap.values())
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error('Error getting activity data:', error);
            return [];
        }
    }
};

module.exports = streakManager;