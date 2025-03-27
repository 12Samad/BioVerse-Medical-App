const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Mentorship = require("../models/Mentorship");
const auth = require("../middlewares/auth");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, error: "User not authorized to access this route" });
        }

        const bookings = await Booking.find();

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Get user bookings
// @route   GET /api/bookings/user
// @access  Private
router.get("/user", auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Get mentor bookings (Mentor/Admin only)
// @route   GET /api/bookings/mentor
// @access  Private
router.get("/mentor", auth, async (req, res) => {
    try {
        // Check if user is mentor or admin
        if (req.user.role !== "mentor" && req.user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, error: "User not authorized to access this route" });
        }

        const bookings = await Booking.find({ mentorId: req.user.id });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get("/:id", auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res
                .status(404)
                .json({ success: false, error: `Booking not found with id of ${req.params.id}` });
        }

        // Make sure user is booking owner, mentor, or admin
        if (
            booking.userId.toString() !== req.user.id &&
            booking.mentorId.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                error: `User ${req.user.id} is not authorized to view this booking`,
            });
        }

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
router.post("/", auth, async (req, res) => {
    try {
        // Add user to req.body
        req.body.userId = req.user.id;

        // Check if mentorship exists
        const mentorship = await Mentorship.findById(req.body.mentorshipId);

        if (!mentorship) {
            return res.status(404).json({
                success: false,
                error: `Mentorship not found with id of ${req.body.mentorshipId}`,
            });
        }

        // Check if date and time are available
        const availabilitySlot = mentorship.availability.find(
            (slot) => slot.date === req.body.date
        );

        if (!availabilitySlot) {
            return res
                .status(400)
                .json({ success: false, error: `Date ${req.body.date} is not available` });
        }

        if (!availabilitySlot.slots.includes(req.body.time)) {
            return res.status(400).json({
                success: false,
                error: `Time ${req.body.time} is not available on ${req.body.date}`,
            });
        }

        // Create booking object
        const bookingData = {
            mentorshipId: req.body.mentorshipId,
            mentorship: {
                _id: mentorship._id,
                title: mentorship.title,
                duration: mentorship.duration,
            },
            mentorId: mentorship.mentor.userId,
            mentor: {
                _id: mentorship.mentor.userId,
                name: mentorship.mentor.name,
                avatar: mentorship.mentor.avatar,
            },
            userId: req.user.id,
            date: req.body.date,
            time: req.body.time,
            status: "upcoming",
            paymentStatus: "pending",
        };

        // Create booking
        const booking = await Booking.create(bookingData);

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(mentorship.price * 100), // amount in cents
            currency: "usd",
            metadata: {
                bookingId: booking._id.toString(),
                userId: req.user.id,
                mentorshipId: mentorship._id.toString(),
            },
        });

        res.status(201).json({
            success: true,
            data: booking,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin/Mentor/Owner)
router.put("/:id/status", auth, async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res
                .status(404)
                .json({ success: false, error: `Booking not found with id of ${req.params.id}` });
        }

        // Make sure user is booking owner, mentor, or admin
        if (
            booking.userId.toString() !== req.user.id &&
            booking.mentorId.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                error: `User ${req.user.id} is not authorized to update this booking`,
            });
        }

        // Validate status
        if (!["upcoming", "completed", "cancelled"].includes(req.body.status)) {
            return res
                .status(400)
                .json({ success: false, error: `Status ${req.body.status} is not valid` });
        }

        // Update booking
        booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        // If booking is completed, update mentor's totalSessions
        if (req.body.status === "completed") {
            const mentorship = await Mentorship.findById(booking.mentorshipId);
            if (mentorship) {
                mentorship.mentor.totalSessions += 1;
                await mentorship.save();
            }
        }

        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private (Owner)
router.delete("/:id", auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res
                .status(404)
                .json({ success: false, error: `Booking not found with id of ${req.params.id}` });
        }

        // Make sure user is booking owner
        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: `User ${req.user.id} is not authorized to cancel this booking`,
            });
        }

        // Check if booking is already completed
        if (booking.status === "completed") {
            return res
                .status(400)
                .json({ success: false, error: "Cannot cancel a completed booking" });
        }

        // Update booking status to cancelled
        booking.status = "cancelled";
        await booking.save();

        // If payment was completed, initiate refund logic here
        if (booking.paymentStatus === "completed") {
            // Refund logic would go here
            booking.paymentStatus = "refunded";
            await booking.save();
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
