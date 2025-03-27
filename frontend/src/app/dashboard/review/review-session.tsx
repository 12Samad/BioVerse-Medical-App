"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import axios from "axios"
import { ArrowRight, CheckCircle, Clock, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { AutoFlashcardGenerator } from "./auto-flashcard-generator"

// types/Session.ts

/**
 * Represents a single item in a medical review session
 */
export interface SessionItem {
  _id: string
  itemType: "flashcard" | "question" | "case_study"
  question: string
  answer: string
  options: string[]
  explanation?: string
  difficulty?: "easy" | "medium" | "hard"
  specialty?: string
  topic?: string
  subtopics?: string[]
  skipped?: boolean
}

/**
 * Tracks user performance in a session
 */
export interface SessionPerformance {
  totalQuestions: number
  correctAnswers: number
  skippedQuestions?: number
}

interface Session {
  _id: string
  title: string
  type: "daily" | "weekly" | "custom"
  stage: number
  items: SessionItem[]
  performance: SessionPerformance
}

// Type for the simple answer map to track user answers
type UserAnswersMap = Record<string, string>
// Type for difficulty ratings
type DifficultyRatingsMap = Record<string, number>

// Props type for the component
interface ReviewSessionProps {
  params: string | undefined
}

export default function ReviewSession({ params }: ReviewSessionProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswersMap>({})
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null)
  const [difficultyRatings, setDifficultyRatings] = useState<DifficultyRatingsMap>({})
  const [incorrectItems, setIncorrectItems] = useState<SessionItem[]>([])
  const [flashcardsCreated, setFlashcardsCreated] = useState(false)
  const [skippedItems, setSkippedItems] = useState<SessionItem[]>([])
  const [reviewingSkipped, setReviewingSkipped] = useState(false)

  const fetchSessionData = useCallback(async () => {
    try {
      setLoading(true)
      // In a real app, you would fetch the actual session data with the items to review
      const response = await axios.get<Session>(`https://medical-backend-loj4.onrender.com/api/reviews/random`)
      // For demo purposes, if the API isn't implemented yet, we'll use mock data
      const mockSession: Session = {
        _id: "",
        title: "Medical Review Session",
        type: "daily",
        stage: 1,
        items: [
          {
            _id: "item1",
            itemType: "flashcard",
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
            itemType: "case_study",
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
      }

      setSession(response.data || mockSession)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching session:", error)
      // Use mock data if API fails
      setSession({
        _id: params || "",
        title: "Medical Review Session",
        type: "daily",
        stage: 1,
        items: [
          {
            _id: "item1",
            itemType: "flashcard",
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
            itemType: "case_study",
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
      toast.error("Failed to load review session")
    }
  }, [params])

  useEffect(() => {
    fetchSessionData()
  }, [fetchSessionData])

  const handleAnswer = (itemId: string, answer: string) => {
    setUserAnswers({
      ...userAnswers,
      [itemId]: answer,
    })
  }

  const handleDifficultyRating = (itemId: string, rating: number) => {
    setDifficultyRatings({
      ...difficultyRatings,
      [itemId]: rating,
    })
  }

  const isLastItem = (): boolean => {
    if (!session) return false

    // If we're reviewing skipped items, check if this is the last skipped item
    if (reviewingSkipped) {
      return currentItemIndex === skippedItems.length - 1
    }

    // Otherwise check if this is the last regular item
    return currentItemIndex === session.items.length - 1
  }

  const moveToNext = () => {
    if (!session) return

    // Get the current item (either from regular items or skipped items)
    const currentItem = reviewingSkipped ? skippedItems[currentItemIndex] : session.items[currentItemIndex]

    const userAnswer = userAnswers[currentItem._id]

    if (userAnswer !== currentItem.answer) {
      setIncorrectItems((prev) => [...prev, currentItem])
    }

    if (isLastItem()) {
      // If we're reviewing regular items and there are skipped items to review
      if (!reviewingSkipped && skippedItems.length > 0) {
        setReviewingSkipped(true)
        setCurrentItemIndex(0)
        toast(`Now reviewing ${skippedItems.length} skipped questions`, {
          icon: "⏱️",
          duration: 3000,
        })
      } else {
        // Otherwise complete the session
        completeSession()
      }
    } else {
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }

  const reviewLater = () => {
    if (!session) return

    // Get the current item
    const currentItem = session.items[currentItemIndex]

    // Add to skipped items if not already skipped
    if (!skippedItems.some((item) => item._id === currentItem._id)) {
      const itemWithSkippedFlag = { ...currentItem, skipped: true }
      setSkippedItems((prev) => [...prev, itemWithSkippedFlag])

      toast.success("Question marked for review later", {
        icon: "⏱️",
        duration: 2000,
      })
    }

    // Move to the next question
    if (isLastItem()) {
      // If this is the last regular item and there are skipped items to review
      if (!reviewingSkipped && skippedItems.length > 0) {
        setReviewingSkipped(true)
        setCurrentItemIndex(0)
        toast(`Now reviewing ${skippedItems.length} skipped questions`, {
          icon: "⏱️",
          duration: 3000,
        })
      } else {
        // Otherwise complete the session
        completeSession()
      }
    } else {
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }

  const completeSession = async () => {
    try {
      if (!session) return

      // Calculate performance
      let correctAnswers = 0
      const incorrectItemsList: SessionItem[] = []

      // Process regular items
      session.items.forEach((item) => {
        if (userAnswers[item._id] === item.answer) {
          correctAnswers++
        } else if (userAnswers[item._id]) {
          // Only count as incorrect if an answer was provided
          if (!incorrectItems.some((i) => i._id === item._id)) {
            incorrectItemsList.push(item)
          }
        }
      })

      // Process skipped items
      skippedItems.forEach((item) => {
        if (userAnswers[item._id] === item.answer) {
          correctAnswers++
        } else if (userAnswers[item._id]) {
          // Only count as incorrect if an answer was provided
          if (!incorrectItems.some((i) => i._id === item._id)) {
            incorrectItemsList.push(item)
          }
        }
      })

      // Update incorrect items for flashcard generation
      if (incorrectItemsList.length > 0) {
        setIncorrectItems((prev) => [...prev, ...incorrectItemsList])
      }

      const totalAnswered = Object.keys(userAnswers).length
      const totalQuestions = session.items.length + skippedItems.length
      const skippedCount = totalQuestions - totalAnswered

      const performance: SessionPerformance = {
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        skippedQuestions: skippedCount,
      }

      const userId = localStorage.getItem("Medical_User_Id")

      // Prepare the payload for the API
      interface CompletionPayload {
        performance: SessionPerformance
        difficultyRatings: DifficultyRatingsMap
        skippedItems?: SessionItem[]
      }

      interface CompletionResponse {
        nextReview?: string
        // Add other expected response fields here
      }

      // Submit session completion
      const response = await axios.post<CompletionResponse>(
        `https://medical-backend-loj4.onrender.com/api/reviews/${params}/complete?userId=${userId}`,
        {
          performance,
          difficultyRatings,
          skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
        } as CompletionPayload,
      )

      // For demo purposes, if the API isn't implemented yet
      const mockNextReview = new Date()
      if (correctAnswers / totalQuestions >= 0.8) {
        // Good performance - move to next stage
        mockNextReview.setDate(mockNextReview.getDate() + 7) // Stage 2
      } else if (correctAnswers / totalQuestions >= 0.6) {
        // Average performance - stay at current stage
        mockNextReview.setDate(mockNextReview.getDate() + 1) // Stage 1
      } else {
        // Poor performance - repeat sooner
        mockNextReview.setHours(mockNextReview.getHours() + 12) // Repeat sooner
      }

      setNextReviewDate(response?.data?.nextReview || mockNextReview.toISOString())
      setCompleted(true)
      toast.success("Review session completed!")
    } catch (error) {
      console.error("Error completing session:", error)
      toast.error("Failed to complete review session")

      // For demo purposes, show completion screen anyway
      const mockNextReview = new Date()
      mockNextReview.setDate(mockNextReview.getDate() + 1)
      setNextReviewDate(mockNextReview.toISOString())
      setCompleted(true)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading review session...</h2>
          <Progress value={100} className="w-64 mx-auto" />
        </div>
      </div>
    )
  }

  if (completed && session) {
    // Show completion screen
    const answeredItems = [...session.items, ...skippedItems].filter((item) => userAnswers[item._id])
    const correctAnswers = answeredItems.filter((item) => userAnswers[item._id] === item.answer).length
    const totalAnswered = answeredItems.length
    const totalQuestions = session.items.length + skippedItems.length
    const score = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0

    return (
      <div className="container mx-auto py-12">
        {/* Render the AutoFlashcardGenerator component with incorrect items */}
        <AutoFlashcardGenerator
          incorrectItems={incorrectItems}
          onFlashcardsCreated={() => setFlashcardsCreated(true)}
        />

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Review Session Completed!</CardTitle>
            <CardDescription>You&apos;ve completed your review session. Here&apos;s how you did:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6">
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <p className="text-muted-foreground">
                {correctAnswers} correct out of {totalAnswered} questions answered
              </p>
              {totalQuestions - totalAnswered > 0 && (
                <p className="text-muted-foreground mt-1">({totalQuestions - totalAnswered} questions skipped)</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Performance Breakdown:</h3>
              <ul className="space-y-2">
                {[...session.items, ...skippedItems]
                  .filter((item) => userAnswers[item._id])
                  .map((item, index) => {
                    const isCorrect = userAnswers[item._id] === item.answer
                    const wasSkipped = skippedItems.some((skipped) => skipped._id === item._id)

                    return (
                      <li key={item._id} className="flex items-start gap-2 p-2 rounded-md border">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              Question {index + 1}: {item.question}
                            </p>
                            {wasSkipped && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Reviewed Later
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Your answer: {userAnswers[item._id]}</p>
                          {!isCorrect && <p className="text-sm text-green-600">Correct answer: {item.answer}</p>}
                          {!isCorrect && item.explanation && (
                            <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                              <span className="font-medium">Explanation:</span> {item.explanation}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
              </ul>
            </div>

            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Next Review:</h3>
              <p>Based on your performance, your next review is scheduled for:</p>
              <p className="font-bold mt-1">{nextReviewDate ? new Date(nextReviewDate).toLocaleString() : "Soon"}</p>
            </div>

            {incorrectItems.length > 0 && (
              <div className="rounded-md bg-primary/10 p-4 border border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📝</span>
                  <div>
                    <h3 className="font-medium">Flashcards Created</h3>
                    <p className="text-sm text-muted-foreground">
                      {flashcardsCreated
                        ? `${incorrectItems.filter((item) => item.explanation).length} flashcards were created from questions you missed.`
                        : "Flashcards are being created from questions you missed..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
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

  // Show current review item (either from regular items or skipped items)
  const currentItem = reviewingSkipped ? skippedItems[currentItemIndex] : session.items[currentItemIndex]

  // Calculate progress based on whether we're reviewing regular or skipped items
  const totalItems = session.items.length + skippedItems.length
  const progress = reviewingSkipped
    ? ((session.items.length + currentItemIndex + 1) / totalItems) * 100
    : ((currentItemIndex + 1) / totalItems) * 100

  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{session.title}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {reviewingSkipped ? (
                <>
                  Reviewing skipped: {currentItemIndex + 1} of {skippedItems.length}
                </>
              ) : (
                <>
                  {currentItemIndex + 1} of {session.items.length}
                </>
              )}
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            {reviewingSkipped && (
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-sm text-yellow-800">
                <Clock className="h-4 w-4 mr-2" />
                <span>You marked this question for review later</span>
              </div>
            )}

            <h3 className="text-lg font-medium mb-4">{currentItem.question}</h3>

            <RadioGroup
              value={userAnswers[currentItem._id] || ""}
              onValueChange={(value) => handleAnswer(currentItem._id, value)}
              className="space-y-3"
            >
              {currentItem.options.map((option) => (
                <div key={option} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {userAnswers[currentItem._id] && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">How difficult was this question?</h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={difficultyRatings[currentItem._id] === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDifficultyRating(currentItem._id, rating)}
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Easy</span>
                <span>Difficult</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex-1 w-full">
            {userAnswers[currentItem._id] && (
              <div className="flex items-center gap-2">
                {userAnswers[currentItem._id] === currentItem.answer ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600">Correct!</span>
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

          <div className="flex w-full justify-between gap-2">
            {!reviewingSkipped && !userAnswers[currentItem._id] && (
              <Button variant="outline" onClick={reviewLater} className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Review Later
              </Button>
            )}

            <Button
              onClick={moveToNext}
              disabled={!userAnswers[currentItem._id] || !difficultyRatings[currentItem._id]}
              className={!reviewingSkipped && !userAnswers[currentItem._id] ? "ml-auto" : "w-full"}
            >
              {isLastItem() && (!reviewingSkipped || skippedItems.length === 0) ? "Complete Review" : "Next Question"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

