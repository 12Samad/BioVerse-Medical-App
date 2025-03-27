"use client"

import { useCallback } from "react"

// Ebbinghaus forgetting curve intervals (in days)
const REVIEW_INTERVALS = [1, 7, 16, 35]

export interface ReviewSchedule {
  nextReviewDate: Date
  reviewStage: number
}

interface SpacedRepetitionSchedulerProps {
  onScheduleUpdate?: (schedule: ReviewSchedule) => void
}

export const SpacedRepetitionScheduler = ({ onScheduleUpdate }: SpacedRepetitionSchedulerProps) => {
  // Calculate the next review date based on the current stage
  const calculateNextReviewDate = useCallback((currentStage: number): Date => {
    const now = new Date()
    const daysToAdd = currentStage < REVIEW_INTERVALS.length 
      ? REVIEW_INTERVALS[currentStage] 
      : REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1] * 2 // For stages beyond our defined intervals, double the last interval
    
    const nextDate = new Date(now)
    nextDate.setDate(now.getDate() + daysToAdd)
    
    return nextDate
  }, [])

  // Schedule a card for review based on performance
  const scheduleReview = useCallback((currentStage: number, wasCorrect: boolean): ReviewSchedule => {
    // If the answer was correct, advance to the next stage
    // If incorrect, move back a stage (but not below 0)
    const newStage = wasCorrect 
      ? currentStage + 1 
      : Math.max(0, currentStage - 1)
    
    const nextReviewDate = calculateNextReviewDate(newStage)
    
    const schedule = {
      nextReviewDate,
      reviewStage: newStage
    }
    
    if (onScheduleUpdate) {
      onScheduleUpdate(schedule)
    }
    
    return schedule
  }, [calculateNextReviewDate, onScheduleUpdate])

  // Schedule a card for immediate review (today)
  const scheduleForToday = useCallback((): ReviewSchedule => {
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    const schedule = {
      nextReviewDate: today,
      reviewStage: 0 // Reset to stage 0
    }
    
    if (onScheduleUpdate) {
      onScheduleUpdate(schedule)
    }
    
    return schedule
  }, [onScheduleUpdate])

  // Schedule a card for tomorrow
  const scheduleForTomorrow = useCallback((): ReviewSchedule => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(12, 0, 0, 0) // Noon tomorrow
    
    const schedule = {
      nextReviewDate: tomorrow,
      reviewStage: 0 // Reset to stage 0
    }
    
    if (onScheduleUpdate) {
      onScheduleUpdate(schedule)
    }
    
    return schedule
  }, [onScheduleUpdate])

  return {
    scheduleReview,
    scheduleForToday,
    scheduleForTomorrow,
    calculateNextReviewDate
  }
}

export default SpacedRepetitionScheduler
