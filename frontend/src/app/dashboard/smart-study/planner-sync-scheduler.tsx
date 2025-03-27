"use client"

import axios from "axios"
import { useEffect, useState } from "react"
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

// Define the interface for weekly plan tasks
interface PlanTask {
  id: string
  title: string
  subject: string
  topic: string
  date: string
  duration: number
  priority: "high" | "medium" | "low"
}

interface PlannerSyncSchedulerProps {
  userId: string
  onTestsAdded?: (tests: Test[]) => void
  onSyncComplete?: () => void
}

// Define the interface for CalendarTest
// interface CalendarTest {
//   subjectName: string
//   testTopic: string
//   date: string
// }

const PlannerSyncScheduler = ({ userId, onTestsAdded, onSyncComplete }: PlannerSyncSchedulerProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Load last sync time from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSyncTime = localStorage.getItem("lastPlannerSyncTime")
      if (storedSyncTime) {
        setLastSyncTime(storedSyncTime)
      }
    }
  }, [])

  // Removed unused validateTest function to resolve the error

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

  // Function to fetch weekly plan from localStorage or backend
  const fetchWeeklyPlan = async (): Promise<PlanTask[]> => {
    // First try to get from localStorage
    if (typeof window !== "undefined") {
      const storedPlan = localStorage.getItem("weeklyStudyPlan")
      if (storedPlan) {
        try {
          return JSON.parse(storedPlan)
        } catch (e) {
          console.error("Error parsing stored plan:", e)
        }
      }
    }

    // If not in localStorage, try to fetch from backend
    if (userId) {
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/study-plan/${userId}`)
        if (response.data && Array.isArray(response.data)) {
          return response.data
        }
      } catch (error) {
        console.error("Failed to fetch weekly plan:", error)
      }
    }

    return [] // Return empty array if no plan found
  }

  // Update the convertPlanTasksToTests function to return Test objects
  const convertPlanTasksToTests = (tasks: PlanTask[], userId: string): Test[] => {
    return tasks.map((task) => ({
      _id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      subjectName: task.subject,
      testTopic: task.title,
      date: new Date(task.date),
      color: getPriorityColor(task.priority),
      completed: false,
      userId: userId,
    }))
  }

  // Get color based on priority
  const getPriorityColor = (priority: "high" | "medium" | "low"): string => {
    switch (priority) {
      case "high":
        return "#EF4444" // Red
      case "medium":
        return "#3B82F6" // Blue
      case "low":
        return "#10B981" // Green
      default:
        return "#3B82F6" // Default blue
    }
  }

  // Main function to sync planner and add review tasks
  const syncPlannerAndAddReviews = async () => {
    if (!userId) {
      toast.error("User ID not found. Please log in.")
      return
    }

    setIsProcessing(true)
    toast.loading("Syncing planner and scheduling reviews...")

    try {
      // 1. Fetch weekly plan
      const planTasks = await fetchWeeklyPlan()

      // 2. Convert plan tasks to calendar tests
      const planTests = convertPlanTasksToTests(planTasks, userId)

      // 3. Add plan tests to calendar
      const addedTests: Test[] = []
      const reviewTasks: Test[] = []

      for (const test of planTests) {
        const addedTest = await addTestToCalendar(test)
        if (addedTest) {
          addedTests.push(addedTest)

          // 4. Create review tasks for each added test
          const reviews = createReviewTasks(addedTest)
          reviewTasks.push(...reviews)
        }
      }

      // 5. Add review tasks to calendar
      const addedReviews: Test[] = []
      for (const review of reviewTasks) {
        const addedReview = await addTestToCalendar(review)
        if (addedReview) {
          addedReviews.push(addedReview)
        }
      }

      // 6. Update last sync time
      const now = new Date().toISOString()
      setLastSyncTime(now)
      if (typeof window !== "undefined") {
        localStorage.setItem("lastPlannerSyncTime", now)
      }

      // 7. Notify parent component
      if (onTestsAdded) {
        onTestsAdded([...addedTests, ...addedReviews])
      }

      if (onSyncComplete) {
        onSyncComplete()
      }

      toast.dismiss()
      toast.success(`Synced ${addedTests.length} plan items and scheduled ${addedReviews.length} review sessions`)
    } catch (error) {
      console.error("Error during sync:", error)
      toast.dismiss()
      toast.error("Failed to sync planner. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to schedule reviews for a single test
  // Removed as it is not used in the component

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">AI Planner Sync & Review Scheduler</h2>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-gray-600 mb-2">
            Sync your AI study plan with the calendar and automatically schedule spaced repetition review sessions.
          </p>
          {lastSyncTime && (
            <p className="text-sm text-gray-500">Last synced: {new Date(lastSyncTime).toLocaleString()}</p>
          )}
        </div>

        <button
          onClick={syncPlannerAndAddReviews}
          disabled={isProcessing}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Sync Plan & Schedule Reviews"}
        </button>
      </div>
    </div>
  )
}

export default PlannerSyncScheduler

