"use client"

import type React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import axios from "axios"
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"
import { AlertCircle, Brain, CheckCircle, Clock, Loader2, Share2, Sparkles } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Doughnut } from "react-chartjs-2"
import toast, { Toaster } from "react-hot-toast"

ChartJS.register(ArcElement, Tooltip, Legend)

type TestSummaryProps = {
  questions: {
    _id: string
    question: string
    answer: string
    explanation?: string
    subject?: string
    subsection?: string
  }[]
  selectedAnswers: { [key: number]: string }
  questionTimes: { [key: number]: number }
  score: number
  totalTime: number
  isAIGenerated?: boolean
  aiTopic?: string
}

const TestSummary: React.FC<TestSummaryProps> = ({ 
  questions, 
  selectedAnswers, 
  questionTimes, 
  score, 
  totalTime,
  isAIGenerated = false,
  aiTopic = ""
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // AI Feedback states
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  // Check if this was a recommended test
  const isRecommendedTest = searchParams.get("isRecommendedTest") === "true"

  const percentage = (score / questions.length) * 100
  const incorrectCount = questions.length - score

  const chartData = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [score, incorrectCount],
        backgroundColor: ["#4ade80", "#f87171"],
        hoverBackgroundColor: ["#22c55e", "#ef4444"],
      },
    ],
  }

  // Fetch AI feedback when component mounts
  useEffect(() => {
    const fetchAIFeedback = async () => {
      setIsLoadingFeedback(true)
      setFeedbackError(null)

      try {
        // Prepare data for the AI feedback request
        const feedbackData = {
          questions: questions.map((q, index) => ({
            questionId: q._id,
            questionText: q.question,
            correctAnswer: q.answer,
            userAnswer: selectedAnswers[index] || "",
            timeSpent: questionTimes[index] || 0,
            topic: isAIGenerated ? aiTopic : (q.subsection || q.subject || "")
          })),
          score,
          totalTime,
          percentage,
          topic: isAIGenerated ? aiTopic : "" // Include AI topic when applicable
        }

        // Call the new AI feedback endpoint
        const response = await axios.post(
          "https://medical-backend-loj4.onrender.com/api/test/ai-report-feedback",
          feedbackData
        )

        setAiFeedback(response.data.feedback)
      } catch (error) {
        console.error("Error fetching AI feedback:", error)
        setFeedbackError("Unable to load AI feedback at this time")
      } finally {
        setIsLoadingFeedback(false)
      }
    }

    // Only fetch feedback if we have at least one question
    if (questions.length > 0) {
      fetchAIFeedback()
    }
  }, [questions, selectedAnswers, questionTimes, score, totalTime, percentage, isAIGenerated, aiTopic])

  const handleSubmitResults = async () => {
    setLoading(true)
    setError(null)

    const testData = {
      userId: localStorage.getItem("Medical_User_Id"), // Ensure this is set when user logs in
      questions: questions.map((q, index) => ({
        questionId: q._id,
        questionText: q.question,
        correctAnswer: q.answer,
        userAnswer: selectedAnswers[index] || "",
        timeSpent: questionTimes[index] || 0,
      })),
      score,
      totalTime,
      percentage,
      isRecommendedTest, // Include flag to indicate if this was a recommended test
      isAIGenerated, // Add flag for AI-generated tests
      aiTopic, // Include the AI topic when applicable
    }

    try {
      const response = await axios.post("https://medical-backend-loj4.onrender.com/api/test/take-test/submit-test", testData, {
        headers: { "Content-Type": "application/json" },
      })

      if (response.status !== 201) {
        throw new Error("Failed to submit test results")
      }

      toast.success("Test Saved Successfully! 🎉")

      setTimeout(() => {
        router.push("/dashboard")
      }, 4500)
    } catch (err) {
      console.error("Error submitting test results:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-8">
        {isAIGenerated ? `AI-Generated Test Results: ${aiTopic}` : 
         isRecommendedTest ? "Recommended Test Results" : 
         "Test Results"}
      </h1>

      {/* AI Generated Test Banner */}
      {isAIGenerated && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center">
            <Brain className="mr-2" size={20} />
            AI-Generated Test: {aiTopic}
          </h2>
          <p className="text-sm text-blue-600">
            This test was custom-generated by AI focusing on key concepts in {aiTopic}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Score Overview</CardTitle>
            <CardDescription>Your performance at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-primary">
                {score}/{questions.length}
              </p>
              <p className="text-xl">{percentage.toFixed(2)}%</p>
            </div>
            <div className="w-48 h-48 mx-auto">
              <Doughnut data={chartData} />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Total time: {Math.floor(totalTime / 60)} minutes {totalTime % 60} seconds
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>What would you like to do next?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handleSubmitResults} disabled={loading} className="w-full">
                <CheckCircle className="mr-2" />
                {loading ? "Submitting..." : "Save Results"}
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full">
                <Share2 className="mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Feedback Card */}
      <Card className={`mb-8 border-t-4 ${isAIGenerated ? 'border-t-blue-500' : 'border-t-purple-500'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center">
            {isAIGenerated ? (
              <Brain className="mr-2 h-5 w-5 text-blue-500" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
            )}
            <CardTitle>
              {isAIGenerated 
                ? `AI Analysis: ${aiTopic} Performance`
                : "AI Feedback on Your Performance"}
            </CardTitle>
          </div>
          <CardDescription>
            {isAIGenerated 
              ? `Personalized insights on your ${aiTopic} knowledge`
              : "Personalized insights and recommendations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFeedback ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`h-8 w-8 animate-spin ${isAIGenerated ? 'text-blue-500' : 'text-purple-500'}`} />
              <span className="ml-3 text-gray-600">Generating your personalized feedback...</span>
            </div>
          ) : feedbackError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{feedbackError}</AlertDescription>
            </Alert>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {aiFeedback ? (
                <div dangerouslySetInnerHTML={{ __html: aiFeedback.replace(/\n/g, '<br/>') }} />
              ) : (
                <p>No feedback available at this time.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Switch id="show-incorrect" checked={showIncorrectOnly} onCheckedChange={setShowIncorrectOnly} />
          <Label htmlFor="show-incorrect">Show incorrect answers only</Label>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const userAnswer = selectedAnswers[index] || ""
          const isCorrect = userAnswer === question.answer
          const timeSpent = questionTimes[index] || 0

          if (showIncorrectOnly && isCorrect) return null

          return (
            <Card key={question._id}>
              <CardHeader>
                <CardTitle>Question {index + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {userAnswer || "No answer"}
                      </span>
                    </p>
                    <p className="mb-2">
                      Correct answer: <span className="text-green-600 font-semibold">{question.answer}</span>
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center">
                      <Clock className="mr-2" size={18} />
                      Time spent: {timeSpent} seconds
                    </p>
                    <p className="flex items-center mt-2">
                      {isCorrect ? (
                        <CheckCircle className="mr-2 text-green-500" size={18} />
                      ) : (
                        <AlertCircle className="mr-2 text-red-500" size={18} />
                      )}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </p>
                  </div>
                </div>

                {!isCorrect && question.explanation && (
                  <div className="mt-4 p-4 bg-amber-50 rounded">
                    <h4 className="font-semibold mb-2">Explanation:</h4>
                    <p>{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default TestSummary