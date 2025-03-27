"use client"

import type React from "react"

import axios from "axios"
import { AlertCircle, Medal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Question {
    _id: string
    question: string
    options: string[]
    answer: string
    explanation: string
    subject: string
    subsection: string
    system: string
    topic: string
    subtopics: string[]
    exam_type: "USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3"
    year: number
    difficulty: "easy" | "medium" | "hard"
    specialty: string
    state_specific?: string
    clinical_setting: string
    question_type: "case_based" | "single_best_answer" | "extended_matching"
}

interface DailyChallengeProps {
    initialQuestions: Question[]
    challengeId: string
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ initialQuestions, challengeId }) => {
    const router = useRouter()

    // State
    const [questions] = useState<Question[]>(initialQuestions)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<string[]>(Array(initialQuestions.length).fill(""))
    const [submittedQuestions, setSubmittedQuestions] = useState<Record<number, boolean>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // const [startTime] = useState<number>(Date.now())
    // const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({})
    const [aiExplanation, setAiExplanation] = useState<string | null>(null)
    const [isLoadingAiExplanation, setIsLoadingAiExplanation] = useState(false)
    const [aiExplanationError, setAiExplanationError] = useState<string | null>(null)

    const currentQuestion = questions[currentQuestionIndex]
    const selectedAnswer = answers[currentQuestionIndex]
    const isSubmitted = submittedQuestions[currentQuestionIndex]

    // Handle answer selection
    const handleAnswerSelect = (answer: string) => {
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = answer
        setAnswers(newAnswers)
    }

    // Navigate to next question
    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1)
        }
    }

    // Navigate to previous question
    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1)
        }
    }

    // Submit answer for current question
    const handleSubmitAnswer = () => {
        if (!selectedAnswer) return

        // Record time spent on question
        // const currentTime = Date.now()
        // const timeSpent = Math.round((currentTime - startTime) / 1000)

        // setQuestionTimes((prev) => ({
        //     ...prev,
        //     [currentQuestionIndex]: timeSpent,
        // }))

        // Mark question as submitted
        setSubmittedQuestions((prev) => ({
            ...prev,
            [currentQuestionIndex]: true,
        }))

        // Fetch AI explanation
        fetchAiExplanation(currentQuestion, selectedAnswer)
    }

    // Fetch AI explanation
    const fetchAiExplanation = async (question: Question, userAnswer: string) => {
        setIsLoadingAiExplanation(true)
        setAiExplanationError(null)

        try {
            const response = await axios.post(
                `https://medical-backend-loj4.onrender.com/api/test/ai-explain`,
                {
                    question: question.question,
                    options: question.options,
                    correctAnswer: question.answer,
                    userAnswer: userAnswer,
                },
                {
                    timeout: 15000, // 15 second timeout
                },
            )

            setAiExplanation(response.data.explanation)
        } catch (error) {
            console.error("Error fetching AI explanation:", error)
            setAiExplanationError("Failed to load AI explanation. Please try again later.")
            setAiExplanation("AI explanation is currently unavailable. Please refer to the detailed explanation above.")
        } finally {
            setIsLoadingAiExplanation(false)
        }
    }

    // Submit entire challenge
    const handleSubmitChallenge = async () => {
        // Check if all questions have been answered
        if (answers.some((answer) => !answer)) {
            setError("Please answer all questions before submitting.")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const userId = localStorage.getItem("Medical_User_Id")

            console.log("Submitting challenge with:", {
                challengeId,
                userId,
                answers,
            })

            const response = await axios.post("https://medical-backend-loj4.onrender.com/api/test/daily-challenge", {
                challengeId,
                userId,
                answers, // Send the complete answers array
            })

            if (response.status === 200) {
                router.push("/dashboard/daily-challenge/results")
            } else {
                setError("Failed to submit daily challenge")
            }
        } catch (err) {
            console.error("Error submitting daily challenge:", err)
            setError("An error occurred while submitting the daily challenge")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Calculate progress
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Daily Challenge</h1>

            {/* Progress indicator */}
            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <span>
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Question and answers */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-slate-700">Question {currentQuestionIndex + 1}</h2>
                        <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                            {currentQuestion?.topic || "Medical Question"}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <p className="text-lg text-slate-800 leading-relaxed">{currentQuestion?.question}</p>

                        <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect} disabled={isSubmitted}>
                            {currentQuestion?.options.map((option, index) => (
                                <div
                                    key={index}
                                    className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${selectedAnswer === option
                                            ? isSubmitted
                                                ? option === currentQuestion.answer
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
                                    {isSubmitted && option === currentQuestion.answer && <Medal className="h-5 w-5 text-emerald-500" />}
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            {/* Explanation (shown after submission) */}
            {isSubmitted && (
                <Card className="mb-6 bg-amber-50 border-amber-200">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2 text-amber-800">Explanation</h3>

                        <div className="p-4 rounded-lg bg-white/80 text-slate-700 leading-relaxed">
                            {isLoadingAiExplanation ? (
                                <p>Loading explanation...</p>
                            ) : aiExplanationError ? (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{aiExplanationError}</AlertDescription>
                                </Alert>
                            ) : (
                                <p>{aiExplanation || currentQuestion.explanation}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                    Previous
                </Button>

                {!isSubmitted ? (
                    <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer}>
                        Submit Answer
                    </Button>
                ) : currentQuestionIndex === questions.length - 1 ? (
                    <Button onClick={handleSubmitChallenge} disabled={isSubmitting || answers.some((answer) => !answer)}>
                        {isSubmitting ? "Submitting..." : "Finish Challenge"}
                    </Button>
                ) : (
                    <Button onClick={handleNextQuestion}>Next Question</Button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}

export default DailyChallenge

