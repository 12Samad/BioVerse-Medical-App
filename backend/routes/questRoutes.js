const express = require('express');
const mongoose = require('mongoose');
const { Quest } = require('../models/questModel');

const router = express.Router();

// Validation middleware
const validateQuestInput = (req, res, next) => {
    const { title, subject, description, targetHours, dueDate } = req.body;
    const errors = [];

    // Required fields
    if (!title || title.trim().length < 2 || title.trim().length > 100) {
        errors.push("Title must be between 2 and 100 characters");
    }

    if (!subject || subject.trim().length < 2 || subject.trim().length > 100) {
        errors.push("Subject must be between 2 and 100 characters");
    }

    if (!description || description.trim().length < 10 || description.trim().length > 1000) {
        errors.push("Description must be between 10 and 1000 characters");
    }

    if (!targetHours || targetHours < 0.25 || targetHours > 168) {
        errors.push("Target hours must be between 0.25 and 168");
    }

    if (!dueDate) {
        errors.push("Due date is required");
    } else {
        const now = new Date();
        const due = new Date(dueDate);
        if (due <= now) {
            errors.push("Due date must be in the future");
        }
    }

    // Category validation
    const validCategories = ["medication", "exercise", "diet", "monitoring", "assessment", "other"];
    if (req.body.category && !validCategories.includes(req.body.category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Priority validation
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (req.body.priority && !validPriorities.includes(req.body.priority)) {
        errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Tags validation
    if (req.body.tags && !Array.isArray(req.body.tags)) {
        errors.push("Tags must be an array");
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, error: errors });
    }

    next();
};

// Validate ObjectId
const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Get all quests for a user with filtering options
router.get('/', async (req, res) => {
    try {
        const { userId, status, category, priority, isCompleted, search, sort = 'createdAt', order = 'desc' } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const query = { userId };

        // Apply filters
        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;
        if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';

        // Search in title, subject, or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Determine sort order
        const sortOptions = {};
        sortOptions[sort] = order === 'asc' ? 1 : -1;

        const quests = await Quest.find(query)
            .sort(sortOptions)
            .populate('userId', 'name email');

        res.status(200).json({ success: true, data: quests });
    } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ success: false, error: "Failed to fetch quests" });
    }
});

// Get a single quest by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error fetching quest:', error);
        res.status(500).json({ success: false, error: "Failed to fetch quest" });
    }
});

// Create a new quest
router.post('/', validateQuestInput, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        if (!validateObjectId(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID format" });
        }

        const newQuest = new Quest(req.body);
        await newQuest.save();

        res.status(201).json({ success: true, data: newQuest });
    } catch (error) {
        console.error('Error creating quest:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, error: errors });
        }

        res.status(500).json({ success: false, error: "Failed to create quest" });
    }
});

// Update a quest
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        // Find the quest first to ensure it exists and belongs to the user
        const existingQuest = await Quest.findOne({ _id: id, userId });

        if (!existingQuest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        // Prevent updating certain fields directly
        const updates = { ...req.body };
        delete updates.userId; // Don't allow changing the owner
        delete updates._id; // Don't allow changing the ID

        // Update the quest
        const updatedQuest = await Quest.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: updatedQuest });
    } catch (error) {
        console.error('Error updating quest:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, error: errors });
        }

        res.status(500).json({ success: false, error: "Failed to update quest" });
    }
});

// Delete a quest
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const quest = await Quest.findOneAndDelete({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error deleting quest:', error);
        res.status(500).json({ success: false, error: "Failed to delete quest" });
    }
});

// Mark a quest as complete
router.post('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, completedHours } = req.body;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        quest.markAsCompleted(completedHours);
        await quest.save();

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error completing quest:', error);
        res.status(500).json({ success: false, error: "Failed to complete quest" });
    }
});

// Add a note to a quest
router.post('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, content } = req.body;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: "Note content is required" });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        quest.addNote(content);
        await quest.save();

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ success: false, error: "Failed to add note" });
    }
});

// Delete a note from a quest
router.delete('/:id/notes/:noteIndex', async (req, res) => {
    try {
        const { id, noteIndex } = req.params;
        const { userId } = req.query;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        const index = parseInt(noteIndex);

        if (isNaN(index) || index < 0 || index >= quest.notes.length) {
            return res.status(400).json({ success: false, error: "Invalid note index" });
        }

        quest.notes.splice(index, 1);
        await quest.save();

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ success: false, error: "Failed to delete note" });
    }
});

// Add an attachment to a quest
router.post('/:id/attachments', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, type, url, name, size } = req.body;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        if (!type || !url) {
            return res.status(400).json({ success: false, error: "Attachment type and URL are required" });
        }

        const validTypes = ["image", "document", "video", "audio", "other"];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, error: `Type must be one of: ${validTypes.join(', ')}` });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        quest.addAttachment({ type, url, name, size });
        await quest.save();

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error adding attachment:', error);
        res.status(500).json({ success: false, error: "Failed to add attachment" });
    }
});

// Delete an attachment from a quest
router.delete('/:id/attachments/:attachmentIndex', async (req, res) => {
    try {
        const { id, attachmentIndex } = req.params;
        const { userId } = req.query;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        const index = parseInt(attachmentIndex);

        if (isNaN(index) || index < 0 || index >= quest.attachments.length) {
            return res.status(400).json({ success: false, error: "Invalid attachment index" });
        }

        quest.attachments.splice(index, 1);
        await quest.save();

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ success: false, error: "Failed to delete attachment" });
    }
});

// Get quest statistics
router.get('/stats', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        if (!validateObjectId(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID format" });
        }

        const stats = await Quest.getStats(userId);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: "Failed to fetch statistics" });
    }
});

// Get overdue quests
router.get('/overdue', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        if (!validateObjectId(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID format" });
        }

        const overdueQuests = await Quest.findOverdue(userId);

        res.status(200).json({ success: true, data: overdueQuests });
    } catch (error) {
        console.error('Error fetching overdue quests:', error);
        res.status(500).json({ success: false, error: "Failed to fetch overdue quests" });
    }
});

// Update reminder settings
router.patch('/:id/reminders', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, enabled, frequency, customHours } = req.body;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        // Validate frequency
        if (frequency) {
            const validFrequencies = ["daily", "every_other_day", "weekly", "custom"];
            if (!validFrequencies.includes(frequency)) {
                return res.status(400).json({
                    success: false,
                    error: `Frequency must be one of: ${validFrequencies.join(', ')}`
                });
            }
        }

        // Validate customHours if provided
        if (customHours) {
            if (!Array.isArray(customHours)) {
                return res.status(400).json({ success: false, error: "Custom hours must be an array" });
            }

            for (const hour of customHours) {
                if (typeof hour !== 'number' || hour < 0 || hour > 23) {
                    return res.status(400).json({
                        success: false,
                        error: "Custom hours must be numbers between 0 and 23"
                    });
                }
            }
        }

        // Update reminder settings
        const reminderSettings = {
            ...quest.reminderSettings,
            ...(enabled !== undefined && { enabled }),
            ...(frequency && { frequency }),
            ...(customHours && { customHours })
        };

        const updatedQuest = await Quest.findByIdAndUpdate(
            id,
            { $set: { reminderSettings } },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: updatedQuest });
    } catch (error) {
        console.error('Error updating reminder settings:', error);
        res.status(500).json({ success: false, error: "Failed to update reminder settings" });
    }
});

// Cancel a quest
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!validateObjectId(id)) {
            return res.status(400).json({ success: false, error: "Invalid quest ID format" });
        }

        if (!userId) {
            return res.status(400).json({ success: false, error: "User ID is required" });
        }

        const quest = await Quest.findOne({ _id: id, userId });

        if (!quest) {
            return res.status(404).json({ success: false, error: "Quest not found" });
        }

        if (quest.isCompleted) {
            return res.status(400).json({ success: false, error: "Cannot cancel a completed quest" });
        }

        quest.status = "canceled";
        await quest.save();

        res.status(200).json({ success: true, data: quest });
    } catch (error) {
        console.error('Error canceling quest:', error);
        res.status(500).json({ success: false, error: "Failed to cancel quest" });
    }
});

module.exports = router