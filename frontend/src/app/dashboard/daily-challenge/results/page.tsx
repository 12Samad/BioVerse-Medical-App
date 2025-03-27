"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import axios from "axios"
import { AlertCircle, Calendar, Trophy } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DailyChallengeResults() {
    const router = useRouter()
    const { status } = useSession()
    interface Results {
        score: number;
        questions: { id: number; question: string; answer: string; correct: boolean }[];
        date: string;
    }

    const [results, setResults] = useState<Results | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true)
                const userId = localStorage.getItem("Medical_User_Id")

                const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/daily-challenge?userId=${userId}`)
                const data = response.data

                if (response.status === 200) {
                    if (!data.completed) {
                        router.push("/daily-challenge")
                        return
                    }

                    setResults(data.progress)
                } else {
                    setError(data.error || "Failed to fetch daily challenge results")
                }
            } catch (err) {
                setError("An error occurred while fetching your results")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [router, status])

    if (status === "loading" || loading) {
        return <div className="flex justify-center items-center h-screen">Loading results...</div>
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

    if (!results) {
        return null
    }

    const scorePercentage = (results.score / results.questions.length) * 100
    const formattedDate = new Date(results.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Calendar className="h-7 w-7" />
                Daily Challenge Results
            </h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Your Performance</CardTitle>
                    <CardDescription>{formattedDate}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative w-40 h-40">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-4xl font-bold">{results.score}</div>
                                    <div className="text-sm text-muted-foreground">out of {results.questions.length}</div>
                                </div>
                            </div>
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    className="text-muted stroke-current"
                                    strokeWidth="10"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                                <circle
                                    className="text-primary stroke-current"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - scorePercentage / 100)}`}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Score</span>
                                    <span className="text-sm font-medium">{scorePercentage.toFixed(0)}%</span>
                                </div>
                                <Progress value={scorePercentage} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-primary/10 p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Correct Answers</div>
                                    <div className="text-2xl font-bold">{results.score}</div>
                                </div>
                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                                    <div className="text-2xl font-bold">{results.questions.length - results.score}</div>
                                </div>
                            </div>

                            {scorePercentage >= 70 && (
                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                                    <Trophy className="h-5 w-5" />
                                    <span>Great job! You&apos;ve mastered today&apos;s challenge.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        </div>
    )
}

