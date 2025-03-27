"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import axios from "axios"
import { AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import DailyChallenge from "./DailyChallenge"

// Define the Challenge interface
interface Challenge {
    _id: string
    questions: { questionText: string; options: string[]; correctAnswer: string }[]
}

// Define the Question interface expected by DailyChallenge
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

export default function DailyChallengePage() {
    const { id } = useParams()
    const router = useRouter()
    const { status } = useSession()

    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [adaptedQuestions, setAdaptedQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                setLoading(true)
                const userId = localStorage.getItem("Medical_User_Id")
                const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/daily-challenge?userId=${userId}`)

                if (response.status === 200) {
                    // Verify this is today's challenge
                    if (response.data.challenge._id !== id) {
                        setError("This challenge is no longer available")
                        return
                    }

                    // Check if already completed
                    if (response.data.completed) {
                        router.push("/daily-challenge/results")
                        return
                    }

                    setChallenge(response.data.challenge)

                    // Adapt the challenge questions to the format expected by DailyChallenge
                    if (response.data.challenge.questions) {
                        const adapted = response.data.challenge.questions.map(
                            (q: { question: string; options: string[]; answer: string }, index: number) => ({
                                _id: `daily-${index}`,
                                question: q.question,
                                options: q.options,
                                answer: q.answer,
                                explanation: "Explanation will be provided after submission.",
                                subject: "Daily Challenge",
                                subsection: "General",
                                system: "Mixed",
                                topic: "Daily Challenge",
                                subtopics: ["Daily Challenge"],
                                exam_type: "USMLE_STEP1",
                                year: new Date().getFullYear(),
                                difficulty: "medium",
                                specialty: "General",
                                clinical_setting: "Mixed",
                                question_type: "single_best_answer",
                            }),
                        )
                        setAdaptedQuestions(adapted)
                    }
                } else {
                    setError(response.data.error || "Failed to fetch daily challenge")
                }
            } catch (err) {
                setError("An error occurred while fetching the daily challenge")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchChallenge()
    }, [id, router, status])

    if (status === "loading" || loading) {
        return <div className="flex justify-center items-center h-screen">Loading challenge...</div>
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!challenge || adaptedQuestions.length === 0) {
        return null
    }

    return (
        <div className="w-full h-screen">
            {/* Pass the adapted questions to the DailyChallenge component */}
            <Suspense fallback={<div>Loading...</div>}>
                <DailyChallenge initialQuestions={adaptedQuestions} challengeId={challenge._id} />
            </Suspense>
        </div>
    )
}

