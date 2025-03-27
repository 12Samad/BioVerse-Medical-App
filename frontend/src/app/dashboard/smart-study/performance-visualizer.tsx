"use client"

import axios from "axios"
import { AlertTriangle, BarChart3, BookOpen, CheckCircle, Clock, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

// Define interfaces
interface Test {
  _id: string
  subjectName: string
  testTopic: string
  date: Date | string
  color: string
  completed: boolean
  userId: string
}

interface TopicWeight {
  topic: string
  weight: number
  completedCount: number
  missedCount: number
  upcomingCount: number
  performance?: number // Optional performance score (0-100)
}

interface PerformanceVisualizerProps {
  tests?: Test[]
  onPriorityChange?: (prioritizedTests: Test[]) => void
}

const PerformanceVisualizer = ({ tests = [], onPriorityChange }: PerformanceVisualizerProps) => {
  const [userId, setUserId] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [topicWeights, setTopicWeights] = useState<TopicWeight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Fetch user ID and selected exam from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      const storedExam = localStorage.getItem("selectedExam")

      setUserId(storedUserId || "")
      setSelectedExam(storedExam || "")
    }
  }, [])

  // Get exam-specific subjects mapping (similar to examInterface.tsx)
  const getExamSubjects = useCallback((exam: string): string[] => {
    const examSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"],
      NEET: ["Physics", "Chemistry", "Biology", "Zoology", "Botany"],
      PLAB: ["Clinical Medicine", "Surgery", "Obstetrics", "Gynecology", "Psychiatry"],
      MCAT: ["Biology", "Chemistry", "Physics", "Psychology"],
      NCLEX: ["Fundamentals", "Medical-Surgical", "Pharmacology", "Maternal Newborn", "Pediatrics"],
      COMLEX: ["Osteopathic Principles", "Anatomy", "Microbiology", "Pathology", "Pharmacology"],
    }

    return examSubjectsMap[exam] || []
  }, [])

  // Generate mock high-yield data (similar to examInterface.tsx)
  const generateMockHighYieldData = useCallback(
    (exam: string): { topics: { topicName: string; weightage: number }[] } => {
      const examSpecificSubjects = getExamSubjects(exam)
      const topics: { topicName: string; weightage: number }[] = []

      // Create weightage distribution that adds up to 100
      let remainingWeight = 100
      for (let i = 0; i < examSpecificSubjects.length; i++) {
        const subject = examSpecificSubjects[i]

        // For the last subject, use the remaining weight
        const isLastSubject = i === examSpecificSubjects.length - 1

        // Generate a random weightage between 10 and 30, or the remaining weight for the last subject
        const weightage = isLastSubject
          ? remainingWeight
          : Math.min(Math.floor(Math.random() * 20) + 10, remainingWeight - 5)

        remainingWeight -= weightage

        topics.push({
          topicName: subject,
          weightage: weightage,
        })
      }

      // Sort topics by weightage (descending)
      topics.sort((a, b) => b.weightage - a.weightage)

      return { topics }
    },
    [getExamSubjects],
  )

  // Fetch performance data from API or generate mock data
  const fetchPerformanceData = useCallback(async () => {
    if (!selectedExam) return

    setIsLoading(true)

    try {
      // Try to fetch real data from API
      let topicData: TopicWeight[] = []

      try {
        const response = await axios.get(
          `https://medical-backend-loj4.onrender.com/api/test/performance/${userId}?exam=${selectedExam}`,
        )
        if (response.data && Array.isArray(response.data)) {
          topicData = response.data
        } else {
          throw new Error("Invalid data format")
        }
      } catch (apiError) {
        console.log("API error, using mock data:", apiError)

        // Generate mock data if API fails
        const mockHighYieldData = generateMockHighYieldData(selectedExam)

        topicData = mockHighYieldData.topics.map((topic) => ({
          topic: topic.topicName,
          weight: topic.weightage,
          completedCount: 0,
          missedCount: 0,
          upcomingCount: 0,
          performance: Math.floor(Math.random() * 100), // Random performance score
        }))
      }

      // Process test data to update counts
      if (tests.length > 0) {
        const now = new Date()

        tests.forEach((test) => {
          const testDate = new Date(test.date)
          const topic = topicData.find((t) => t.topic === test.subjectName)

          if (topic) {
            if (test.completed) {
              topic.completedCount++
            } else if (testDate < now) {
              topic.missedCount++
            } else {
              topic.upcomingCount++
            }
          }
        })
      }

      // Sort by weight (descending)
      topicData.sort((a, b) => b.weight - a.weight)

      setTopicWeights(topicData)
    } catch (error) {
      console.error("Error fetching performance data:", error)
      toast.error("Failed to load performance data")
    } finally {
      setIsLoading(false)
    }
  }, [userId, selectedExam, tests, generateMockHighYieldData])

  // Fetch data when dependencies change
  useEffect(() => {
    if (userId && selectedExam) {
      fetchPerformanceData()
    }
  }, [userId, selectedExam, tests, fetchPerformanceData])

  // Calculate priority score for a test based on topic weights and performance
  const calculatePriorityScore = useCallback(
    (test: Test): number => {
      const topic = topicWeights.find((t) => t.topic === test.subjectName)

      if (!topic) return 0

      // Higher weight, higher priority
      let priorityScore = topic.weight

      // If topic has high missed count, increase priority
      priorityScore += topic.missedCount * 5

      // If topic has low performance, increase priority
      if (topic.performance !== undefined && topic.performance < 70) {
        priorityScore += (70 - topic.performance) / 2
      }

      // If test is already completed, lower priority
      if (test.completed) {
        priorityScore *= 0.5
      }

      return priorityScore
    },
    [topicWeights],
  )

  // Prioritize tests based on calculated scores
  const prioritizeTests = useCallback(() => {
    if (!onPriorityChange || tests.length === 0 || topicWeights.length === 0) return

    // Calculate priority score for each test
    const testsWithPriority = tests.map((test) => ({
      test,
      priorityScore: calculatePriorityScore(test),
    }))

    // Sort by priority score (descending)
    testsWithPriority.sort((a, b) => b.priorityScore - a.priorityScore)

    // Extract just the tests in new priority order
    const prioritizedTests = testsWithPriority.map((item) => item.test)

    // Notify parent component
    onPriorityChange(prioritizedTests)

    toast.success("Tests prioritized based on exam weights and performance")
  }, [tests, topicWeights, calculatePriorityScore, onPriorityChange])

  // Get color based on performance score
  const getPerformanceColor = (performance?: number): string => {
    if (performance === undefined) return "bg-gray-300"
    if (performance < 50) return "bg-red-500"
    if (performance < 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Get priority label based on weight
  const getPriorityLabel = (weight: number): string => {
    if (weight >= 25) return "High"
    if (weight >= 15) return "Medium"
    return "Low"
  }

  // Get priority color based on weight
  const getPriorityColor = (weight: number): string => {
    if (weight >= 25) return "text-red-500"
    if (weight >= 15) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <BarChart3 className="mr-2 text-blue-500" size={24} />
          <h2 className="text-xl font-semibold">
            {selectedExam ? `${selectedExam} Topic Weights` : "Exam Topic Weights"}
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
          <button
            onClick={prioritizeTests}
            className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition-colors text-sm"
            disabled={isLoading || topicWeights.length === 0}
          >
            Prioritize Tests
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-pulse text-blue-500">Loading topic weights...</div>
        </div>
      ) : topicWeights.length > 0 ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            This chart shows the relative importance of each topic for your selected exam. Topics with higher weights
            and lower performance should be prioritized.
          </p>

          {/* Topic Weight Bars */}
          <div className="space-y-4 mb-6">
            {topicWeights.map((topic) => (
              <div key={topic.topic} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium">{topic.topic}</span>
                    <span className={`ml-2 text-xs font-semibold ${getPriorityColor(topic.weight)}`}>
                      ({getPriorityLabel(topic.weight)} Priority)
                    </span>
                  </div>
                  <span className="text-blue-600 font-bold">{topic.weight}%</span>
                </div>

                {/* Weight bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${topic.weight}%` }}></div>
                </div>

                {/* Performance indicators */}
                {showDetails && (
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <div className="flex space-x-3">
                      <div className="flex items-center">
                        <CheckCircle size={14} className="text-green-500 mr-1" />
                        <span>{topic.completedCount} completed</span>
                      </div>
                      <div className="flex items-center">
                        <XCircle size={14} className="text-red-500 mr-1" />
                        <span>{topic.missedCount} missed</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="text-blue-500 mr-1" />
                        <span>{topic.upcomingCount} upcoming</span>
                      </div>
                    </div>

                    {topic.performance !== undefined && (
                      <div className="flex items-center">
                        <span className="mr-2">Performance:</span>
                        <div
                          className="w-8 h-4 rounded-full mr-1"
                          style={{ backgroundColor: getPerformanceColor(topic.performance) }}
                        ></div>
                        <span>{topic.performance}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {showDetails && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <AlertTriangle size={16} className="text-yellow-500 mr-2" />
                Recommendations
              </h3>
              <ul className="space-y-2 text-sm">
                {topicWeights
                  .filter((topic) => topic.weight >= 20 || (topic.performance !== undefined && topic.performance < 60))
                  .slice(0, 3)
                  .map((topic) => (
                    <li key={`rec-${topic.topic}`} className="flex items-start">
                      <BookOpen size={16} className="text-blue-500 mr-2 mt-0.5" />
                      <span>
                        <strong>{topic.topic}:</strong>{" "}
                        {topic.weight >= 25
                          ? `High priority topic (${topic.weight}% of exam). Focus on this area.`
                          : topic.performance !== undefined && topic.performance < 60
                            ? `Low performance area (${topic.performance}%). Schedule more practice tests.`
                            : `Important topic that needs attention.`}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p>No topic weight data available for {selectedExam || "this exam"}.</p>
          <p className="text-sm text-gray-500 mt-2">Select an exam in the Exam Interface section below.</p>
        </div>
      )}
    </div>
  )
}

export default PerformanceVisualizer

