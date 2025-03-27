// This service handles the spaced repetition scheduling logic based on the Ebbinghaus forgetting curve

import type { Flashcard } from "./api-service"

// Review intervals in milliseconds
const REVIEW_INTERVALS = {
  STAGE_1: 24 * 60 * 60 * 1000, // 1 day
  STAGE_2: 7 * 24 * 60 * 60 * 1000, // 7 days
  STAGE_3: 16 * 24 * 60 * 60 * 1000, // 16 days
  STAGE_4: 35 * 24 * 60 * 60 * 1000, // 35 days
  MASTERED: 90 * 24 * 60 * 60 * 1000, // 90 days (optional review)
}

// Priority review intervals
const PRIORITY_INTERVALS = {
  HIGH: 8 * 60 * 60 * 1000, // 8 hours
  MEDIUM: 24 * 60 * 60 * 1000, // 1 day
  LOW: 3 * 24 * 60 * 60 * 1000, // 3 days
}

interface ScheduleOptions {
  reviewStage?: number
  lastReviewedDate?: Date | null
  mastery?: number
  priority?: "low" | "medium" | "high" | null
}

const spacedRepetitionService = {
  // Calculate the next review date based on the current review stage
  calculateNextReviewDate: (options: ScheduleOptions): Date => {
    const now = new Date()

    // If priority is set, use priority intervals
    if (options.priority) {
      const interval =
        options.priority === "high"
          ? PRIORITY_INTERVALS.HIGH
          : options.priority === "medium"
            ? PRIORITY_INTERVALS.MEDIUM
            : PRIORITY_INTERVALS.LOW

      return new Date(now.getTime() + interval)
    }

    // Otherwise use spaced repetition intervals based on stage
    const stage = options.reviewStage || 0
    let interval: number

    switch (stage) {
      case 0: // New card
        interval = REVIEW_INTERVALS.STAGE_1
        break
      case 1: // After first review
        interval = REVIEW_INTERVALS.STAGE_2
        break
      case 2: // After second review
        interval = REVIEW_INTERVALS.STAGE_3
        break
      case 3: // After third review
        interval = REVIEW_INTERVALS.STAGE_4
        break
      case 4: // After fourth review (mastered)
        interval = REVIEW_INTERVALS.MASTERED
        break
      default: // Fallback
        interval = REVIEW_INTERVALS.STAGE_1
    }

    // Adjust interval based on mastery level
    if (options.mastery !== undefined) {
      // Reduce interval for low mastery, increase for high mastery
      if (options.mastery < 30) {
        interval = Math.floor(interval * 0.5) // 50% of normal interval
      } else if (options.mastery > 80) {
        interval = Math.floor(interval * 1.5) // 150% of normal interval
      }
    }

    return new Date(now.getTime() + interval)
  },

  // Update a flashcard with new review information
  scheduleNextReview: (flashcard: Flashcard, options: ScheduleOptions = {}): Partial<Flashcard> => {
    const now = new Date()

    // Determine the new review stage
    let newReviewStage = flashcard.reviewStage || 0

    if (options.priority) {
      // Priority reviews don't advance the stage
      newReviewStage = Math.max(0, newReviewStage)
    } else if (options.mastery !== undefined) {
      // Advance stage if mastery is good, otherwise stay or go back
      if (options.mastery > 70) {
        newReviewStage = Math.min(5, newReviewStage + 1)
      } else if (options.mastery < 30) {
        newReviewStage = Math.max(0, newReviewStage - 1)
      }
    }

    // Calculate next review date
    const nextReviewDate = spacedRepetitionService.calculateNextReviewDate({
      reviewStage: newReviewStage,
      mastery: options.mastery !== undefined ? options.mastery : flashcard.mastery,
      priority: options.priority,
    })

    // Return updated flashcard fields
    return {
      reviewStage: newReviewStage,
      lastReviewedDate: now,
      nextReviewDate: nextReviewDate,
      reviewPriority: options.priority || null,
    }
  },

  // Get cards due for review
  getDueCards: (flashcards: Flashcard[]): Flashcard[] => {
    const now = new Date()

    return flashcards.filter((card) => {
      // Skip cards that don't have a next review date
      if (!card.nextReviewDate) return false

      // Skip fully mastered cards (stage 5) unless specifically requested
      if (card.reviewStage === 5 && !card.reviewPriority) return false

      // Check if the card is due for review
      return new Date(card.nextReviewDate) <= now
    })
  },

  // Sort cards by priority and due date
  sortCardsByPriority: (flashcards: Flashcard[]): Flashcard[] => {
    return [...flashcards].sort((a, b) => {
      // First sort by priority
      const priorityA = a.reviewPriority ? (a.reviewPriority === "high" ? 3 : a.reviewPriority === "medium" ? 2 : 1) : 0
      const priorityB = b.reviewPriority ? (b.reviewPriority === "high" ? 3 : b.reviewPriority === "medium" ? 2 : 1) : 0

      if (priorityA !== priorityB) {
        return priorityB - priorityA // Higher priority first
      }

      // Then sort by due date
      const dateA = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : Number.POSITIVE_INFINITY
      const dateB = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : Number.POSITIVE_INFINITY

      return dateA - dateB // Earlier dates first
    })
  },
}

export default spacedRepetitionService

