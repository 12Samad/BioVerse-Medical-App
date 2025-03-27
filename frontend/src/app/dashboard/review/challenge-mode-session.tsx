"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import axios from "axios"
import { ArrowRight, CheckCircle, Clock, Flame, Timer, Trophy, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import type { SessionItem, SessionPerformance } from "./review-session"

// Challenge mode specific types
interface ChallengeScore {
  points: number
  timeBonus: number
  comboBonus: number
  totalScore: number
  currentCombo: number
  maxCombo: number
  correctAnswers: number
  totalQuestions: number
  averageTimePerQuestion: number
}

// Constants for scoring
const BASE_POINTS = 100
const MAX_TIME_BONUS = 100
const COMBO_MULTIPLIER = 0.1
const QUESTION_TIME_LIMIT = 30 // seconds

export default function ChallengeModeSession() {
  // Reuse session state from review-session
  const [session, setSession] = useState<{
    _id: string
    title: string
    items: SessionItem[]
    performance: SessionPerformance
  } | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  // Challenge mode specific state
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT)
  const [score, setScore] = useState<ChallengeScore>({
    points: 0,
    timeBonus: 0,
    comboBonus: 0,
    totalScore: 0,
    currentCombo: 0,
    maxCombo: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    averageTimePerQuestion: 0,
  })
  const [questionTimes, setQuestionTimes] = useState<number[]>([])
  const [timerActive, setTimerActive] = useState(false)

  const fetchSessionData = useCallback(async () => {
    try {
      setLoading(true)
      // Use the same API endpoint as regular review sessions
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/reviews/random`)

      // For demo purposes, if the API isn't implemented yet, we'll use mock data
      const mockSession = {
        _id: "challenge-session",
        title: "Challenge Mode",
        items: [
          {
            _id: "item1",
            itemType: "question",
            question: "What is the primary function of hemoglobin?",
            answer: "To transport oxygen from the lungs to the tissues",
            options: [
              "To transport oxygen from the lungs to the tissues",
              "To fight infections in the bloodstream",
              "To regulate blood glucose levels",
              "To maintain blood pressure",
            ],
            explanation:
              "Hemoglobin is a protein in red blood cells that binds to oxygen in the lungs and carries it to tissues throughout the body.",
          },
          {
            _id: "item2",
            itemType: "question",
            question: "Which of the following is NOT a symptom of myocardial infarction?",
            answer: "Increased urination",
            options: ["Chest pain", "Shortness of breath", "Increased urination", "Nausea and vomiting"],
            explanation:
              "Myocardial infarction (heart attack) typically presents with chest pain, shortness of breath, and nausea, but not increased urination.",
          },
          {
            _id: "item3",
            itemType: "question",
            question:
              "A 45-year-old patient presents with sudden onset of severe headache, stiff neck, and photophobia. What is the most likely diagnosis?",
            answer: "Meningitis",
            options: ["Migraine", "Meningitis", "Tension headache", "Cluster headache"],
            explanation:
              "The triad of severe headache, stiff neck, and photophobia is classic for meningitis, an inflammation of the meninges surrounding the brain and spinal cord.",
          },
          {
            _id: "item4",
            itemType: "question",
            question: "Which enzyme is responsible for converting angiotensin I to angiotensin II?",
            answer: "Angiotensin-converting enzyme (ACE)",
            options: ["Renin", "Angiotensin-converting enzyme (ACE)", "Aldosterone synthase", "Angiotensinogen"],
            explanation:
              "ACE converts the inactive angiotensin I to the active angiotensin II, which is a potent vasoconstrictor.",
          },
          {
            _id: "item5",
            itemType: "question",
            question:
              "Which of the following antibiotics inhibits bacterial protein synthesis by binding to the 50S ribosomal subunit?",
            answer: "Erythromycin",
            options: ["Ciprofloxacin", "Erythromycin", "Penicillin", "Sulfamethoxazole"],
            explanation:
              "Erythromycin is a macrolide antibiotic that binds to the 50S ribosomal subunit, inhibiting bacterial protein synthesis.",
          },
        ],
        performance: {
          totalQuestions: 5,
          correctAnswers: 0,
        },
      }

      setSession(response.data || mockSession)
      setLoading(false)

      // Start the timer for the first question
      setTimeRemaining(QUESTION_TIME_LIMIT)
      setTimerActive(true)
    } catch (error) {
      console.error("Error fetching session:", error)
      // Use mock data if API fails
      setSession({
        _id: "challenge-session",
        title: "Challenge Mode",
        items: [
          {
            _id: "item1",
            itemType: "question",
            question: "What is the primary function of hemoglobin?",
            answer: "To transport oxygen from the lungs to the tissues",
            options: [
              "To transport oxygen from the lungs to the tissues",
              "To fight infections in the bloodstream",
              "To regulate blood glucose levels",
              "To maintain blood pressure",
            ],
            explanation:
              "Hemoglobin is a protein in red blood cells that binds to oxygen in the lungs and carries it to tissues throughout the body.",
          },
          {
            _id: "item2",
            itemType: "question",
            question: "Which of the following is NOT a symptom of myocardial infarction?",
            answer: "Increased urination",
            options: ["Chest pain", "Shortness of breath", "Increased urination", "Nausea and vomiting"],
            explanation:
              "Myocardial infarction (heart attack) typically presents with chest pain, shortness of breath, and nausea, but not increased urination.",
          },
          {
            _id: "item3",
            itemType: "question",
            question:
              "A 45-year-old patient presents with sudden onset of severe headache, stiff neck, and photophobia. What is the most likely diagnosis?",
            answer: "Meningitis",
            options: ["Migraine", "Meningitis", "Tension headache", "Cluster headache"],
            explanation:
              "The triad of severe headache, stiff neck, and photophobia is classic for meningitis, an inflammation of the meninges surrounding the brain and spinal cord.",
          },
        ],
        performance: {
          totalQuestions: 3,
          correctAnswers: 0,
        },
      })
      setLoading(false)
      toast.error("Failed to load challenge session")

      // Start the timer for the first question
      setTimeRemaining(QUESTION_TIME_LIMIT)
      setTimerActive(true)
    }
  }, [])

  useEffect(() => {
    fetchSessionData()

    // Cleanup timer on unmount
    return () => {
      setTimerActive(false)
    }
  }, [fetchSessionData])

  // Timer effect
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null

    if (timerActive && timeRemaining > 0) {
      timerId = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up for this question
            clearInterval(timerId as NodeJS.Timeout)
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [timerActive, timeRemaining])

  const handleTimeUp = () => {
    if (!session) return

    // const currentItem = session.items[currentItemIndex]

    // Record that time ran out (no answer selected)
    const timeTaken = QUESTION_TIME_LIMIT
    setQuestionTimes((prev) => [...prev, timeTaken])

    // Reset combo since time ran out
    setScore((prev) => ({
      ...prev,
      currentCombo: 0,
      totalQuestions: prev.totalQuestions + 1,
    }))

    // Move to next question or complete the session
    if (currentItemIndex < session.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
      setTimeRemaining(QUESTION_TIME_LIMIT)
    } else {
      completeSession()
    }
  }

  const handleAnswer = (itemId: string, answer: string) => {
    if (!session) return

    // Stop the timer
    setTimerActive(false)

    // Calculate time taken to answer
    const timeTaken = QUESTION_TIME_LIMIT - timeRemaining
    setQuestionTimes((prev) => [...prev, timeTaken])

    // Record the answer
    setUserAnswers({
      ...userAnswers,
      [itemId]: answer,
    })

    const currentItem = session.items[currentItemIndex]
    const isCorrect = answer === currentItem.answer

    // Calculate score for this question
    const basePoints = isCorrect ? BASE_POINTS : 0
    const timeBonus = isCorrect ? Math.round(MAX_TIME_BONUS * (timeRemaining / QUESTION_TIME_LIMIT)) : 0

    // Update combo
    const newCombo = isCorrect ? score.currentCombo + 1 : 0
    const maxCombo = Math.max(score.maxCombo, newCombo)

    // Calculate combo bonus
    const comboBonus = isCorrect && newCombo > 1 ? Math.round(basePoints * (newCombo * COMBO_MULTIPLIER)) : 0

    // Update total score
    const questionScore = basePoints + timeBonus + comboBonus

    setScore((prev) => ({
      points: prev.points + basePoints,
      timeBonus: prev.timeBonus + timeBonus,
      comboBonus: prev.comboBonus + comboBonus,
      totalScore: prev.totalScore + questionScore,
      currentCombo: newCombo,
      maxCombo,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      totalQuestions: prev.totalQuestions + 1,
      averageTimePerQuestion: 0, // Will calculate at the end
    }))
  }

  const moveToNext = () => {
    if (!session) return

    // Move to next question or complete the session
    if (currentItemIndex < session.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
      setTimeRemaining(QUESTION_TIME_LIMIT)
      setTimerActive(true)
    } else {
      completeSession()
    }
  }

  const completeSession = async () => {
    try {
      if (!session) return

      // Calculate final stats
      const averageTime =
        questionTimes.length > 0 ? questionTimes.reduce((sum, time) => sum + time, 0) / questionTimes.length : 0

      setScore((prev) => ({
        ...prev,
        averageTimePerQuestion: Math.round(averageTime * 10) / 10,
      }))

      // Prepare the payload for the API
      const challengeResult = {
        userId: localStorage.getItem("Medical_User_Id"),
        sessionId: session._id,
        score: {
          ...score,
          averageTimePerQuestion: Math.round(averageTime * 10) / 10,
        },
        answers: userAnswers,
        completedAt: new Date().toISOString(),
      }

      // Submit challenge results
      await axios.post(`https://medical-backend-loj4.onrender.com/api/reviews/challenge/complete`, challengeResult)

      setCompleted(true)
      toast.success("Challenge completed!")
    } catch (error) {
      console.error("Error completing challenge:", error)

      // Still show completion screen even if API fails
      setCompleted(true)
      toast.error("Failed to save challenge results")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading challenge...</h2>
          <Progress value={100} className="w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (completed && session) {
    // Show completion screen with challenge results
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Challenge Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="text-5xl font-bold mb-2">{score.totalScore}</div>
              <p className="text-xl text-muted-foreground">Total Score</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{score.points}</div>
                <p className="text-sm text-muted-foreground">Base Points</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{score.timeBonus}</div>
                <p className="text-sm text-muted-foreground">Time Bonus</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{score.comboBonus}</div>
                <p className="text-sm text-muted-foreground">Combo Bonus</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Performance Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                    <p className="font-medium">
                      {score.correctAnswers} of {score.totalQuestions}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Max Combo</p>
                    <p className="font-medium">{score.maxCombo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Time per Question</p>
                    <p className="font-medium">{score.averageTimePerQuestion}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="font-medium">
                      {score.totalQuestions > 0 ? Math.round((score.correctAnswers / score.totalQuestions) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-lg">Question Breakdown</h3>
              <ul className="space-y-2">
                {session.items.map((item, index) => {
                  const userAnswer = userAnswers[item._id]
                  const isCorrect = userAnswer === item.answer
                  const timeTaken = questionTimes[index] || QUESTION_TIME_LIMIT

                  return (
                    <li key={item._id} className="flex items-start gap-2 p-3 rounded-md border">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Question {index + 1}: {item.question}
                        </p>
                        {userAnswer ? (
                          <p className="text-sm text-muted-foreground">Your answer: {userAnswer}</p>
                        ) : (
                          <p className="text-sm text-red-500">Time expired - No answer</p>
                        )}
                        {(!isCorrect || !userAnswer) && (
                          <p className="text-sm text-green-600">Correct answer: {item.answer}</p>
                        )}
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Time: {timeTaken}s
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => (window.location.href = "/dashboard/review")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Safety check to make sure session is loaded
  if (!session) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session not found</h2>
          <Button onClick={() => (window.location.href = "/dashboard/review")}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  // Show current challenge question
  const currentItem = session.items[currentItemIndex]
  const progress = ((currentItemIndex + 1) / session.items.length) * 100

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Challenge Mode
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {currentItemIndex + 1} of {session.items.length}
            </div>
          </div>
          <Progress value={progress} className="mt-2" />

          {/* Score display */}
          <div className="flex justify-between items-center mt-4 text-sm">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span>Score: {score.totalScore}</span>
            </div>
            {score.currentCombo > 1 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="h-4 w-4" />
                <span>Combo: x{score.currentCombo}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Timer */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span className="font-medium">Time Remaining:</span>
            </div>
            <div className={`font-bold text-lg ${timeRemaining <= 5 ? "text-red-500 animate-pulse" : ""}`}>
              {timeRemaining}s
            </div>
          </div>

          {/* Progress bar for timer */}
          <Progress
            value={(timeRemaining / QUESTION_TIME_LIMIT) * 100}
            className={`h-2 ${timeRemaining <= 5 ? "bg-red-200" : ""}`}
          />

          <div>
            <h3 className="text-lg font-medium mb-4">{currentItem.question}</h3>

            <RadioGroup
              value={userAnswers[currentItem._id] || ""}
              onValueChange={(value) => handleAnswer(currentItem._id, value)}
              className="space-y-3"
              disabled={!!userAnswers[currentItem._id]}
            >
              {currentItem.options.map((option) => (
                <div
                  key={option}
                  className={`flex items-center space-x-2 rounded-md border p-3 hover:bg-muted ${
                    userAnswers[currentItem._id] === option && option === currentItem.answer
                      ? "bg-green-50 border-green-200"
                      : userAnswers[currentItem._id] === option && option !== currentItem.answer
                        ? "bg-red-50 border-red-200"
                        : ""
                  }`}
                >
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            {userAnswers[currentItem._id] && (
              <div className="flex items-center gap-2">
                {userAnswers[currentItem._id] === currentItem.answer ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600">Correct! +{BASE_POINTS} points</span>
                    {timeRemaining > 0 && (
                      <span className="text-blue-500 ml-2">
                        Time Bonus: +{Math.round(MAX_TIME_BONUS * (timeRemaining / QUESTION_TIME_LIMIT))}
                      </span>
                    )}
                    {score.currentCombo > 1 && (
                      <span className="text-orange-500 ml-2">
                        Combo x{score.currentCombo}: +
                        {Math.round(BASE_POINTS * (score.currentCombo * COMBO_MULTIPLIER))}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-600">Incorrect. The answer is: {currentItem.answer}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button onClick={moveToNext} disabled={!userAnswers[currentItem._id] && timeRemaining > 0} className="w-full">
            {currentItemIndex === session.items.length - 1 ? "Complete Challenge" : "Next Question"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

