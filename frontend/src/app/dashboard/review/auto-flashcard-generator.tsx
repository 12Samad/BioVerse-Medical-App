"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import type { SessionItem } from "./review-session"
import toast from "react-hot-toast"

interface AutoFlashcardGeneratorProps {
  incorrectItems: SessionItem[]
  testMode?: boolean
  onFlashcardsCreated?: () => void
}

export function AutoFlashcardGenerator({
  incorrectItems,
  testMode = false,
  onFlashcardsCreated = () => {},
}: AutoFlashcardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (incorrectItems.length === 0) return

    const generateFlashcards = async () => {
      setIsGenerating(true)
      const userId = localStorage.getItem("Medical_User_Id")

      if (!userId) {
        console.error("User ID not found, cannot create flashcards")
        return
      }

      try {
        // Process each incorrect item that has an explanation
        const flashcardsToCreate = incorrectItems
          .filter((item) => item.explanation) // Only create flashcards for items with explanations
          .map((item) => ({
            question: item.question,
            answer: item.answer,
            explanation: item.explanation,
            originalItemId: item._id,
            topic: item.topic || "General",
            subtopics: item.subtopics || [],
            specialty: item.specialty || "Medicine",
          }))

        if (flashcardsToCreate.length === 0) return

        console.log("Attempting to create flashcards:", flashcardsToCreate)

        // Send flashcards to API in a single request
        await axios.post(`https://medical-backend-loj4.onrender.com/api/reviews/flashcards/create?userId=${userId}`, {
          flashcards: flashcardsToCreate,
        })

        // Show toast notification to inform user
        toast.success(`${flashcardsToCreate.length} flashcards created from missed questions`, {
          duration: 4000,
          position: "bottom-center",
          icon: "📝",
        })

        // Call the callback to update the parent component
        onFlashcardsCreated()

        console.log(`Created ${flashcardsToCreate.length} flashcards from incorrect answers:`, flashcardsToCreate)
      } catch (error) {
        console.error("Failed to create flashcards:", error)
        // Show error toast only in development
        if (process.env.NODE_ENV === "development") {
          toast.error("Failed to create flashcards")
        }
      } finally {
        setIsGenerating(false)
      }
    }

    // Run asynchronously to avoid blocking UI
    generateFlashcards()
  }, [incorrectItems, testMode, onFlashcardsCreated])

  // This component doesn't render anything visible in normal mode
  return testMode ? (
    <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-2 rounded-md text-sm z-50">
      {isGenerating ? "Creating flashcards..." : `${incorrectItems.length} incorrect items processed`}
    </div>
  ) : null
}

export default AutoFlashcardGenerator

