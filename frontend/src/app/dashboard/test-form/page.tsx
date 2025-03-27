"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import axios, { AxiosError } from "axios"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast, Toaster } from "react-hot-toast"

type Question = {
    question: string
    options: string[]
    answer: string
    explanation: string
}

type FormData = {
    subject: string
    subsection: string
    questions: Question[]
}

const PostUrl = "https://medical-backend-loj4.onrender.com/api/test/create-test"

const initialQuestion: Question = {
    question: "",
    options: ["", ""],
    answer: "",
    explanation: "",
}

const initialFormData: FormData = {
    subject: "",
    subsection: "",
    questions: [{ ...initialQuestion }],
}

export default function DynamicForm() {
    const [formData, setFormData] = useState<FormData>(initialFormData)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Validate questions
            const invalidQuestions = formData.questions.some(
                (q) => !q.question || !q.answer || q.options.some((opt) => !opt) || !q.explanation,
            )

            if (!formData.subject || !formData.subsection || invalidQuestions) {
                toast.error("Please fill in all required fields")
                return
            }

            const response = await axios.post(PostUrl, formData, {
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (response.status === 201) {
                toast.success("Data submitted successfully!")
                setFormData(initialFormData)
            }
        } catch (error) {
            console.error("Error:", error)
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.error || "Error submitting data")
            } else {
                toast.error("An unexpected error occurred")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const addQuestion = () => {
        try {
            setFormData((prev) => ({
                ...prev,
                questions: [...prev.questions, { ...initialQuestion }],
            }))
        } catch (error) {
            console.error("Error adding question:", error)
            toast.error("Failed to add question")
        }
    }

    const removeQuestion = (index: number) => {
        try {
            setFormData((prev) => ({
                ...prev,
                questions: prev.questions.filter((_, i) => i !== index),
            }))
        } catch (error) {
            console.error("Error removing question:", error)
            toast.error("Failed to remove question")
        }
    }

    const addOption = (questionIndex: number) => {
        try {
            setFormData((prev) => {
                const newQuestions = [...prev.questions]
                newQuestions[questionIndex] = {
                    ...newQuestions[questionIndex],
                    options: [...newQuestions[questionIndex].options, ""],
                }
                return { ...prev, questions: newQuestions }
            })
        } catch (error) {
            console.error("Error adding option:", error)
            toast.error("Failed to add option")
        }
    }

    const removeOption = (questionIndex: number, optionIndex: number) => {
        try {
            setFormData((prev) => {
                const newQuestions = [...prev.questions]
                const newOptions = [...newQuestions[questionIndex].options]
                newOptions.splice(optionIndex, 1)
                newQuestions[questionIndex] = {
                    ...newQuestions[questionIndex],
                    options: newOptions,
                    // Reset answer if the removed option was the correct answer
                    answer:
                        newQuestions[questionIndex].answer === newQuestions[questionIndex].options[optionIndex]
                            ? ""
                            : newQuestions[questionIndex].answer,
                }
                return { ...prev, questions: newQuestions }
            })
        } catch (error) {
            console.error("Error removing option:", error)
            toast.error("Failed to remove option")
        }
    }

    const updateQuestion = (questionIndex: number, field: keyof Question, value: string) => {
        try {
            setFormData((prev) => {
                const newQuestions = [...prev.questions]
                newQuestions[questionIndex] = {
                    ...newQuestions[questionIndex],
                    [field]: value,
                }
                return { ...prev, questions: newQuestions }
            })
        } catch (error) {
            console.error("Error updating question:", error)
            toast.error("Failed to update question")
        }
    }

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        try {
            setFormData((prev) => {
                const newQuestions = [...prev.questions]
                const newOptions = [...newQuestions[questionIndex].options]
                newOptions[optionIndex] = value
                newQuestions[questionIndex] = {
                    ...newQuestions[questionIndex],
                    options: newOptions,
                    // Update answer if this option was the correct answer
                    answer:
                        newQuestions[questionIndex].answer === prev.questions[questionIndex].options[optionIndex]
                            ? value
                            : newQuestions[questionIndex].answer,
                }
                return { ...prev, questions: newQuestions }
            })
        } catch (error) {
            console.error("Error updating option:", error)
            toast.error("Failed to update option")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6">
            <Toaster position="top-right" />
            <div className="grid gap-4">
                <div>
                    <Label htmlFor="subject">Subject Name</Label>
                    <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="subsection">Subsection Name</Label>
                    <Input
                        id="subsection"
                        value={formData.subsection}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subsection: e.target.value }))}
                        required
                    />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Questions</h2>
                    <Button type="button" onClick={addQuestion} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                    </Button>
                </div>

                {formData.questions.map((q, questionIndex) => (
                    <Card key={questionIndex}>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">Question {questionIndex + 1}</h3>
                                {formData.questions.length > 1 && (
                                    <Button type="button" variant="destructive" size="sm" onClick={() => removeQuestion(questionIndex)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div>
                                <Label>Question Text</Label>
                                <Textarea
                                    value={q.question}
                                    onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Options</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => addOption(questionIndex)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Option
                                    </Button>
                                </div>
                                {q.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex gap-2">
                                        <div className="flex-1 flex gap-2 items-center">
                                            <Input
                                                value={option}
                                                onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                                required
                                            />
                                            <Button
                                                type="button"
                                                variant={q.answer === option ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => updateQuestion(questionIndex, "answer", option)}
                                            >
                                                Correct
                                            </Button>
                                            {q.options.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <Label>Explanation</Label>
                                <Textarea
                                    value={q.explanation}
                                    onChange={(e) => updateQuestion(questionIndex, "explanation", e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit All"}
            </Button>
        </form>
    )
}

