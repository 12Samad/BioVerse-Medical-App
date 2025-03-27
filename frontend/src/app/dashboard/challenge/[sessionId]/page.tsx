"use client"

import axios, { type AxiosError } from "axios"
import { motion } from "framer-motion"
import { ArrowLeft, Brain, CheckCircle, Clock, HelpCircle, Trophy, XCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"


interface Question {
    _id: string
    question: string
    options: string[]
    specialty: string
    topic: string
    system: string
}

interface SessionQuestion {
    questionId: string
    userAnswer: string | null
    isCorrect: boolean | null
    timeSpent: number | null
}

interface ChallengeSession {
    _id: string
    userId: string
    questions: SessionQuestion[]
    status: "in_progress" | "completed"
    metadata: {
        specialties: string[]
        topics: string[]
        difficultyLevel: string
        questionCount: number
    }
}

interface AnswerResult {
    isCorrect: boolean
    correctAnswer: string
    explanation: string
}

interface ChallengeResults {
    correct: number
    total: number
    percentage: number
    timeSpent: number
}

interface SubmitAnswerResponse {
    success: boolean
    isCorrect: boolean
    correctAnswer: string
    explanation: string
    sessionComplete: boolean
    metrics?: {
        totalCorrect: number
        totalQuestions: number
        averageTimePerQuestion: number
    }
}

interface SessionResponse {
    success: boolean
    session: {
        _id: string
        userId: string
        questions: Array<{
            questionId: string
            userAnswer: string | null
            isCorrect: boolean | null
            timeSpent: number | null
            question: string
            options: string[]
            correctAnswer: string
            explanation: string
            specialty: string
            topic: string
            system: string
        }>
        status: "in_progress" | "completed"
        metadata: {
            specialties: string[]
            topics: string[]
            difficultyLevel: string
            questionCount: number
        }
        metrics?: {
            totalCorrect: number
            totalQuestions: number
            averageTimePerQuestion: number
        }
    }
}

export default function ChallengePage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = params.sessionId as string

    const [isLoading, setIsLoading] = useState(true)
    const [session, setSession] = useState<ChallengeSession | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
    const [timeStarted, setTimeStarted] = useState<number>(Date.now())
    const [elapsedTime, setElapsedTime] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [results, setResults] = useState<ChallengeResults>({
        correct: 0,
        total: 0,
        percentage: 0,
        timeSpent: 0,
    })

    // Update elapsed time every second
    useEffect(() => {
        if (!answerResult && !sessionComplete) {
            const timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - timeStarted) / 1000))
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [timeStarted, answerResult, sessionComplete])

    useEffect(() => {
        const fetchChallengeSession = async () => {
            setIsLoading(true)
            try {
                const userId = localStorage.getItem("Medical_User_Id")

                const response = await axios.get<SessionResponse>(
                    `https://medical-backend-loj4.onrender.com/api/challenge/${sessionId}?userId=${userId}`,
                )

                if (response.data.success) {
                    const sessionData = response.data.session

                    // If session is already completed, show results directly
                    if (sessionData.status === "completed") {
                        setSessionComplete(true)
                        calculateResults(sessionData)
                    }

                    // Extract questions and session data
                    const formattedQuestions: Question[] = sessionData.questions.map((q) => ({
                        _id: q.questionId,
                        question: q.question,
                        options: q.options,
                        specialty: q.specialty,
                        topic: q.topic,
                        system: q.system,
                    }))

                    setSession({
                        _id: sessionData._id,
                        userId: sessionData.userId,
                        questions: sessionData.questions.map((q) => ({
                            questionId: q.questionId,
                            userAnswer: q.userAnswer,
                            isCorrect: q.isCorrect,
                            timeSpent: q.timeSpent,
                        })),
                        status: sessionData.status,
                        metadata: sessionData.metadata,
                    })

                    setQuestions(formattedQuestions)

                    // Reset timer for the current question
                    setTimeStarted(Date.now())

                    toast.success("Challenge loaded successfully", {
                        duration: 2000,
                        position: "top-center",
                        icon: "🏆",
                    })
                } else {
                    toast.error("Failed to load challenge session", {
                        duration: 4000,
                        position: "top-center",
                    })
                }
            } catch (error) {
                console.error("Error fetching challenge session:", error)
                const axiosError = error as AxiosError
                toast.error(axiosError.message || "Failed to load challenge session", {
                    duration: 4000,
                    position: "top-center",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchChallengeSession()
    }, [sessionId, router])

    const calculateResults = (sessionData: SessionResponse["session"]) => {
        const totalQuestions = sessionData.questions.length
        const correctAnswers = sessionData.questions.filter((q) => q.isCorrect).length
        const percentage = Math.round((correctAnswers / totalQuestions) * 100)
        const totalTimeSpent = sessionData.questions.reduce((total, q) => total + (q.timeSpent || 0), 0)

        setResults({
            correct: correctAnswers,
            total: totalQuestions,
            percentage,
            timeSpent: totalTimeSpent,
        })
    }

    const submitAnswer = async () => {
        if (!selectedAnswer) {
            toast.error("Please select an answer before submitting", {
                duration: 2000,
                position: "top-center",
                icon: "⚠️",
            })
            return
        }

        setIsSubmitting(true)
        const timeSpent = Math.floor((Date.now() - timeStarted) / 1000) // Time in seconds

        try {
            const userId = localStorage.getItem("Medical_User_Id")
            const currentQuestion = questions[currentQuestionIndex]

            const response = await axios.post<SubmitAnswerResponse>(
                `https://medical-backend-loj4.onrender.com/api/challenge/${sessionId}/submit?userId=${userId}`,
                {
                    questionId: currentQuestion._id,
                    answer: selectedAnswer,
                    timeSpent,
                }
            )

            if (response.data.success) {
                setAnswerResult({
                    isCorrect: response.data.isCorrect,
                    correctAnswer: response.data.correctAnswer,
                    explanation: response.data.explanation || "No explanation provided.",
                })

                // Show toast based on answer correctness
                if (response.data.isCorrect) {
                    toast.success("Correct answer! 🎉", {
                        duration: 2000,
                        position: "top-center",
                    })
                } else {
                    toast("Incorrect answer", {
                        duration: 2000,
                        position: "top-center",
                        icon: "❌",
                    })
                }

                // Check if session is complete
                if (response.data.sessionComplete) {
                    setSessionComplete(true)

                    // Fetch updated session to get final results
                    const sessionResponse = await axios.get<SessionResponse>(
                        `https://medical-backend-loj4.onrender.com/api/challenge/${sessionId}?userId=${userId}`
                    )

                    if (sessionResponse.data.success) {
                        calculateResults(sessionResponse.data.session)
                        toast.success("Challenge completed! 🏆", {
                            duration: 3000,
                            position: "top-center",
                        })
                    }
                }
            } else {
                toast.error("Failed to submit answer", {
                    duration: 3000,
                    position: "top-center",
                })
            }
        } catch (error) {
            console.error("Error submitting answer:", error)
            const axiosError = error as AxiosError
            toast.error(axiosError.message || "Failed to submit answer", {
                duration: 3000,
                position: "top-center",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
            setSelectedAnswer(null)
            setAnswerResult(null)
            setTimeStarted(Date.now())
            setElapsedTime(0)

            console.log(session)

            toast(`Question ${currentQuestionIndex + 2} of ${questions.length}`, {
                duration: 2000,
                position: "top-center",
                icon: "📝",
            })
        }
    }

    const returnToDashboard = () => {
        router.push("/dashboard")
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[70vh]">
                <div className="relative w-20 h-20 mb-6">
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                </div>
                <div className="text-2xl font-bold mb-4">Loading challenge...</div>
                <p className="text-muted-foreground">Preparing your questions</p>
                <Toaster />
            </div>
        )
    }

    if (sessionComplete) {
        return (
            <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
                <Button variant="ghost" onClick={returnToDashboard} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Card className="w-full overflow-hidden border-2 border-primary/10">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Challenge Complete!</h2>
                                <p className="text-muted-foreground">You&apos;ve completed the hard challenge</p>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Trophy className="h-8 w-8 text-primary" />
                            </div>
                        </div>

                        <CardContent className="space-y-8 p-6">
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="relative">
                                    <svg className="w-32 h-32">
                                        <circle
                                            className="text-muted-foreground/20"
                                            strokeWidth="6"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="58"
                                            cx="64"
                                            cy="64"
                                        />
                                        <motion.circle
                                            initial={{ strokeDashoffset: 365 }}
                                            animate={{
                                                strokeDashoffset: 365 - (365 * results.percentage) / 100,
                                            }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="text-primary"
                                            strokeWidth="6"
                                            strokeDasharray="365"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="58"
                                            cx="64"
                                            cy="64"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold">{results.percentage}%</span>
                                        <span className="text-sm text-muted-foreground">Score</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-md">
                                    <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold">
                                            {results.correct}/{results.total}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Correct Answers</div>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                                        <div className="text-2xl font-bold">{formatTime(results.timeSpent)}</div>
                                        <div className="text-sm text-muted-foreground">Total Time</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Performance Analysis</h3>

                                {results.percentage >= 80 ? (
                                    <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900 flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-green-800 dark:text-green-300">Excellent Performance!</h3>
                                            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                                                You&apos;ve demonstrated mastery of this topic. Your understanding of the material is exceptional.
                                            </p>
                                        </div>
                                    </div>
                                ) : results.percentage >= 60 ? (
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900 flex items-start">
                                        <Brain className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-blue-800 dark:text-blue-300">Good Performance!</h3>
                                            <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                                                You have a solid understanding of the material. With a bit more practice, you&apos;ll master these
                                                concepts.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900 flex items-start">
                                        <HelpCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-medium text-amber-800 dark:text-amber-300">Keep Practicing!</h3>
                                            <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                                                This topic needs more attention. Review the material and try again to improve your
                                                understanding.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 bg-muted/10">
                            <Button variant="outline" onClick={returnToDashboard} className="w-full sm:w-auto">
                                Return to Dashboard
                            </Button>
                            <Button onClick={() => router.push("/dashboard/performance-tracking")} className="w-full sm:w-auto">
                                View Performance History
                            </Button>
                            <Button onClick={() => router.push("/dashboard/create-test")} className="w-full sm:w-auto bg-primary">
                                Practice More Questions
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
                <Toaster position="top-right" />
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]

    if (!currentQuestion) {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center">
                <div className="text-xl font-bold mb-4">No questions found</div>
                <Button onClick={returnToDashboard}>Return to Dashboard</Button>
            </div>
        )
    }

    return (
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={returnToDashboard} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-orange-500" />
                        Hard Challenge
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                </div>
                <div className="flex items-center bg-muted/30 px-3 py-2 rounded-md">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Time: {formatTime(elapsedTime)}</span>
                </div>
            </div>

            <div className="relative mb-8">
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
                <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complete
                </div>
            </div>

            <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="w-full mb-6 border-2 border-muted">
                    <CardHeader className="bg-muted/20">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">
                                    {currentQuestion.specialty} - {currentQuestion.topic}
                                </CardTitle>
                                <CardDescription>{currentQuestion.system}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            <div className="text-lg font-medium leading-relaxed">{currentQuestion.question}</div>

                            {!answerResult ? (
                                <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer}>
                                    <div className="space-y-3">
                                        {currentQuestion.options.map((option, index) => {
                                            const optionLetter = String.fromCharCode(65 + index)
                                            return (
                                                <motion.div
                                                    key={index}
                                                    whileHover={{ scale: 1.01 }}
                                                    className={`flex items-center space-x-2 border-2 rounded-md p-4 hover:bg-muted/30 cursor-pointer transition-colors ${selectedAnswer === optionLetter ? "border-primary bg-primary/5" : "border-muted"
                                                        }`}
                                                    onClick={() => setSelectedAnswer(optionLetter)}
                                                >
                                                    <div
                                                        className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 flex-shrink-0 ${selectedAnswer === optionLetter
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
                                                        {optionLetter}
                                                    </div>
                                                    <label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                                        {option}
                                                    </label>
                                                    <RadioGroupItem value={optionLetter} id={`option-${index}`} className="sr-only" />
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </RadioGroup>
                            ) : (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, index) => {
                                        const optionLetter = String.fromCharCode(65 + index)
                                        const isSelected = selectedAnswer === optionLetter
                                        const isCorrect = answerResult.correctAnswer === optionLetter

                                        let className = "flex items-center space-x-2 border-2 rounded-md p-4"
                                        let iconComponent = null

                                        if (isCorrect) {
                                            className += " bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900"
                                            iconComponent = <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        } else if (isSelected) {
                                            className += " bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                                            iconComponent = <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                        }

                                        return (
                                            <div key={index} className={className}>
                                                <div
                                                    className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 flex-shrink-0 ${isCorrect
                                                        ? "bg-green-500 text-white"
                                                        : isSelected
                                                            ? "bg-red-500 text-white"
                                                            : "bg-muted text-muted-foreground"
                                                        }`}
                                                >
                                                    {optionLetter}
                                                </div>
                                                <div className="flex-1">{option}</div>
                                                {iconComponent}
                                            </div>
                                        )
                                    })}

                                    {answerResult.explanation && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="mt-6"
                                        >
                                            <Separator className="my-4" />
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                                                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Explanation:</h3>
                                                <p className="text-blue-700 dark:text-blue-400">{answerResult.explanation}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-6 bg-muted/10">
                        {!answerResult ? (
                            <Button
                                onClick={submitAnswer}
                                disabled={!selectedAnswer || isSubmitting}
                                className="w-full bg-primary hover:bg-primary/90"
                            >
                                {isSubmitting ? (
                                    <>
                                        <motion.div
                                            className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                        />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Answer"
                                )}
                            </Button>
                        ) : (
                            <Button onClick={nextQuestion} className="w-full bg-primary hover:bg-primary/90">
                                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "View Results"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </motion.div>
            <Toaster position="top-center" />
        </div>
    )
}

