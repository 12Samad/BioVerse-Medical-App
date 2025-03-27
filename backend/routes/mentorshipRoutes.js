const express = require("express");
const router = express.Router();
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");
const Mentor = require("../models/Mentorship");

const auth = require("../middlewares/auth");
const authMiddleware = require("../middlewares/authMiddleware");

// @desc    Get all mentorships
// @route   GET /api/mentorships
// @access  Public
router.get("/", async (req, res) => {
    try {
        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ["select", "sort", "page", "limit", "search"];
        removeFields.forEach((param) => delete reqQuery[param]);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($gt, $gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

        // Finding resource
        let query = Mentorship.find(JSON.parse(queryStr));

        // Search functionality
        if (req.query.search) {
            query = query.find({
                $text: { $search: req.query.search },
            });
        }

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(",").join(" ");
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        // Pagination
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Number.parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Mentorship.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const mentorships = await query;

        // Pagination result
        const pagination = {};
        pagination.total = total;
        pagination.pages = Math.ceil(total / limit);
        pagination.current = page;
        pagination.limit = limit;

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit,
            };
        }
        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit,
            };
        }

        res.status(200).json({
            success: true,
            count: mentorships.length,
            pagination,
            data: mentorships,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Get single mentorship
// @route   GET /api/mentorships/:id
// @access  Public
router.get("/:id", async (req, res) => {
    try {
        const mentorship = await Mentorship.findById(req.params.id);
        if (!mentorship) {
            return res
                .status(404)
                .json({ success: false, error: `Mentorship not found with id of ${req.params.id}` });
        }
        res.status(200).json({
            success: true,
            data: mentorship,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Create new mentorship
// @route   POST /api/mentorships
// @access  Private (Admin/Mentor)
router.post("/", authMiddleware, async (req, res) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.userId;

        // Check if user is a mentor or admin
        const user = await User.findById(req.user.userId);
        if (user.role !== "mentor" && user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, error: `User with ID ${req.user.userId} is not authorized to create a mentorship` });
        }

        // Find or create mentor profile
        let mentor;
        mentor = await Mentor.findOne({ userId: user._id });

        if (!mentor && user.role === "admin" && req.body.mentorId) {
            // If admin is creating for a specific mentor
            mentor = await Mentor.findById(req.body.mentorId);
            if (!mentor) {
                return res.status(404).json({ success: false, error: "Specified mentor not found" });
            }
        } else if (!mentor) {
            // Create new mentor profile if it doesn't exist
            mentor = await Mentor.create({
                userId: user._id,
                name: user.name,
                avatar: user.avatar || "",
                title: user.title || req.body.mentorTitle || "Professional Mentor",
                company: user.company || req.body.mentorCompany || "",
                bio: user.bio || req.body.mentorBio || "",
                expertise: req.body.expertise || [],
                rating: 0,
                totalSessions: 0,
                reviews: [],
            });
        }

        // Assign mentor to mentorship
        req.body.mentor = mentor;

        // Create mentorship
        const mentorship = await Mentorship.create(req.body);

        res.status(201).json({
            success: true,
            data: mentorship,
        });
    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        }
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Update mentorship
// @route   PUT /api/mentorships/:id
// @access  Private (Admin/Mentor)
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        let mentorship = await Mentorship.findById(req.params.id);
        if (!mentorship) {
            return res
                .status(404)
                .json({ success: false, error: `Mentorship not found with id of ${req.params.id}` });
        }

        // Make sure user is mentorship owner or admin
        const user = await User.findById(req.user.userId);
        if (mentorship.createdBy.toString() !== req.user.userId && user.role !== "admin") {
            return res.status(403).json({
                success: false,
                error: `User ${req.user.userId} is not authorized to update this mentorship`,
            });
        }

        // Prevent changing the mentor directly
        if (req.body.mentor) {
            delete req.body.mentor;
        }

        mentorship = await Mentorship.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: mentorship,
        });
    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages });
        }
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Delete mentorship
// @route   DELETE /api/mentorships/:id
// @access  Private (Admin/Mentor)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const mentorship = await Mentorship.findById(req.params.id);
        if (!mentorship) {
            return res
                .status(404)
                .json({ success: false, error: `Mentorship not found with id of ${req.params.id}` });
        }

        // Make sure user is mentorship owner or admin
        const user = await User.findById(req.user.userId);
        if (mentorship.createdBy.toString() !== req.user.userId && user.role !== "admin") {
            return res.status(403).json({
                success: false,
                error: `User ${req.user.userId} is not authorized to delete this mentorship`,
            });
        }

        await Mentorship.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Add review to mentorship
// @route   POST /api/mentorships/:id/reviews
// @access  Private
router.post("/:id/reviews", authMiddleware, async (req, res) => {
    try {
        const mentorship = await Mentorship.findById(req.params.id);
        if (!mentorship) {
            return res
                .status(404)
                .json({ success: false, error: `Mentorship not found with id of ${req.params.id}` });
        }

        // Get user info
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Check if user has already reviewed this mentorship
        const existingReview = mentorship.mentor.reviews.find(
            review => review.user === user.name
        );

        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: "You have already submitted a review for this mentorship"
            });
        }

        // Create review object
        const review = {
            user: user.name,
            rating: req.body.rating,
            comment: req.body.comment,
            createdAt: new Date().toISOString()
        };

        // Add review to mentorship
        mentorship.mentor.reviews.push(review);

        // Calculate average rating
        const totalRating = mentorship.mentor.reviews.reduce((acc, item) => acc + item.rating, 0);
        mentorship.mentor.rating = totalRating / mentorship.mentor.reviews.length;

        await mentorship.save();

        // Also update the mentor model if it exists separately
        const mentor = await Mentor.findById(mentorship.mentor._id);
        if (mentor) {
            mentor.reviews.push(review);
            const mentorTotalRating = mentor.reviews.reduce((acc, item) => acc + item.rating, 0);
            mentor.rating = mentorTotalRating / mentor.reviews.length;
            await mentor.save();
        }

        res.status(201).json({
            success: true,
            data: mentorship,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Get featured mentorships
// @route   GET /api/mentorships/featured
// @access  Public
router.get("/featured", async (req, res) => {
    try {
        const limit = Number.parseInt(req.query.limit, 10) || 3;
        const mentorships = await Mentorship.find({ featured: true }).limit(limit);

        res.status(200).json({
            success: true,
            count: mentorships.length,
            data: mentorships,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;