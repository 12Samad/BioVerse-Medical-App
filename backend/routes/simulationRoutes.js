const router = require("express").Router()
const SimulationHistory = require('../models/simulationModel');
const streakManager = require("../utils/streakManager");

// Save a new simulation history
router.post("/saveSimulationHistory", async (req, res) => {
    try {
        const {
            userId,
            examName,
            score,
            totalQuestions,
            percentage,
            timeSpent,
            questions
        } = req.body;

        console.log(req.body)

        // Validate required fields
        if (!userId || !examName || score === undefined || !totalQuestions) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields for simulation history'
            });
        }

        // Create new history entry
        const simulationHistory = new SimulationHistory({
            userId,
            examName,
            score,
            totalQuestions,
            percentage,
            questionsAnswered: questions ? questions.length : totalQuestions,
            timeSpent,
            questions: questions || []
        });

        await streakManager.updateStreak(userId)

        // Save to database
        await simulationHistory.save();

        return res.status(201).json({
            success: true,
            data: simulationHistory,
            message: 'Simulation history saved successfully'
        });
    } catch (error) {
        console.error('Error saving simulation history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save simulation history',
            error: error.message
        });
    }
});

// Get simulation history for a user
router.get("/getSimulationHistory", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get all simulation history entries for the user, sorted by date (newest first)
        const history = await SimulationHistory.find({ userId })
            .sort({ date: -1 })
            .select('-questions'); // Exclude detailed question data for the list view

        // Format the data for frontend display
        const formattedHistory = history.map(entry => ({
            id: entry._id,
            date: entry.date,
            examName: entry.examName,
            score: entry.percentage,
            questionsAnswered: entry.questionsAnswered,
            duration: entry.formatTimeSpent(),
            totalQuestions: entry.totalQuestions
        }));

        return res.status(200).json({
            success: true,
            count: formattedHistory.length,
            data: formattedHistory
        });
    } catch (error) {
        console.error('Error fetching simulation history:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch simulation history',
            error: error.message
        });
    }
});

// Get detailed simulation result by ID
router.get("/getSimulationDetail", async (req, res) => {
    try {
        const { historyId } = req.params;

        if (!historyId) {
            return res.status(400).json({
                success: false,
                message: 'History ID is required'
            });
        }

        // Find the specific history entry with full details
        const historyDetail = await SimulationHistory.findById(historyId);

        if (!historyDetail) {
            return res.status(404).json({
                success: false,
                message: 'Simulation history not found'
            });
        }

        // Check if user has permission to view this history
        // This assumes req.user.id is available from auth middleware
        if (historyDetail.userId !== req.user?.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this simulation history'
            });
        }

        // Add stats and analysis
        const result = {
            ...historyDetail.toObject(),
            formattedDuration: historyDetail.formatTimeSpent(),
            stats: historyDetail.stats
        };

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching simulation detail:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch simulation detail',
            error: error.message
        });
    }
});

module.exports = router