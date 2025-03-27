const express = require("express");
const router = express.Router();

const Mentorship = require("../models/Mentorship");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const auth = require("../middlewares/auth");

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
router.get("/stats", auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, error: "User not authorized to access this route" });
        }

        // Get total revenue
        const payments = await Payment.find({ status: "completed" });
        const totalRevenue = payments.reduce((acc, payment) => acc + payment.amount, 0);

        // Get active users count (users who have made a payment in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPayments = await Payment.find({
            status: "completed",
            createdAt: { $gte: thirtyDaysAgo },
        });

        const activeUserIds = [
            ...new Set(recentPayments.map((payment) => payment.userId.toString())),
        ];
        const activeUsers = activeUserIds.length;

        // Get course sales count
        const courseSales = await Payment.countDocuments({
            courseId: { $exists: true },
            status: "completed",
        });

        // Get mentorship bookings count
        const mentorshipBookings = await Booking.countDocuments({
            status: { $in: ["upcoming", "completed"] },
            paymentStatus: "completed",
        });

        // Get revenue by month for the current year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        const monthlyPayments = await Payment.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: { $gte: startOfYear },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    total: { $sum: "$amount" },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        // Format revenue by month
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        const revenueByMonth = months.map((name, index) => {
            const monthData = monthlyPayments.find((item) => item._id === index + 1);
            return {
                name,
                total: monthData ? monthData.total : 0,
            };
        });

        // Get recent sales
        const recentSalesData = await Payment.find({ status: "completed" })
            .sort("-createdAt")
            .limit(5)
            .populate("userId", "name email avatar");

        const recentSales = recentSalesData.map((payment) => ({
            user: {
                name: payment.userId.name,
                email: payment.userId.email,
                avatar: payment.userId.avatar,
            },
            amount: payment.amount,
        }));

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                activeUsers,
                courseSales,
                mentorshipBookings,
                revenueByMonth,
                recentSales,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Get user stats
// @route   GET /api/dashboard/user-stats
// @access  Private
router.get("/user-stats", auth, async (req, res) => {
    try {
        // Get user's course enrollments count
        const coursePayments = await Payment.countDocuments({
            userId: req.user.id,
            courseId: { $exists: true },
            status: "completed",
        });

        // Get user's upcoming bookings count
        const upcomingBookings = await Booking.countDocuments({
            userId: req.user.id,
            status: "upcoming",
        });

        // Get user's completed bookings count
        const completedBookings = await Booking.countDocuments({
            userId: req.user.id,
            status: "completed",
        });

        // Get user's total spent
        const payments = await Payment.find({
            userId: req.user.id,
            status: "completed",
        });
        const totalSpent = payments.reduce((acc, payment) => acc + payment.amount, 0);

        res.status(200).json({
            success: true,
            data: {
                courseEnrollments: coursePayments,
                upcomingBookings,
                completedBookings,
                totalSpent,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @desc    Get mentor stats
// @route   GET /api/dashboard/mentor-stats
// @access  Private (Mentor)
router.get("/mentor-stats", auth, async (req, res) => {
    try {
        // Check if user is mentor or admin
        if (req.user.role !== "mentor" && req.user.role !== "admin") {
            return res
                .status(403)
                .json({ success: false, error: "User not authorized to access this route" });
        }

        // Get mentor's mentorships
        const mentorships = await Mentorship.find({
            "mentor.userId": req.user.id,
        });

        const mentorshipIds = mentorships.map((mentorship) => mentorship._id);

        // Get upcoming bookings count
        const upcomingBookings = await Booking.countDocuments({
            mentorshipId: { $in: mentorshipIds },
            status: "upcoming",
        });

        // Get completed bookings count
        const completedBookings = await Booking.countDocuments({
            mentorshipId: { $in: mentorshipIds },
            status: "completed",
        });

        // Get total earnings from completed bookings
        const bookingIds = await Booking.find({
            mentorshipId: { $in: mentorshipIds },
            paymentStatus: "completed",
        }).distinct("_id");

        const payments = await Payment.find({
            bookingId: { $in: bookingIds },
            status: "completed",
        });
        const totalEarnings = payments.reduce((acc, payment) => acc + payment.amount, 0);

        // Calculate average rating and total reviews
        let averageRating = 0;
        let totalReviews = 0;

        mentorships.forEach((mentorship) => {
            if (mentorship.mentor.reviews && mentorship.mentor.reviews.length > 0) {
                totalReviews += mentorship.mentor.reviews.length;
                averageRating += mentorship.mentor.rating * mentorship.mentor.reviews.length;
            }
        });

        if (totalReviews > 0) {
            averageRating = averageRating / totalReviews;
        }

        res.status(200).json({
            success: true,
            data: {
                mentorshipCount: mentorships.length,
                upcomingBookings,
                completedBookings,
                totalEarnings,
                averageRating,
                totalReviews,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;
