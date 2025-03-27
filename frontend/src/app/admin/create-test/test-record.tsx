"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { AlertCircle, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

interface Question {
    _id: string
    subject: { name: string; _id: string }
    subsection: string
    system: string
    topic: string
    subtopics: string[]
    exam_type: string
    year: number
    difficulty: string
    specialty: string
    state_specific: string | null
    clinical_setting: string
    question_type: string
    question: string
    options: [string, string, string, string]
    answer: string
    explanation: string
}

const BASE_API_URL = "https://medical-backend-loj4.onrender.com/api/test"

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
        case "easy":
            return "bg-green-500"
        case "medium":
            return "bg-yellow-500"
        case "hard":
            return "bg-red-500"
        default:
            return "bg-gray-500"
    }
}

export default function TestRecord() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [visibleCount, setVisibleCount] = useState(10)
    const [allQuestions, setAllQuestions] = useState<Question[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchQuestions()
    }, [])

    const fetchQuestions = async () => {
        try {
            const response = await axios.get<Question[]>(`${BASE_API_URL}/get-questions`)
            setAllQuestions(response.data)
            setQuestions(response.data.slice(0, 10))
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to load questions: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to load questions: ${(error as Error).message}`)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleShowMore = () => {
        const newVisibleCount = visibleCount + 10
        setVisibleCount(newVisibleCount)
        setQuestions(allQuestions.slice(0, newVisibleCount))
    }

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`${BASE_API_URL}/questions/${id}`)
            const updatedQuestions = allQuestions.filter((q) => q._id !== id)
            setAllQuestions(updatedQuestions)
            setQuestions(updatedQuestions.slice(0, visibleCount))
            toast.success("Question deleted successfully")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to delete question: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to delete question: ${(error as Error).message}`)
            }
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!questions.length) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No questions found</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Toaster position="top-right" />
            <ScrollArea className="h-[calc(100vh-2rem)]">
                <div className="space-y-6 p-6">
                    {questions.map((question) => (
                        <Card key={question?._id} className="relative">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{question?.question}</CardTitle>
                                        <CardDescription>
                                            {question?.subject?.name} • {question?.subsection}
                                        </CardDescription>
                                    </div>
                                    <Badge className={`${getDifficultyColor(question?.difficulty)} text-white`}>
                                        {question?.difficulty}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="options">
                                        <AccordionTrigger>Options & Answer</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2">
                                                {question?.options?.map((option, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-3 rounded-lg ${option === question?.answer ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"
                                                            }`}
                                                    >
                                                        {option}
                                                        {option === question?.answer && <Badge className="ml-2 bg-green-500">Correct Answer</Badge>}
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="explanation">
                                        <AccordionTrigger>Explanation</AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-muted-foreground">{question?.explanation}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="details">
                                        <AccordionTrigger>Additional Details</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-medium mb-2">Basic Information</h4>
                                                    <div className="space-y-1 text-sm">
                                                        <p>
                                                            <span className="font-medium">System:</span> {question?.system}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Topic:</span> {question?.topic}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Subtopics:</span> {question?.subtopics?.join(", ")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-2">Exam Details</h4>
                                                    <div className="space-y-1 text-sm">
                                                        <p>
                                                            <span className="font-medium">Exam Type:</span> {question?.exam_type}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Year:</span> {question?.year}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Question Type:</span> {question?.question_type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-2">Clinical Information</h4>
                                                    <div className="space-y-1 text-sm">
                                                        <p>
                                                            <span className="font-medium">Specialty:</span> {question?.specialty}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">Clinical Setting:</span> {question?.clinical_setting}
                                                        </p>
                                                        {question?.state_specific && (
                                                            <p>
                                                                <span className="font-medium">State Specific:</span> {question.state_specific}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                {/* <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                </Button> */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the question.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(question._id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                    {visibleCount < allQuestions.length && (
                        <div className="flex justify-center">
                            <Button onClick={handleShowMore} variant="outline">
                                Show More
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </>
    )
}