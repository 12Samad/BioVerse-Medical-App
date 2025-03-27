const router = require("express").Router()
const mongoose = require("mongoose")
const UserBadge = require("../models/userBadgeModel")
const User = require("../models/User")
const Badge = require("../models/badgeModel")
const Leaderboard = require("../models/leaderboard")

router.get("/leaderboard-users", async (req, res) => {
    try {
        const users = await Leaderboard.find({})
        const filteredUsers = users
        res.json(filteredUsers)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "-password")
        const filteredUsers = users.filter(doc => doc.role !== "admin")
        res.json(filteredUsers)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post("/badges", async (req, res) => {
    const { userId, badgeId, awardedBy, awardReason } = req.body;

    // Basic validation: userId and badgeId are required
    if (!userId || !badgeId) {
        return res.status(400).json({ message: "User ID and Badge ID are required." });
    }

    try {
        // Create a new UserBadge instance
        const newBadge = new UserBadge({
            userId,
            badgeId,
            awardedBy: awardedBy || "system", // Defaults to "system" if not provided
            awardReason,
        });

        // Save to database
        const savedBadge = await newBadge.save();

        // Return success response with the created badge
        res.status(201).json({ message: "Badge awarded successfully", data: savedBadge });
    } catch (error) {
        // Handle duplicate badge error (compound index violation)
        if (error.code === 11000) {
            return res.status(400).json({ message: "This badge has already been awarded to this user." });
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign a badge to a user
// @route   POST /api/user-badges
router.post("/assignBadge", async (req, res) => {
    try {
        const { userId, badgeId, awardReason } = req.body

        // console.log(req.body)
        // Check if user exists
        const user = await Leaderboard.find({ userId })
        if (!user) {
            return res.status(400).json({
                success: false,
                error: "User not found",
            })
        }

        // Check if badge exists
        const badge = await Badge.findById(badgeId)
        if (!badge) {
            return res.status(400).json({
                success: false,
                error: "Badge not found",
            })
        }

        // Check if badge is already assigned to user
        const existingAssignment = await UserBadge.findOne({ userId, badgeId })
        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                error: "Badge already assigned to this user",
            })
        }

        // Create user badge assignment
        const userBadge = await UserBadge.create({
            userId,
            badgeId,
            awardedBy: "admin",
            awardReason: awardReason || `Manually awarded by admin`,
        })

        res.status(201).json({
            success: true,
            data: userBadge,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Get all badges for a user
// @route   GET /api/user-badges/user/:userId
router.get("/getUserBadges/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        // console.log(req.params)
        // Check if user exists
        const user = await Leaderboard.find({ userId })
        if (!user) {
            return res.status(400).json({
                success: false,
                error: "User not found",
            })
        }

        // Get all badges for the user with badge details
        const userBadges = await UserBadge.find({ userId }).populate("badgeId").sort({ awardedAt: -1 })

        res.status(200).json({
            success: true,
            count: userBadges.length,
            data: userBadges,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Get all users who have a specific badge
// @route   GET /api/user-badges/badge/:badgeId
router.get("/getBadgeUsers/badge/:badgeId", async (req, res) => {
    try {
        const { badgeId } = req.params
        const page = Number.parseInt(req.query.page, 10) || 1
        const limit = Number.parseInt(req.query.limit, 10) || 10
        const skip = (page - 1) * limit

        // Check if badge exists
        const badge = await Badge.findById(badgeId)
        if (!badge) {
            return res.status(404).json({
                success: false,
                error: "Badge not found",
            })
        }

        // Get all users with this badge
        const userBadges = await UserBadge.find({ badgeId })
            .populate("userId", "username email profilePicture")
            .sort({ awardedAt: -1 })
            .skip(skip)
            .limit(limit)

        // Get total count for pagination
        const total = await UserBadge.countDocuments({ badgeId })

        res.status(200).json({
            success: true,
            count: userBadges.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
            data: userBadges,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Revoke a badge from a user
// @route   DELETE /api/user-badges/:id
router.delete("/revokeBadge/user-badges/:id", async (req, res) => {
    try {
        const userBadge = await UserBadge.findById(req.params.id)
        // console.log(req.params.id)

        if (!userBadge) {
            return res.status(404).json({
                success: false,
                error: "Badge assignment not found",
            })
        }

        await UserBadge.deleteOne({ _id: req.params.id }) // Correct method

        res.status(200).json({
            success: true,
            data: {},
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error: error.message })
    }
})

// @desc    Check if a user has earned a specific badge
// @route   GET /api/user-badges/check/:userId/:badgeId
router.get("/checkUserBadge/:userId/:badgeId", async (req, res) => {
    try {
        const { userId, badgeId } = req.params

        // Check if user has the badge
        const userBadge = await UserBadge.findOne({ userId, badgeId })

        res.status(200).json({
            success: true,
            data: {
                hasBadge: !!userBadge,
                badgeDetails: userBadge,
            },
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Get badge award statistics
// @route   GET /api/user-badges/stats
router.get("/getBadgeAwardStats", async (req, res) => {
    try {
        // Get total badge awards
        const totalAwards = await UserBadge.countDocuments()
        // console.log("Total awards count:", totalAwards);

        // Get awards by badge
        const awardsByBadge = await UserBadge.aggregate([
            {
                $group: {
                    _id: "$badgeId",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $lookup: {
                    from: "badges",
                    localField: "_id",
                    foreignField: "_id",
                    as: "badge",
                },
            },
            {
                $unwind: "$badge",
            },
            {
                $project: {
                    _id: 0,
                    badgeId: "$_id",
                    name: "$badge.name",
                    count: 1,
                },
            },
        ])
        // console.log("Awards by badge:", awardsByBadge);

        // Get recent awards with robust error handling
        const rawRecentAwards = await UserBadge.find()
            .sort({ awardedAt: -1 })
            .limit(10)
            .lean();

        // console.log("Raw recent awards:", JSON.stringify(rawRecentAwards, null, 2));

        // Fetch user and badge data separately to handle missing references
        const recentAwards = await Promise.all(
            rawRecentAwards.map(async (award) => {
                try {
                    // Get user data if it exists
                    let userData = null;
                    if (award.userId) {
                        userData = await Leaderboard.find({ userId: award.userId }).lean();
                    }

                    // Get badge data if it exists
                    let badgeData = null;
                    if (award.badgeId) {
                        badgeData = await Badge.findById(award.badgeId).lean();
                    }

                    return {
                        ...award,
                        user: userData, // Include complete user object or null
                        badge: badgeData, // Include complete badge object or null
                    };
                } catch (err) {
                    console.error(`Error fetching details for award ${award._id}:`, err);
                    return {
                        ...award,
                        user: null,
                        badge: null,
                        error: "Failed to load user or badge data"
                    };
                }
            })
        );

        // console.log("Processed recent awards:", JSON.stringify(recentAwards.slice(0, 2), null, 2));

        // Get awards over time (by month)
        const awardsByMonth = await UserBadge.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$awardedAt" },
                        month: { $month: "$awardedAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
            {
                $project: {
                    _id: 0,
                    date: {
                        $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }],
                    },
                    count: 1,
                },
            },
        ])
        // console.log("Awards by month:", awardsByMonth);

        res.status(200).json({
            success: true,
            data: {
                totalAwards,
                awardsByBadge,
                recentAwards,
                awardsByMonth,
            },
        })
    } catch (error) {
        console.error("Error in getBadgeAwardStats:", error)
        res.status(400).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
    }
})

module.exports = router