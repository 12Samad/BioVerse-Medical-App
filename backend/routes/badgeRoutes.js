const router = require("express").Router()
const Badge = require("../models/badgeModel")

/**
 * Create a new badge
 * POST /
 */
router.post("/", async (req, res) => {
    try {
        console.log(req.body)
        const badge = new Badge(req.body);
        const savedBadge = await badge.save();
        res.status(201).json({ message: "Badge created successfully", data: savedBadge });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * Get all badges
 * GET /
 */
router.get("/", async (req, res) => {
    try {
        const badges = await Badge.find();
        res.status(200).json({ data: badges });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Get a single badge by ID
 * GET //:id
 */
router.get("/:id", async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        res.status(200).json({ data: badge });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * Update a badge by ID
 * PUT //:id
 */
router.put("/:id", async (req, res) => {
    try {
        const updatedBadge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedBadge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        res.status(200).json({ message: "Badge updated successfully", data: updatedBadge });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * Delete a badge by ID
 * DELETE //:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const deletedBadge = await Badge.findByIdAndDelete(req.params.id);
        if (!deletedBadge) {
            return res.status(404).json({ message: "Badge not found" });
        }
        res.status(200).json({ message: "Badge deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router