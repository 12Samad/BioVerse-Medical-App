"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { Plus, Save, Trash } from "lucide-react"
import { useState } from "react"
import { toast, Toaster } from "react-hot-toast"

interface FlashCard {
    question: string
    answer: string
    hint: string
    category: string
}

const MAX_FLASHCARDS = 5
const BASE_API_URL = "https://medical-backend-loj4.onrender.com/api/test"

export default function FlashcardForm() {
    const [flashcards, setFlashcards] = useState<FlashCard[]>([
        {
            question: "",
            answer: "",
            hint: "",
            category: "",
        },
    ])
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const addFlashcard = () => {
        if (flashcards.length < MAX_FLASHCARDS) {
            setFlashcards([...flashcards, { question: "", answer: "", hint: "", category: "" }])
        } else {
            toast.error(`You can only create up to ${MAX_FLASHCARDS} flashcards.`)
        }
    }

    const removeFlashcard = (index: number) => {
        const newFlashcards = flashcards.filter((_, i) => i !== index)
        setFlashcards(newFlashcards)
    }

    const updateFlashcard = (index: number, field: keyof FlashCard, value: string) => {
        const newFlashcards = [...flashcards]
        newFlashcards[index] = { ...newFlashcards[index], [field]: value }
        setFlashcards(newFlashcards)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setAttemptedSubmit(true)
        const toasId = toast.loading("Adding Flashcard(s)...")

        // Validate all flashcards
        const isValid = flashcards.every((card) => card.question && card.answer && card.hint && card.category)

        if (!isValid) {
            toast.error("Please fill in all fields for each flashcard")
            return
        }

        try {
            const { data } = await axios.post(`${BASE_API_URL}/flashcards`, flashcards, {
                headers: {
                    "Content-Type": "application/json",
                },
            })
            console.log(data);
            if (data.status === 201) {
                toast.success("Flashcards saved successfully", { id: toasId })
            }

            // Reset form after successful submission
            setFlashcards([{ question: "", answer: "", hint: "", category: "" }])
            setAttemptedSubmit(false)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to save flashcards: ${error.response?.data?.message || error.message}`, { id: toasId })
                setIsLoading(false)
            } else {
                toast.error(`Failed to save flashcards: ${(error as Error).message}`, { id: toasId })
                setIsLoading(false)
            }
        } finally {
            setTimeout(() => {
                toast.dismiss(toasId)
                setIsLoading(false)
            }, 2500)
        }
    }

    return (
        <CardContent className="p-6">
            <Toaster position="top-right" />
            <form onSubmit={handleSubmit} className="space-y-6">
                {flashcards.map((flashcard, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-card">
                        <div className="absolute right-4 top-4">
                            {flashcards.length > 1 && (
                                <Button variant="ghost" size="icon" type="button" onClick={() => removeFlashcard(index)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`question-${index}`}>Question</Label>
                            <Input
                                id={`question-${index}`}
                                value={flashcard.question}
                                onChange={(e) => updateFlashcard(index, "question", e.target.value)}
                                placeholder="Enter the question"
                                className={attemptedSubmit && !flashcard.question ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {attemptedSubmit && !flashcard.question && (
                                <span className="text-xs text-red-500">Question is required</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`answer-${index}`}>Answer</Label>
                            <Input
                                id={`answer-${index}`}
                                value={flashcard.answer}
                                onChange={(e) => updateFlashcard(index, "answer", e.target.value)}
                                placeholder="Enter the answer"
                                className={attemptedSubmit && !flashcard.answer ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {attemptedSubmit && !flashcard.answer && <span className="text-xs text-red-500">Answer is required</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`hint-${index}`}>Hint</Label>
                            <Textarea
                                id={`hint-${index}`}
                                value={flashcard.hint}
                                onChange={(e) => updateFlashcard(index, "hint", e.target.value)}
                                placeholder="Enter a hint"
                                className={attemptedSubmit && !flashcard.hint ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {attemptedSubmit && !flashcard.hint && <span className="text-xs text-red-500">Hint is required</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`category-${index}`}>Category</Label>
                            <Input
                                id={`category-${index}`}
                                value={flashcard.category}
                                onChange={(e) => updateFlashcard(index, "category", e.target.value)}
                                placeholder="Enter a category (e.g., Anatomy, Physiology)"
                                className={attemptedSubmit && !flashcard.category ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {attemptedSubmit && !flashcard.category && (
                                <span className="text-xs text-red-500">Category is required</span>
                            )}
                        </div>
                    </div>
                ))}
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addFlashcard}
                        className="flex items-center gap-2"
                        disabled={flashcards.length >= MAX_FLASHCARDS}
                    >
                        <Plus className="h-4 w-4" /> Add Flashcard
                    </Button>
                    <Button type="submit" className="flex items-center gap-2" disabled={isLoading}>
                        <Save className="h-4 w-4" /> Save All
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    {flashcards.length} of {MAX_FLASHCARDS} flashcards created
                </p>
            </form>
        </CardContent>
    )
}

