"use client"

import axios from "axios"
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Timer, XCircle } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

// Types definitions
interface SimulationQuestion {
  _id: string
  question?: string // Added to support API response format
  questionText: string
  options: string[]
  correctAnswer: string
  subject: string
  subsection: string
  difficulty: string
  explanation?: string
  answer?: string
}

interface SimulationConfig {
  duration: number // in minutes
  totalQuestions: number
  examName: string
}

interface UserAnswer {
  questionId: string
  selectedAnswer: string | null
}

// Exam-specific configurations
const examConfigs: Record<string, SimulationConfig> = {
  "USMLE Step 1": { duration: 10, totalQuestions: 40, examName: "USMLE Step 1" },
  NEET: { duration: 10, totalQuestions: 50, examName: "NEET" },
  PLAB: { duration: 10, totalQuestions: 45, examName: "PLAB" },
  MCAT: { duration: 10, totalQuestions: 8, examName: "MCAT" },
  NCLEX: { duration: 10, totalQuestions: 40, examName: "NCLEX" },
  COMLEX: { duration: 10, totalQuestions: 40, examName: "COMLEX" },
  // Default config for fallback
  DEFAULT: { duration: 10, totalQuestions: 30, examName: "Medical Exam" },
}
const ExamSimulation: React.FC = () => {
  // State for simulation
  const [isSimulationActive, setIsSimulationActive] = useState(false)
  const [isSimulationComplete, setIsSimulationComplete] = useState(false)
  const [simulationQuestions, setSimulationQuestions] = useState<SimulationQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // in seconds
  const [isLoading, setIsLoading] = useState(false)
  const [examConfig, setExamConfig] = useState<SimulationConfig>(examConfigs["DEFAULT"])
  const [userId, setUserId] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [simulationResults, setSimulationResults] = useState<{
    score: number
    totalQuestions: number
    percentage: number
    timeSpent: number
  } | null>(null)
  interface SimulationHistoryEntry {
    id: number
    date: string
    examName: string
    score: number
    questionsAnswered: number
    duration: string
  }

  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Timer ref for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const fetchSimulationHistory = async () => {
    try {
      const user_id = localStorage.getItem("Medical_User_Id")
      const { data } = await axios.get(
        `https://medical-backend-loj4.onrender.com/api/simulation/getSimulationHistory?userId=${user_id}`,
      )
      // console.log(data)
      setSimulationHistory(data.data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to fetch history")
    }
  }

  // Check for simulation requests from Today Dashboard
  useEffect(() => {
    const checkForSimulationRequest = () => {
      if (typeof window !== "undefined") {
        const startSimulationFlag = localStorage.getItem("startSimulation")

        if (startSimulationFlag === "true") {
          // Clear the flag immediately to prevent multiple starts
          localStorage.removeItem("startSimulation")

          // Get the simulation details
          const simulationType = localStorage.getItem("simulationType")
          const simulationSubject = localStorage.getItem("simulationSubject")
          const simulationTitle = localStorage.getItem("simulationTitle")
          const storedExam = localStorage.getItem("selectedExam")

          // Log the details for debugging (can be removed later)
          console.log("Starting simulation:", { simulationType, simulationSubject, simulationTitle, storedExam })

          // Update the selected exam if it's available
          if (storedExam && storedExam !== selectedExam) {
            setSelectedExam(storedExam)
            setExamConfig(examConfigs[storedExam] || examConfigs["DEFAULT"])
          }

          // Only start if we're not already in a simulation
          if (!isSimulationActive && !isSimulationComplete) {
            // Small delay to ensure the component is fully rendered and exam is set
            setTimeout(() => {
              startSimulation()
            }, 800) // Increased delay to ensure state updates
          }
        }
      }
    }

    // Check when component mounts
    checkForSimulationRequest()

    // Set up interval to check periodically
    const intervalId = setInterval(checkForSimulationRequest, 2000)

    return () => {
      clearInterval(intervalId)
    }
  }, [isSimulationActive, isSimulationComplete, selectedExam])

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      const storedExam = localStorage.getItem("selectedExam")

      setUserId(storedUserId || "")

      if (storedExam) {
        setSelectedExam(storedExam)
        setExamConfig(examConfigs[storedExam] || examConfigs["DEFAULT"])
      }
    }

    // Optionally fetch simulation history if you implement that feature
    fetchSimulationHistory()

    return () => {
      // Cleanup timer on component unmount
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Start simulation function
  const startSimulation = async () => {
    if (!selectedExam) {
      toast.error("Please select an exam in the calendar settings first")
      return
    }

    setIsLoading(true)

    try {
      // Initialize timer based on selected exam
      const config = examConfigs[selectedExam] || examConfigs["DEFAULT"]
      setExamConfig(config)
      setTimeRemaining(config.duration * 60) // Convert minutes to seconds

      // Get subjects relevant to the selected exam
      const examSubjects = getExamSubjects(selectedExam)
      const relatedSubjects = getRelatedSubjects(selectedExam)

      // Calculate question distribution (80% core subjects, 20% related)
      const totalQuestions = config.totalQuestions
      const examSpecificCount = Math.floor(totalQuestions * 0.8)
      const relatedSubjectsCount = totalQuestions - examSpecificCount

      let simulationQs: SimulationQuestion[] = []

      try {
        // Fetch main subject questions (80%)
        const examSpecificResponse = await axios.get(
          "https://medical-backend-loj4.onrender.com/api/test/take-test/questions-fixed",
          {
            params: {
              subjects: examSubjects.join(","),
              count: examSpecificCount,
              userId, // Include userId in the request if your API needs it
            },
          },
        )

        // Fetch related subject questions (20%)
        const relatedSubjectsResponse = await axios.get(
          "https://medical-backend-loj4.onrender.com/api/test/take-test/questions-fixed",
          {
            params: {
              subjects: relatedSubjects.join(","),
              count: relatedSubjectsCount,
              userId, // Include userId in the request if your API needs it
            },
          },
        )

        // Combine and shuffle questions
        simulationQs = [...examSpecificResponse.data, ...relatedSubjectsResponse.data].sort(() => Math.random() - 0.5)
      } catch (error) {
        console.error("Error fetching questions from API:", error)
        toast("Using sample questions due to API connectivity issues")

        // Fallback to mock data
        // simulationQs = generateMockQuestions(selectedExam, totalQuestions);
      }

      console.log(simulationQs)
      // Initialize simulation state
      setSimulationQuestions(simulationQs)
      setCurrentQuestionIndex(0)
      setUserAnswers(simulationQs.map((q) => ({ questionId: q._id, selectedAnswer: null })))
      setIsSimulationActive(true)
      setIsSimulationComplete(false)
      setSimulationResults(null)

      // Start the countdown timer
      startTimer()
    } catch (error) {
      console.error("Error starting simulation:", error)
      toast.error("Failed to start simulation. Please try again.")

      setCurrentQuestionIndex(0)
      //   setUserAnswers(mockQuestions.map(q => ({ questionId: q._id, selectedAnswer: null })));
      setIsSimulationActive(true)
      setIsSimulationComplete(false)
      setSimulationResults(null)

      // Start the countdown timer
      startTimer()
    } finally {
      setIsLoading(false)
    }
  }

  // Start the countdown timer
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - submit automatically
          clearInterval(timerRef.current as NodeJS.Timeout)
          submitSimulation()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < simulationQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  // Handle answer selection
  const handleAnswerSelection = (answer: string) => {
    setUserAnswers((prev) => {
      const newAnswers = [...prev]
      const currentQuestion = simulationQuestions[currentQuestionIndex]
      const answerIndex = newAnswers.findIndex((a) => a.questionId === currentQuestion._id)

      if (answerIndex !== -1) {
        newAnswers[answerIndex] = {
          ...newAnswers[answerIndex],
          selectedAnswer: answer,
        }
      }

      return newAnswers
    })
  }

  // Calculate results and end simulation
  const submitSimulation = () => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Calculate score
    let correctCount = 0
    userAnswers.forEach((answer) => {
      const question = simulationQuestions.find((q) => q._id === answer.questionId)
      if (question && answer.selectedAnswer) {
        console.log(question)
        const selectedAnswerText = answer.selectedAnswer
        const correctAnswerParts = question.answer //getting undefined on correctAnswer, because it doenst exist

        // Check if the selected answer matches the correct answer
        if (
          selectedAnswerText.startsWith(correctAnswerParts || "") ||
          selectedAnswerText.includes(correctAnswerParts || "")
        ) {
          correctCount++
        }
      }
    })

    const timeSpent = examConfig.duration * 60 - timeRemaining

    // Set results
    const results = {
      score: correctCount,
      totalQuestions: simulationQuestions.length,
      percentage: Math.round((correctCount / simulationQuestions.length) * 100),
      timeSpent: timeSpent, // in seconds
    }

    setSimulationResults(results)
    setIsSimulationComplete(true)

    // Save to history (this would normally be sent to a backend)
    const historyEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      examName: selectedExam,
      score: results.percentage,
      questionsAnswered: simulationQuestions.length,
      allQuestions: simulationQuestions,
      duration: formatTime(timeSpent),
    }

    const saveToDb = {
      userId,
      examName: selectedExam,
      score: results.percentage,
      percentage: results.percentage,
      questionsAnswered: userAnswers.length,
      totalQuestions: simulationQuestions.length,
      timeSpent,
      questions: simulationQuestions,
    }

    setSimulationHistory((prev) => [historyEntry, ...prev])

    try {
      axios.post("https://medical-backend-loj4.onrender.com/api/simulation/saveSimulationHistory", saveToDb)
    } catch (error) {
      console.error(error)
    }

    toast.success("Simulation completed!")
  }

  // Reset simulation state
  const resetSimulation = () => {
    setIsSimulationActive(false)
    setIsSimulationComplete(false)
    setSimulationQuestions([])
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setTimeRemaining(0)
    setSimulationResults(null)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  // Get exam-specific subjects mapping
  const getExamSubjects = (exam: string) => {
    // This mapping would ideally come from your backend
    // Using the same mapping function from the main component
    const examSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology"],
      NEET: ["Physics", "Chemistry", "Biology", "Zoology", "Botany"],
      PLAB: ["Clinical Medicine", "Surgery", "Obstetrics", "Gynecology", "Psychiatry"],
      MCAT: ["Biology", "Chemistry", "Physics", "Psychology"],
      NCLEX: ["Fundamentals", "Medical-Surgical", "Pharmacology", "Maternal Newborn", "Pediatrics"],
      COMLEX: ["Osteopathic Principles", "Anatomy", "Microbiology", "Pathology", "Pharmacology"],
    }

    return examSubjectsMap[exam] || []
  }

  // Get related subjects for an exam
  const getRelatedSubjects = (exam: string) => {
    // This would also ideally come from your backend
    // Using the same mapping function from the main component
    const relatedSubjectsMap: Record<string, string[]> = {
      "USMLE Step 1": ["Microbiology", "Immunology", "Neuroscience", "Behavioral Science"],
      NEET: ["Organic Chemistry", "Inorganic Chemistry", "Human Physiology", "Genetics"],
      PLAB: ["Emergency Medicine", "Pediatrics", "Dermatology", "Public Health"],
      MCAT: ["Biochemistry", "Organic Chemistry", "Sociology", "Statistics"],
      NCLEX: ["Critical Care", "Community Health", "Leadership", "Mental Health"],
      COMLEX: ["OMT", "Clinical Applications", "Ethics", "Biostatistics"],
    }

    return relatedSubjectsMap[exam] || []
  }

  // Calculate the number of answered questions
  const getAnsweredCount = () => {
    return userAnswers.filter((answer) => answer.selectedAnswer !== null).length
  }

  // Render different views based on simulation state
  if (!isSimulationActive) {
    // Start screen
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6" id="exam-simulation">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Exam Simulation</h2>
          <button onClick={() => setShowHistory(!showHistory)} className="text-blue-600 hover:underline">
            {showHistory ? "Hide History" : "View History"}
          </button>
        </div>

        {showHistory && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Simulation History</h3>
            {simulationHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 border">Date</th>
                      <th className="px-4 py-2 border">Exam</th>
                      <th className="px-4 py-2 border">Score</th>
                      <th className="px-4 py-2 border">Questions</th>
                      <th className="px-4 py-2 border">Duration</th>
                      {/* <th className="px-4 py-2 border">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {simulationHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-2 border">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 border">{entry.examName}</td>
                        <td className="px-4 py-2 border">{entry.score}%</td>
                        <td className="px-4 py-2 border">{entry.questionsAnswered}</td>
                        <td className="px-4 py-2 border">{entry.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No simulation history available.</p>
            )}
          </div>
        )}

        <div className="text-center py-8">
          <div className="mb-6">
            {selectedExam ? (
              <div>
                <h3 className="text-lg font-medium mb-2">Ready to take a {selectedExam} simulation?</h3>
                <p className="text-gray-600 mb-2">
                  This simulation will include {examConfig.totalQuestions} questions to be completed in{" "}
                  {examConfig.duration} minutes, mimicking the real exam format and timing.
                </p>
                <p className="text-gray-600 mb-4">
                  80% of questions are from core {selectedExam} topics, while 20% cover related subjects that often
                  appear on the exam.
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <AlertCircle className="mx-auto mb-2 text-yellow-500" size={36} />
                <p className="text-gray-600">
                  Please select a target exam in the calendar settings first to personalize your simulation.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={startSimulation}
            disabled={isLoading || !selectedExam}
            className={`px-6 py-3 rounded-lg text-white font-medium flex items-center justify-center mx-auto 
              ${selectedExam ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <Timer className="mr-2" size={20} />
                Start {selectedExam || "Exam"} Simulation
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (isSimulationComplete) {
    // Results screen
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6" id="exam-simulation">
        <h2 className="text-xl font-semibold mb-6">Simulation Results</h2>

        {simulationResults && (
          <div className="text-center py-4">
            <div className="mb-6">
              <div className="text-5xl font-bold text-blue-600">{simulationResults.percentage}%</div>
              <div className="text-lg mt-2">
                You answered {simulationResults.score} out of {simulationResults.totalQuestions} questions correctly
              </div>
              <div className="text-gray-600 mt-1">Time spent: {formatTime(simulationResults.timeSpent)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Strengths</h3>
                <p className="text-gray-600">
                  Analysis of your strong areas will appear here when this feature is fully implemented.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Areas for Improvement</h3>
                <p className="text-gray-600">
                  Recommendations for improvement will appear here when this feature is fully implemented.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-medium mb-4">Question Review</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {simulationQuestions.map((question, index) => {
                  const userAnswer = userAnswers.find((a) => a.questionId === question._id)

                  // Get the correct answer from either correctAnswer or answer property
                  const correctAnswer = question.correctAnswer || question.answer

                  // Check if the answer exists and process it
                  let isCorrect = false
                  if (userAnswer?.selectedAnswer && correctAnswer) {
                    const correctAnswerParts = correctAnswer.split(": ")
                    isCorrect =
                      userAnswer.selectedAnswer.startsWith(correctAnswerParts[0]) ||
                      (correctAnswerParts.length > 1 && userAnswer.selectedAnswer.includes(correctAnswerParts[1]))
                  }

                  return (
                    <div
                      key={question._id}
                      className={`p-4 rounded-lg border ${
                        userAnswer?.selectedAnswer
                          ? isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">Question {index + 1}</span>
                        {userAnswer?.selectedAnswer ? (
                          isCorrect ? (
                            <CheckCircle className="text-green-500" size={20} />
                          ) : (
                            <XCircle className="text-red-500" size={20} />
                          )
                        ) : (
                          <span className="text-gray-500">Not answered</span>
                        )}
                      </div>
                      <p className="my-2">{question.question || question.questionText}</p>
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-600">Your answer:</div>
                        <div className={isCorrect ? "text-green-600" : "text-red-600"}>
                          {userAnswer?.selectedAnswer || "None"}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="font-medium text-sm text-gray-600">Correct answer:</div>
                        <div className="text-green-600">{correctAnswer || "Not provided"}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button onClick={resetSimulation} className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700">
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Active simulation screen
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6" id="exam-simulation">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{selectedExam} Simulation</h2>
        <div className="flex items-center">
          <div className="text-gray-600 mr-4">
            {getAnsweredCount()}/{simulationQuestions.length} Answered
          </div>
          <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full flex items-center">
            <Timer className="mr-1" size={16} />
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {simulationQuestions.length > 0 && (
        <div>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                Question {currentQuestionIndex + 1} of {simulationQuestions.length}
              </span>
              {/* Show only subject and difficulty, NOT the question ID */}
              <span>
                {typeof simulationQuestions[currentQuestionIndex].subject === "string" &&
                !simulationQuestions[currentQuestionIndex].subject.includes("67")
                  ? simulationQuestions[currentQuestionIndex].subject
                  : "Subject"}{" "}
                • {simulationQuestions[currentQuestionIndex].difficulty}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / simulationQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">
              {simulationQuestions[currentQuestionIndex].question ||
                simulationQuestions[currentQuestionIndex].questionText}
            </h3>

            <div className="space-y-3">
              {simulationQuestions[currentQuestionIndex].options.map((option) => {
                const currentQuestion = simulationQuestions[currentQuestionIndex]
                const userAnswer = userAnswers.find((a) => a.questionId === currentQuestion._id)
                const isSelected = userAnswer?.selectedAnswer === option

                return (
                  <div
                    key={option}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors 
                      ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"}`}
                    onClick={() => handleAnswerSelection(option)}
                  >
                    {option}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center py-2 px-4 rounded 
                ${currentQuestionIndex === 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}
            >
              <ChevronLeft size={20} className="mr-1" />
              Previous
            </button>

            <div>
              {currentQuestionIndex === simulationQuestions.length - 1 ? (
                <button
                  onClick={submitSimulation}
                  className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700"
                >
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className="flex items-center text-blue-600 py-2 px-4 rounded hover:bg-blue-50"
                >
                  Next
                  <ChevronRight size={20} className="ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamSimulation

