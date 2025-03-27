const express = require('express');
const router = express.Router();
const Mentor = require('../models/Mentor');

// @desc    Get all mentors
// @route   GET /api/mentorship
// @access  Public
router.get('/', async (req, res) => {
    console.log("\n🔍 [GET /api/mentorship] Request received with query:", req.query, "\n");

    try {
        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        let query = Mentor.find(JSON.parse(queryStr));

        // Search functionality
        if (req.query.search) {
            query = query.find({
                $text: { $search: req.query.search }
            });
        }

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Mentor.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const mentors = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: mentors.length,
            pagination,
            data: mentors
        });
    } catch (err) {
        console.error("❌ [GET /api/mentorship] Error:", err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @desc    Get single mentor
// @route   GET /api/mentorship/:id
// @access  Public
router.get('/:id', async (req, res) => {
    console.log(`\n🔍 [GET /api/mentorship/${req.params.id}] Request for mentor ID: ${req.params.id}\n`);

    try {
        const mentor = await Mentor.findById(req.params.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: `Mentor not found with id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: mentor
        });
    } catch (err) {
        console.error("❌ [GET /api/mentorship/:id] Error:", err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @desc    Create new mentor
// @route   POST /api/mentorship
// @access  Private (Admin)
router.post('/', async (req, res) => {
    console.log("\n✍️ [POST /api/mentorship] Request received:", req.body, "\n");

    try {
        // Create the mentor
        const mentor = await Mentor.create(req.body);

        console.log("✅ [POST /api/mentorship] Mentor created:", mentor);

        res.status(201).json({
            success: true,
            data: mentor
        });
    } catch (err) {
        console.error("❌ [POST /api/mentorship] Error:", err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// @desc    Update mentor
// @route   PUT /api/mentorship/:id
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
    console.log(`\n🔄 [PUT /api/mentorship/${req.params.id}] Request for updating mentor ID: ${req.params.id}\n`);

    try {
        let mentor = await Mentor.findById(req.params.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: `Mentor not found with id of ${req.params.id}`
            });
        }

        // Update mentor
        mentor = await Mentor.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        console.log("✅ [PUT /api/mentorship] Mentor updated:", mentor);

        res.status(200).json({
            success: true,
            data: mentor
        });
    } catch (err) {
        console.error("❌ [PUT /api/mentorship/:id] Error:", err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// @desc    Delete mentor
// @route   DELETE /api/mentorship/:id
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    console.log(`\n🗑️ [DELETE /api/mentorship/${req.params.id}] Request for deleting mentor ID: ${req.params.id}\n`);

    try {
        const mentor = await Mentor.findById(req.params.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: `Mentor not found with id of ${req.params.id}`
            });
        }

        await mentor.deleteOne();

        console.log("✅ [DELETE /api/mentorship] Mentor deleted successfully.");

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error("❌ [DELETE /api/mentorship/:id] Error:", err);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// @desc    Get mentors by expertise
// @route   GET /api/mentorship/expertise/:skill
// @access  Public
router.get('/expertise/:skill', async (req, res) => {
    console.log(`\n🔍 [GET /api/mentorship/expertise/${req.params.skill}] Request for mentors with expertise: ${req.params.skill}\n`);

    try {
        const mentors = await Mentor.find({
            expertise: { $in: [req.params.skill] }
        });

        res.status(200).json({
            success: true,
            count: mentors.length,
            data: mentors
        });
    } catch (err) {
        console.error("❌ [GET /api/mentorship/expertise/:skill] Error:", err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @desc    Get available time slots for a mentor
// @route   GET /api/mentorship/:id/availability
// @access  Public
router.get('/:id/availability', async (req, res) => {
    console.log(`\n🔍 [GET /api/mentorship/${req.params.id}/availability] Request for mentor availability\n`);

    try {
        const mentor = await Mentor.findById(req.params.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: `Mentor not found with id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: mentor.availability
        });
    } catch (err) {
        console.error("❌ [GET /api/mentorship/:id/availability] Error:", err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @desc    Update mentor availability
// @route   PUT /api/mentorship/:id/availability
// @access  Private (Admin or Mentor)
router.put('/:id/availability', async (req, res) => {
    console.log(`\n🔄 [PUT /api/mentorship/${req.params.id}/availability] Request to update availability\n`);

    try {
        let mentor = await Mentor.findById(req.params.id);

        if (!mentor) {
            return res.status(404).json({
                success: false,
                error: `Mentor not found with id of ${req.params.id}`
            });
        }

        // Check if user is admin or the mentor themselves
        if (req.user.role !== 'admin' && (!mentor.userId || mentor.userId.toString() !== req.user.id)) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this mentor\'s availability'
            });
        }

        // Update availability
        mentor = await Mentor.findByIdAndUpdate(
            req.params.id,
            { availability: req.body },
            {
                new: true,
                runValidators: true
            }
        );

        console.log("✅ [PUT /api/mentorship/:id/availability] Availability updated");

        res.status(200).json({
            success: true,
            data: mentor.availability
        });
    } catch (err) {
        console.error("❌ [PUT /api/mentorship/:id/availability] Error:", err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;