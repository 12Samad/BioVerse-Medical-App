"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { BookOpen, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface ReviewItem {
  subject: string
  activity: string
  weekNumber: number
  dayOfWeek: string
  taskId: string
  timestamp: number
}

interface ReviewSchedulerProps {
  currentWeekNumber: number
  focusAreas?: string[]
}

export const ReviewScheduler: React.FC<ReviewSchedulerProps> = ({ currentWeekNumber, focusAreas = [] }) => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])

  useEffect(() => {
    // Load review items from localStorage
    loadReviewItems()
  }, [currentWeekNumber])

  const loadReviewItems = () => {
    // Get performance data from localStorage
    const storedData = localStorage.getItem("studyPlanPerformance")
    if (!storedData) return

    try {
      const performanceData = JSON.parse(storedData)

      // Find items from the previous week that need review
      // (marked as "not-understood" or "skipped")
      const previousWeekNumber = currentWeekNumber - 1

      if (previousWeekNumber < 1) return

      const itemsToReview: ReviewItem[] = []

      Object.values(performanceData.tasks).forEach((task: any) => {
        if (task.weekNumber === previousWeekNumber && (task.status === "not-understood" || task.status === "skipped")) {
          itemsToReview.push({
            subject: task.subject,
            activity: task.activity,
            weekNumber: task.weekNumber,
            dayOfWeek: task.dayOfWeek,
            taskId: task.taskId,
            timestamp: task.timestamp,
          })
        }
      })

      // Sort by subject to group related topics
      itemsToReview.sort((a, b) => a.subject.localeCompare(b.subject))

      setReviewItems(itemsToReview)
    } catch (error) {
      console.error("Error loading review items:", error)
    }
  }

  // If there are no review items, don't render anything
  if (reviewItems.length === 0) {
    return null
  }

  // Group review items by subject
  const groupedBySubject: Record<string, ReviewItem[]> = {}

  reviewItems.forEach((item) => {
    if (!groupedBySubject[item.subject]) {
      groupedBySubject[item.subject] = []
    }
    groupedBySubject[item.subject].push(item)
  })

  // Calculate estimated review time (10 minutes per item, max 60 minutes)
  const estimatedTime = Math.min(reviewItems.length * 10, 60)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BookOpen className="text-blue-600 mr-2" size={20} />
          <h3 className="font-semibold text-blue-800">Weekly Review Session</h3>
        </div>
        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">Automated</span>
      </div>

      <p className="text-blue-700 text-sm mb-4">
        Based on your previous week&apos;s performance, we&apos;ve scheduled a review session for these topics:
      </p>

      <div className="space-y-3 mb-4">
        {Object.entries(groupedBySubject).map(([subject, items]) => (
          <div key={subject} className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="font-medium text-blue-800 mb-2">{subject}</div>
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={index} className="flex items-start text-sm">
                  <AlertCircle size={16} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item.activity}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-blue-700">
          <Clock className="mr-1" size={16} />
          <span>Estimated time: {estimatedTime} minutes</span>
        </div>

        <button
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={() => {
            // Mark all review items as reviewed in localStorage
            const storedData = localStorage.getItem("studyPlanPerformance")
            if (!storedData) return

            try {
              const performanceData = JSON.parse(storedData)

              // Update status for all review items
              reviewItems.forEach((item) => {
                if (performanceData.tasks[item.taskId]) {
                  performanceData.tasks[item.taskId].status = "completed"
                  performanceData.tasks[item.taskId].timestamp = Date.now()
                }
              })

              // Save back to localStorage
              localStorage.setItem("studyPlanPerformance", JSON.stringify(performanceData))

              // Clear the review items
              setReviewItems([])
            } catch (error) {
              console.error("Error updating review items:", error)
            }
          }}
        >
          <CheckCircle size={16} className="mr-1" />
          Complete Review
        </button>
      </div>
    </div>
  )
}

