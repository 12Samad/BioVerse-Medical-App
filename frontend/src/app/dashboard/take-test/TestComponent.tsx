"use client"

import TestPageWarning from "@/components/pageTestWarning"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { AlertCircle, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import QuestionBox from "./QuestionBox"
import TestSummary from "./TestSummary"

type Question = {
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

const TestComponent = () => {
    // const router = useRouter()
    const searchParams = useSearchParams()

    const mode = searchParams.get("mode") || "tutor"
    const subjectsParam = searchParams.get("subjects") || ""
    const subsectionsParam = searchParams.get("subsections") || ""
    const countParam = searchParams.get("count") || "10"

    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
    const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, boolean>>({})
    const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({})
    const [startTime, setStartTime] = useState<number | null>(null)
    const [timeLeft, setTimeLeft] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showResults, setShowResults] = useState(false)

    const totalQuestions = Math.max(1, Number.parseInt(countParam, 10))

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await axios.get("https://medical-backend-loj4.onrender.com/api/test/take-test/questions", {
                params: {
                    subjects: subjectsParam,
                    subsections: subsectionsParam,
                    count: totalQuestions,
                },
            })
            setQuestions(response.data)
            setStartTime(Date.now())
            if (mode === "timer") {
                setTimeLeft(totalQuestions * 60) // 60 seconds per question
            }
        } catch (err) {
            setError("Failed to fetch questions. Please try again.")
            console.error("Error fetching questions:", err)
        } finally {
            setIsLoading(false)
        }
    }, [subjectsParam, subsectionsParam, totalQuestions, mode])

    useEffect(() => {
        fetchQuestions()
    }, [fetchQuestions])


    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: answer,
        }))
    }
    const handleFinishTest = useCallback(() => {
        const currentTime = Date.now()
        const timeSpent = startTime ? Math.round((currentTime - startTime) / 1000) : 0
        setQuestionTimes((prev) => ({
            ...prev,
            [currentQuestionIndex]: timeSpent,
        }))
        setShowResults(true)
    }, [startTime, currentQuestionIndex])

    const handleAnswerSubmit = useCallback(() => {
        if (selectedAnswers[currentQuestionIndex]) {
            const currentTime = Date.now()
            const timeSpent = startTime ? Math.round((currentTime - startTime) / 1000) : 0
            setQuestionTimes((prev) => ({
                ...prev,
                [currentQuestionIndex]: timeSpent,
            }))
            setStartTime(currentTime)
            setSubmittedAnswers((prev) => ({
                ...prev,
                [currentQuestionIndex]: true,
            }))
        }
    }, [currentQuestionIndex, selectedAnswers, startTime])


    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1)
            setStartTime(Date.now())
        } else {
            handleFinishTest()
        }
    }

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1)
        }
    }


    const calculateScore = () => {
        return questions.reduce((score, question, index) => {
            return score + (selectedAnswers[index] === question.answer ? 1 : 0)
        }, 0)
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading questions...</div>
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (showResults) {
        return (
            <TestSummary
                questions={questions}
                selectedAnswers={selectedAnswers}
                questionTimes={questionTimes}
                score={calculateScore()}
                totalTime={Object.values(questionTimes).reduce((sum, time) => sum + time, 0)}
            />
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <TestPageWarning
                selectedAnswers={selectedAnswers}
                showResults={showResults}
                // currentQuestion={currentQuestion}
                totalQuestions={questions.length}
            />

            <h1 className="text-3xl font-bold mb-8">Medical Test</h1>

            {mode === "timer" && (
                <div className="mb-4 text-xl flex items-center">
                    <Clock className="mr-2" />
                    Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </div>
            )}

            <QuestionBox
                question={questions[currentQuestionIndex]}
                selectedAnswer={selectedAnswers[currentQuestionIndex]}
                onAnswerSelect={handleAnswerSelect}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                showCorrectAnswer={submittedAnswers[currentQuestionIndex]}
                onSubmit={handleAnswerSubmit}
            />

            <div className="flex gap-5 mt-6">
                <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                    Previous
                </Button>
                {!submittedAnswers[currentQuestionIndex] ? (
                    <Button onClick={handleAnswerSubmit} disabled={!selectedAnswers[currentQuestionIndex]}>
                        Submit Answer
                    </Button>
                ) : (
                    <Button onClick={currentQuestionIndex === questions.length - 1 ? handleFinishTest : handleNextQuestion}>
                        {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default TestComponent