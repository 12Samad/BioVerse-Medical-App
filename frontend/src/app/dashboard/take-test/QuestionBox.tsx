"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import axios from "axios"
import { AlertCircle, BarChart, Medal, MoveRight, ScrollText, Sparkles } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"

type QuestionAnalytics = {
  totalAttempts: number
  avgResponseTime: number
  correctPercentage: number
}

type QuestionBoxProps = {
  question: {
    _id: string
    question: string
    options: string[]
    answer: string
    explanation: string
  }
  selectedAnswer: string | undefined
  onAnswerSelect: (answer: string) => void
  questionNumber: number
  totalQuestions: number
  showCorrectAnswer: boolean
  onSubmit: () => void
}

const QuestionBox: React.FC<QuestionBoxProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  questionNumber,
  totalQuestions,
  showCorrectAnswer,
  onSubmit,
}) => {
  const [analytics, setAnalytics] = useState<QuestionAnalytics | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [isExplanationVisible, setIsExplanationVisible] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  // AI Explanation states
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [isLoadingAiExplanation, setIsLoadingAiExplanation] = useState(false)
  const [aiExplanationError, setAiExplanationError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (showCorrectAnswer) {
        setIsLoadingAnalytics(true)
        setAnalyticsError(null)

        // Check if this is a recommended question (starts with 'rec-')
        if (question._id.startsWith('rec-')) {
          // Provide default analytics for recommended questions
          setTimeout(() => {
            setAnalytics({
              totalAttempts: 1,
              avgResponseTime: 30,
              correctPercentage: 50
            });
            setIsLoadingAnalytics(false);
          }, 500); // Small delay to simulate loading
          return;
        }

        try {
          const response = await axios.get(
            `https://medical-backend-loj4.onrender.com/api/test/take-test/question-analytics/${question._id}`,
          )
          setAnalytics(response.data)
        } catch (error) {
          console.error("Error fetching question analytics:", error)
          setAnalyticsError("Failed to load question analytics")
        } finally {
          setIsLoadingAnalytics(false)
        }
      }
    }

    fetchAnalytics()
  }, [showCorrectAnswer, question._id])

  // Fetch AI explanation when answer is shown
  useEffect(() => {
    const fetchAiExplanation = async () => {
      if (showCorrectAnswer) {
        setIsLoadingAiExplanation(true)
        setAiExplanationError(null)

        try {
          // Call your backend API that will use OpenAI
          const response = await axios.post(
            `https://medical-backend-loj4.onrender.com/api/test/ai-explain`,
            {
              question: question.question,
              options: question.options,
              correctAnswer: question.answer,
              userAnswer: selectedAnswer || "No answer provided"
            }
          )

          setAiExplanation(response.data.explanation)
        } catch (error) {
          console.error("Error fetching AI explanation:", error)
          setAiExplanationError("Failed to load AI explanation")
        } finally {
          setIsLoadingAiExplanation(false)
        }
      }
    }

    fetchAiExplanation()
  }, [showCorrectAnswer, question, selectedAnswer])

  useEffect(() => {
    if (showCorrectAnswer) {
      setIsExplanationVisible(true)
      setShowPopup(true)
      // const timer = setTimeout(() => setShowPopup(false), 3000)
      // return () => clearTimeout(timer)
    }
  }, [showCorrectAnswer])

  useEffect(() => {
    setIsExplanationVisible(false)
  }, [])

  const toggleExplanation = () => {
    setIsExplanationVisible(!isExplanationVisible)
    setShowPopup(false)
  }

  const isCorrect = selectedAnswer === question.answer

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[400px] overflow-x-hidden">
      {/* Left Column - Question */}
      <div className="flex-1 bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-700">
            Question {questionNumber} of {totalQuestions}
          </h2>
          <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Medical Question</span>
        </div>

        <div className="space-y-6">
          <p className="text-lg text-slate-800 leading-relaxed">{question.question}</p>

          <RadioGroup value={selectedAnswer} onValueChange={onAnswerSelect} disabled={showCorrectAnswer}>
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${selectedAnswer === option
                    ? showCorrectAnswer
                      ? option === question.answer
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-red-500 bg-red-50"
                      : "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-200 hover:bg-blue-50"
                  }
                `}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="h-5 w-5" />
                <Label htmlFor={`option-${index}`} className="flex-1 text-base text-slate-700">
                  {option}
                </Label>
                {showCorrectAnswer && option === question.answer && <Medal className="h-5 w-5 text-emerald-500" />}
              </label>
            ))}
          </RadioGroup>

          <div className="flex flex-wrap gap-4 mt-8">
            {!showCorrectAnswer ? (
              <Button onClick={onSubmit} disabled={!selectedAnswer} className="gap-2">
                Submit Answer
                <MoveRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                {/* <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setIsExplanationVisible(false)
                    // Call your existing next question handler here
                  }}
                >
                  Next Question
                  <MoveRight className="h-4 w-4" />
                </Button> */}
                <div className="relative flex items-center">
                  <Button
                    onClick={toggleExplanation}
                    variant="ghost"
                    className={`
                      p-2 rounded-full transition-all duration-500 h-10 w-10
                      ${isExplanationVisible
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }
                    `}
                  >
                    <ScrollText className="h-5 w-5" />
                  </Button>
                  {showPopup && (
                    <div className="left-full ml-2 bg-blue-500 text-white text-xs py-1 px-2 rounded whitespace-nowrap animate-bounce">
                      Show explanation
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Explanation and Analytics */}
      <div
        className={`w-full lg:w-[400px] rounded-xl shadow-md overflow-hidden transition-all duration-300 ease-in-out relative
    ${isExplanationVisible
            ? "max-h-[800px] opacity-100 transform-none"
            : "max-h-0 opacity-0 lg:opacity-100 lg:max-h-full lg:translate-x-[150%]"
          }
  `}
      >
        {/* Subtle pattern background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-amber-100/50">
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23925103' fill-opacity='0.15' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="relative h-full p-6 overflow-y-auto">
          {showCorrectAnswer && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-lg backdrop-blur-sm bg-opacity-90 ${isCorrect ? "bg-emerald-50/90 text-emerald-700" : "bg-amber-50/90 text-amber-700"
                  }`}
              >
                <p className="font-medium">
                  {isCorrect ? "Excellent! That's correct." : "Let's review the correct answer:"}
                </p>
                <p className="mt-2 font-semibold">{question.answer}</p>
              </div>

              {question.explanation && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    <h4 className="font-semibold">Detailed Explanation</h4>
                  </div>
                  <div className="pl-4 border-l-2 border-amber-200">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Explanation Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-800">
                  <Sparkles className="h-5 w-5" />
                  <h4 className="font-semibold">AI Explanation</h4>
                </div>
                <div className="pl-4 border-l-2 border-purple-200">
                  {isLoadingAiExplanation ? (
                    <div className="text-slate-600 backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                      Loading AI explanation...
                    </div>
                  ) : aiExplanationError ? (
                    <div className="text-red-500 backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                      {aiExplanationError}
                    </div>
                  ) : (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line backdrop-blur-sm bg-white/20 p-4 rounded-lg">
                      {aiExplanation || "No AI explanation available"}
                    </p>
                  )}
                </div>
              </div>

              <Card className="mt-6 bg-white/60 backdrop-blur-md border-white/40 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <BarChart className="mr-2 h-5 w-5" />
                    Question Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics && <p>Loading analytics...</p>}
                  {analyticsError && <p className="text-red-500">{analyticsError}</p>}
                  {analytics && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Attempts</span>
                          <span className="font-medium">{analytics.totalAttempts}</span>
                        </div>
                        <Progress value={analytics.totalAttempts} max={100} className="h-2 bg-amber-100/50" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average Response Time</span>
                          <span className="font-medium">{analytics.avgResponseTime.toFixed(2)}s</span>
                        </div>
                        <Progress
                          value={Math.min(analytics.avgResponseTime, 60)}
                          max={60}
                          className="h-2 bg-amber-100/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Correct Answer Rate</span>
                          <span className="font-medium">{analytics.correctPercentage.toFixed(2)}%</span>
                        </div>
                        <Progress value={analytics.correctPercentage} max={100} className="h-2 bg-amber-100/50" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionBox