const router = require("express").Router()
const Leaderboard = require("../models/leaderboard")
const User = require("../models/User")

// @desc    Get all leaderboard entries with pagination
// @route   GET /api/leaderboard
router.get("/getLeaderboard", async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page, 10) || 1
        const limit = Number.parseInt(req.query.limit, 10) || 10
        const skip = (page - 1) * limit

        // Build query based on filters
        const query = {}

        // Filter by userId if provided
        if (req.query.userId) {
            query.userId = req.query.userId
        }

        // Filter by time range if provided
        if (req.query.timeFrame) {
            const now = new Date()
            let startDate

            switch (req.query.timeFrame) {
                case "weekly":
                    startDate = new Date(now.setDate(now.getDate() - 7))
                    break
                case "monthly":
                    startDate = new Date(now.setMonth(now.getMonth() - 1))
                    break
                case "yearly":
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1))
                    break
                default:
                    startDate = null
            }

            if (startDate) {
                query.createdAt = { $gte: startDate }
            }
        }

        // Determine sort order
        const sortField = req.query.sortBy || "score"
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1
        const sortOptions = {}
        sortOptions[sortField] = sortOrder

        // If sorting by score, add secondary sort by totalTime (ascending)
        if (sortField === "score" && sortOrder === -1) {
            sortOptions.totalTime = 1
        }

        // Execute query with pagination
        const entries = await Leaderboard.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .populate("userId", "username profilePicture")

        // Get total count for pagination
        const total = await Leaderboard.countDocuments(query)

        // Calculate rank for each entry
        const rankedEntries = entries.map((entry, index) => {
            const entryObj = entry.toObject()
            entryObj._rank = skip + index + 1
            return entryObj
        })

        res.status(200).json({
            success: true,
            count: entries.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
            data: {
                leaderboard: rankedEntries,
            },
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Get a specific player's leaderboard entry with nearby players
// @route   GET /api/leaderboard/player/:userId
router.get("/getPlayerLeaderboard/player/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const timeFrame = req.query.timeFrame || "all-time"

        // Build query based on time frame
        const query = {}

        if (timeFrame !== "all-time") {
            const now = new Date()
            let startDate

            switch (timeFrame) {
                case "weekly":
                    startDate = new Date(now.setDate(now.getDate() - 7))
                    break
                case "monthly":
                    startDate = new Date(now.setMonth(now.getMonth() - 1))
                    break
                default:
                    startDate = null
            }

            if (startDate) {
                query.createdAt = { $gte: startDate }
            }
        }

        // Find the player's entry
        const playerEntry = await Leaderboard.findOne({ userId }).populate("userId", "username profilePicture")

        if (!playerEntry) {
            return res.status(404).json({
                success: false,
                error: "Player not found on the leaderboard",
            })
        }

        // Get all entries sorted by score (desc) and totalTime (asc)
        const allEntries = await Leaderboard.find(query)
            .sort({ score: -1, totalTime: 1 })
            .populate("userId", "username profilePicture")

        // Find player's rank
        const playerRank = allEntries.findIndex((entry) => entry.userId.equals(userId)) + 1

        // Get nearby players (2 above and 2 below)
        const startIndex = Math.max(0, playerRank - 3)
        const endIndex = Math.min(allEntries.length, playerRank + 2)
        const nearbyPlayers = allEntries.slice(startIndex, endIndex).map((entry, index) => {
            const entryObj = entry.toObject()
            entryObj._rank = startIndex + index + 1
            return entryObj
        })

        // Add rank to player entry
        const playerWithRank = playerEntry.toObject()
        playerWithRank._rank = playerRank

        res.status(200).json({
            success: true,
            data: {
                rank: playerRank,
                player: playerWithRank,
                nearbyPlayers,
            },
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Get a single leaderboard entry
// @route   GET /api/leaderboard/:id
router.get("/getLeaderboardEntry/:id", async (req, res) => {
    try {
        const entry = await Leaderboard.findById(req.params.id).populate("userId", "username email profilePicture")

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: "Leaderboard entry not found",
            })
        }

        res.status(200).json({
            success: true,
            data: entry,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Create a new leaderboard entry
// @route   POST /api/leaderboard
router.post("/createLeaderboardEntry", async (req, res) => {
    try {
        // Check if user exists
        const user = await User.findById(req.body.userId)
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            })
        }

        // Check if entry already exists for this user
        const existingEntry = await Leaderboard.findOne({ userId: req.body.userId })

        if (existingEntry) {
            // Update existing entry instead of creating a new one
            const updatedEntry = await Leaderboard.findByIdAndUpdate(
                existingEntry._id,
                {
                    score: req.body.score || existingEntry.score,
                    totalTime: req.body.totalTime || existingEntry.totalTime,
                    name: req.body.name || existingEntry.name,
                    updatedAt: Date.now(),
                },
                { new: true, runValidators: true },
            )

            return res.status(200).json({
                success: true,
                data: updatedEntry,
                message: "Existing leaderboard entry updated",
            })
        }

        // Create new entry
        const entry = await Leaderboard.create(req.body)

        res.status(201).json({
            success: true,
            data: entry,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Update a leaderboard entry
// @route   PUT /api/leaderboard/:id
router.patch("/updateLeaderboardEntry/:id", async (req, res) => {
    try {
        // Find entry to update
        let entry = await Leaderboard.findById(req.params.id)

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: "Leaderboard entry not found",
            })
        }

        // Check if user has permission (admin or entry owner)
        if (req.user.role !== "admin" && !entry.userId.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                error: "Not authorized to update this entry",
            })
        }

        // Update entry
        entry = await Leaderboard.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                updatedAt: Date.now(),
            },
            {
                new: true,
                runValidators: true,
            },
        )

        res.status(200).json({
            success: true,
            data: entry,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Delete a leaderboard entry
// @route   DELETE /api/leaderboard/:id
router.delete("/deleteLeaderboardEntry/:id", async (req, res) => {
    try {
        const entry = await Leaderboard.findById(req.params.id)

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: "Leaderboard entry not found",
            })
        }

        await entry.remove()

        res.status(200).json({
            success: true,
            data: {},
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

module.exports = router