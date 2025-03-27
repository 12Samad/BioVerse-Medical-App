"use client"
import { useState } from "react"
import toast from "react-hot-toast"

// Update the interface to match the Test interface in page.tsx
interface Test {
  _id: string
  date: Date
  subjectName: string
  testTopic: string
  completed: boolean
  userId: string
  color: string
}

interface TestReviewSchedulerProps {
  userId: string
  test: Test
  onReviewsAdded?: (reviews: Test[]) => void
}

// Define CalendarTest interface
// interface CalendarTest {
//   subjectName: string
//   testTopic: string
//   date: string
// }

const TestReviewScheduler = ({ userId, test, onReviewsAdded }: TestReviewSchedulerProps) => {
  const [isScheduling, setIsScheduling] = useState(false)


  // Update the addTestToCalendar function to work with Test objects
  const addTestToCalendar = async (test: Test): Promise<Test | null> => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return null
    }

    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(test),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to add test:", error)
      return null
    }
  }

  // Update the createReviewTasks function to return Test objects
  const createReviewTasks = (test: Test): Test[] => {
    const reviewTasks: Test[] = []
    const testDate = new Date(test.date)

    // Create review intervals (24 hours, 7 days, 30 days)
    const intervals = [
      { days: 1, label: "24h Review" },
      { days: 7, label: "7d Review" },
      { days: 30, label: "30d Review" },
    ]

    intervals.forEach((interval) => {
      const reviewDate = new Date(testDate)
      reviewDate.setDate(reviewDate.getDate() + interval.days)

      // Skip if review date is in the past
      if (reviewDate < new Date(new Date().setHours(0, 0, 0, 0))) {
        return
      }

      reviewTasks.push({
        _id: `review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        subjectName: test.subjectName,
        testTopic: `${test.testTopic} - ${interval.label}`,
        date: reviewDate,
        color: "#FACC15", // Light yellow color for review tasks
        completed: false,
        userId: test.userId,
      })
    })

    return reviewTasks
  }

  // Function to schedule reviews for a test
  const scheduleReviews = async () => {
    if (!userId || !test) {
      return
    }

    setIsScheduling(true)
    toast.loading(`Scheduling reviews for ${test.subjectName}...`)

    try {
      // Create review tasks
      const reviewTasks = createReviewTasks(test)

      // Add review tasks to calendar
      const addedReviews: Test[] = []
      for (const review of reviewTasks) {
        const addedReview = await addTestToCalendar(review)
        if (addedReview) {
          addedReviews.push(addedReview)
        }
      }

      // Notify parent component
      if (onReviewsAdded) {
        onReviewsAdded(addedReviews)
      }

      toast.dismiss()
      toast.success(`Scheduled ${addedReviews.length} review sessions for ${test.subjectName}`)
    } catch (error) {
      console.error("Error scheduling reviews:", error)
      toast.dismiss()
      toast.error("Failed to schedule reviews. Please try again.")
    } finally {
      setIsScheduling(false)
    }
  }

  return (
    <button
      onClick={scheduleReviews}
      disabled={isScheduling}
      className="bg-yellow-400 text-white py-1 px-3 rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 text-sm"
    >
      {isScheduling ? "Scheduling..." : "Schedule Reviews"}
    </button>
  )
}

export default TestReviewScheduler

