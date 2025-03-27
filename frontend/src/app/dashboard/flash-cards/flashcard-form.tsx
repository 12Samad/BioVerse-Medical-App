"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Flashcard } from "@/services/api-service"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { z } from "zod"

// Common categories for suggestions
const COMMON_CATEGORIES = [
    "Anatomy",
    "Pharmacology",
    "Pathology",
    "Physiology",
    "Biochemistry",
    "Microbiology",
    "Immunology",
    "Other",
]

// Difficulty levels
const DIFFICULTY_LEVELS = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
]

// Define the schema for form validation using Zod
const flashcardSchema = z.object({
    question: z
        .string()
        .min(3, "Question must be at least 3 characters")
        .max(1000, "Question cannot exceed 1000 characters"),
    answer: z.string().min(1, "Answer is required").max(1000, "Answer cannot exceed 1000 characters"),
    hint: z.string().max(500, "Hint cannot exceed 500 characters").optional(),
    category: z.string().min(1, "Category is required"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
    mastery: z.number().min(0).max(100).optional(),
    reviewCount: z.number().min(0).optional(),
})

// Define props for the component
interface FlashcardFormProps {
    initialData?: Partial<Flashcard>
    onSubmit: (data: Partial<Flashcard>) => Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
    title: string
    submitLabel: string
}

export default function FlashcardForm({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting = false,
    title,
    submitLabel,
}: FlashcardFormProps) {
    const [newTag, setNewTag] = useState("")
    const [customCategory, setCustomCategory] = useState("")
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false)

    // Set up the form with React Hook Form and Zod validation
    const form = useForm<z.infer<typeof flashcardSchema>>({
        resolver: zodResolver(flashcardSchema),
        defaultValues: {
            question: initialData?.question || "",
            answer: initialData?.answer || "",
            hint: initialData?.hint || "",
            category: initialData?.category || "",
            difficulty: initialData?.difficulty || "medium",
            tags: initialData?.tags || [],
            mastery: initialData?.mastery || 0,
            reviewCount: initialData?.reviewCount || 0,
        },
    })

    // Handle category change
    const handleCategoryChange = (value: string) => {
        if (value === "custom_category") {
            setShowCustomCategoryInput(true)
            form.setValue("category", "")
        } else {
            setShowCustomCategoryInput(false)
            form.setValue("category", value)
        }
    }

    // Handle adding a new tag
    const handleAddTag = () => {
        if (!newTag.trim()) return

        const currentTags = form.getValues("tags")

        // Check if tag already exists
        if (currentTags.includes(newTag.trim())) {
            toast.error("This tag already exists")
            return
        }

        // Check max tag length
        if (newTag.length > 30) {
            toast.error("Tag cannot exceed 30 characters")
            return
        }

        // Check max number of tags
        if (currentTags.length >= 10) {
            toast.error("Maximum 10 tags allowed")
            return
        }

        // Add the new tag
        form.setValue("tags", [...currentTags, newTag.trim()])
        setNewTag("")
    }

    // Handle removing a tag
    const handleRemoveTag = (tagToRemove: string) => {
        const currentTags = form.getValues("tags")
        form.setValue(
            "tags",
            currentTags.filter((tag) => tag !== tagToRemove),
        )
    }

    // Handle form submission
    const handleSubmitForm = async (data: z.infer<typeof flashcardSchema>) => {
        try {
            // If using custom category, use that value
            const finalData = {
                ...data,
                category: showCustomCategoryInput ? customCategory : data.category,
            }

            // Validate custom category if selected
            if (showCustomCategoryInput && (!customCategory || customCategory.trim() === "")) {
                toast.error("Please enter a custom category")
                return
            }

            await onSubmit(finalData)
        } catch (error) {
            console.error("Error submitting form:", error)
            toast.error("Failed to save flashcard")
        }
    }

    return (
        <div className="max-h-[80vh] overflow-y-auto p-4 bg-white rounded-lg">
            <h2 className="text-xl font-semibold sticky top-0 bg-white py-2 z-10">{title}</h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
                    {/* Question Field */}
                    <FormField
                        control={form.control}
                        name="question"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Question</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Enter your question" className="min-h-[80px] max-h-[150px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Answer Field */}
                    <FormField
                        control={form.control}
                        name="answer"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Answer</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Enter the answer" className="min-h-[80px] max-h-[150px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hint Field */}
                        <FormField
                            control={form.control}
                            name="hint"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hint (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter a hint" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Difficulty Field */}
                        <FormField
                            control={form.control}
                            name="difficulty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Difficulty</FormLabel>
                                    <Select defaultValue={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIFFICULTY_LEVELS.map((level) => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    {level.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Category Field */}
                    <div className="space-y-2">
                        <FormLabel>Category</FormLabel>
                        <Select defaultValue={initialData?.category || ""} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat.toLowerCase()}>
                                        {cat}
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom_category">Add custom category</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.formState.errors.category && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.category.message}</p>
                        )}

                        {showCustomCategoryInput && (
                            <Input
                                className="mt-2"
                                placeholder="Enter custom category"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Tags Field */}
                    <div className="space-y-2">
                        <FormLabel>Tags</FormLabel>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleAddTag()
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddTag} size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2 max-h-[80px] overflow-y-auto p-2 border rounded-md">
                            {form.watch("tags").map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                    {tag}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                        onClick={() => handleRemoveTag(tag)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                            {form.watch("tags").length === 0 && (
                                <span className="text-slate-500 text-sm italic">No tags added yet</span>
                            )}
                        </div>
                        {form.formState.errors.tags && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.tags.message}</p>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white py-2 z-10">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : submitLabel}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}