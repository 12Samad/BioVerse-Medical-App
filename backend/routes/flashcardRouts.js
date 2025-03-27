const express = require("express")
const router = express.Router()
const Flashcard = require("../models/flashcardModel")

// Get flashcards with optional filtering
router.get("/flashcards", async (req, res) => {
    try {
        const { category, difficulty, tag, userId, numFlashcards } = req.query

        // Build filter object
        const filter = {}

        // Always filter by userId if provided
        if (userId) filter.userId = userId

        // Apply optional filters
        if (category) filter.category = category
        if (difficulty) filter.difficulty = difficulty
        if (tag) filter.tags = tag

        // Get flashcards with filter
        let query = Flashcard.find(filter)

        // Limit number of flashcards if specified
        if (numFlashcards) {
            query = query.limit(Number.parseInt(numFlashcards))
        }

        const flashcards = await query.exec()

        res.status(200).json(flashcards)
    } catch (error) {
        console.error("Error fetching flashcards:", error)
        res.status(500).json({ error: error.message })
    }
})

// Get a single flashcard by ID
router.get("/flashcards/:id", async (req, res) => {
    try {
        const flashcard = await Flashcard.findById(req.params.id)

        if (!flashcard) {
            return res.status(404).json({ error: "Flashcard not found" })
        }

        res.status(200).json(flashcard)
    } catch (error) {
        console.error("Error fetching flashcard:", error)
        res.status(500).json({ error: error.message })
    }
})

// Create new flashcard
router.post("/flashcards", async (req, res) => {
    try {
        console.log(req.body);
        const flashcardData = req.body

        // Create new flashcard
        const newFlashcard = new Flashcard(flashcardData)
        await newFlashcard.save()

        res.status(201).json(newFlashcard)
    } catch (error) {
        console.error("Error creating flashcard:", error)
        res.status(500).json({ error: error.message })
    }
})

// Update a flashcard
router.put("/flashcards/:id", async (req, res) => {
    try {
        const flashcardData = req.body

        // Find and update the flashcard
        const updatedFlashcard = await Flashcard.findByIdAndUpdate(req.params.id, flashcardData, {
            new: true,
            runValidators: true,
        })

        if (!updatedFlashcard) {
            return res.status(404).json({ error: "Flashcard not found" })
        }

        res.status(200).json(updatedFlashcard)
    } catch (error) {
        console.error("Error updating flashcard:", error)
        res.status(500).json({ error: error.message })
    }
})


// Delete a flashcard
router.delete("/flashcards/:id", async (req, res) => {
    try {
        const deletedFlashcard = await Flashcard.findByIdAndDelete(req.params.id)

        if (!deletedFlashcard) {
            return res.status(404).json({ error: "Flashcard not found" })
        }

        res.status(200).json({ message: "Flashcard deleted successfully" })
    } catch (error) {
        console.error("Error deleting flashcard:", error)
        res.status(500).json({ error: error.message })
    }
}
)

module.exports = router