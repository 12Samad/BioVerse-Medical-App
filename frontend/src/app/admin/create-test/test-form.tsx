"use client"

import QuestionFileUpload from "@/components/questionFileUpload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { Plus, Save, Trash2 } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test"

const EXAM_TYPES = ["USMLE_STEP1", "USMLE_STEP2", "USMLE_STEP3"] as const
const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const
const QUESTION_TYPES = ["case_based", "single_best_answer", "extended_matching"] as const

const VALIDATION_RULES = {
    question: { min: 10, max: 500 },
    option: { min: 1, max: 100 },
    explanation: { min: 20, max: 1000 },
}

type ValidationError = {
    field: string
    message: string
}

type Question = {
    subject: string // This will now store the subject _id
    subsection: string // This will now store the subsection _id
    system: string
    topic: string
    subtopics: string[]
    exam_type: (typeof EXAM_TYPES)[number]
    year: number
    difficulty: (typeof DIFFICULTY_LEVELS)[number]
    specialty: string
    state_specific: string | null
    clinical_setting: string
    question_type: (typeof QUESTION_TYPES)[number]
    question: string
    options: [string, string, string, string]
    answer: string
    explanation: string
}

const initialQuestion: Question = {
    subject: "",
    subsection: "",
    system: "",
    topic: "",
    subtopics: [""],
    exam_type: "USMLE_STEP1",
    year: new Date().getFullYear(),
    difficulty: "medium",
    specialty: "",
    state_specific: null,
    clinical_setting: "",
    question_type: "single_best_answer",
    question: "",
    options: ["", "", "", ""],
    answer: "",
    explanation: "",
}

type Subject = {
    _id: string
    name: string
}

type Subsection = {
    _id: string
    name: string
}

export default function CombinedQuestionForm() {
    const [questions, setQuestions] = useState<Question[]>([{ ...initialQuestion }])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [subsections, setSubsections] = useState<Subsection[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<ValidationError[]>([])
    const [touched, setTouched] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await axios.get<Subject[]>(`${API_BASE_URL}/subject`)
                setSubjects(response.data)
            } catch (error) {
                console.error("Error fetching subjects:", error)
                toast.error("Failed to load subjects")
            }
        }
        fetchSubjects()
    }, [])

    useEffect(() => {
        const fetchSubsections = async () => {
            if (questions[0].subject) {
                try {
                    const response = await axios.get<Subsection[]>(`${API_BASE_URL}/subject/${questions[0].subject}/subsections`)
                    setSubsections(response.data)
                } catch (error) {
                    console.error("Error fetching subsections:", error)
                    toast.error("Failed to load subsections")
                }
            } else {
                setSubsections([])
            }
        }
        fetchSubsections()
    }, [questions])

    const validateField = (value: string, type: "question" | "option" | "explanation"): string | null => {
        if (!value.trim()) return "This field is required"
        if (value.length < VALIDATION_RULES[type].min) return `Must be at least ${VALIDATION_RULES[type].min} characters`
        if (value.length > VALIDATION_RULES[type].max) return `Must be less than ${VALIDATION_RULES[type].max} characters`
        return null
    }

    const validateForm = (): ValidationError[] => {
        const newErrors: ValidationError[] = []

        questions.forEach((question, questionIndex) => {
            if (!question.subject) newErrors.push({ field: `subject-${questionIndex}`, message: "Please select a subject" })
            if (!question.subsection)
                newErrors.push({ field: `subsection-${questionIndex}`, message: "Please select a subsection" })
            if (!question.system.trim()) newErrors.push({ field: `system-${questionIndex}`, message: "System is required" })
            if (!question.topic.trim()) newErrors.push({ field: `topic-${questionIndex}`, message: "Topic is required" })
            if (question.subtopics.length === 0 || question.subtopics.some((st) => !st.trim())) {
                newErrors.push({ field: `subtopics-${questionIndex}`, message: "At least one non-empty subtopic is required" })
            }
            if (!question.exam_type) newErrors.push({ field: `exam_type-${questionIndex}`, message: "Exam type is required" })
            if (!question.difficulty)
                newErrors.push({ field: `difficulty-${questionIndex}`, message: "Difficulty is required" })
            if (!question.specialty.trim())
                newErrors.push({ field: `specialty-${questionIndex}`, message: "Specialty is required" })
            if (!question.clinical_setting.trim())
                newErrors.push({ field: `clinical_setting-${questionIndex}`, message: "Clinical setting is required" })
            if (!question.question_type)
                newErrors.push({ field: `question_type-${questionIndex}`, message: "Question type is required" })

            const questionError = validateField(question.question, "question")
            if (questionError) newErrors.push({ field: `question-${questionIndex}`, message: questionError })

            question.options.forEach((option, optionIndex) => {
                const optionError = validateField(option, "option")
                if (optionError) newErrors.push({ field: `option-${questionIndex}-${optionIndex}`, message: optionError })
            })

            if (!question.answer)
                newErrors.push({ field: `answer-${questionIndex}`, message: "Please select a correct answer" })

            const explanationError = validateField(question.explanation, "explanation")
            if (explanationError) newErrors.push({ field: `explanation-${questionIndex}`, message: explanationError })

            if (isNaN(question.year) || question.year < 1900 || question.year > new Date().getFullYear()) {
                newErrors.push({ field: `year-${questionIndex}`, message: "Please enter a valid year" })
            }
        })

        return newErrors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            setErrors(validationErrors)
            setIsSubmitting(false)
            toast.error("Please fix the validation errors")
            return
        }

        try {
            const preparedQuestions = questions.map((q) => ({
                ...q,
                year: Number(q.year),
                subtopics: q.subtopics.filter((st) => st.trim() !== ""),
                subject: q.subject, // This is already the _id
                subsection: q.subsection, // This is already the _id
            }))
            const response = await axios.post(`${API_BASE_URL}/questions`, preparedQuestions)
            if (response.status === 201) {
                toast.success("Questions created successfully")
                setQuestions([{ ...initialQuestion }])
                setErrors([])
                setTouched(new Set())
            }
        } catch (error) {
            console.error("Error:", error)
            toast.error("An error occurred while submitting the questions")
        } finally {
            setIsSubmitting(false)
        }
    }

    const addQuestion = () => {
        setQuestions((prev) => [...prev, { ...initialQuestion }])
    }

    const removeQuestion = (index: number) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index))
        setErrors(errors.filter((error) => !error.field.startsWith(`question-${index}`)))
    }

    const updateQuestion = (questionIndex: number, field: keyof Question, value: string | string[] | number) => {
        setQuestions((prev) => {
            const newQuestions = [...prev]
            newQuestions[questionIndex] = { ...newQuestions[questionIndex], [field]: value }
            return newQuestions
        })
        setTouched((prev) => new Set(prev).add(`${field}-${questionIndex}`))
    }

    const getFieldError = (fieldId: string) => {
        return errors.find((error) => error.field === fieldId)?.message
    }

    const isFieldTouched = (fieldId: string) => {
        return touched.has(fieldId)
    }

    return (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">

            <div className="container mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Upload Questions</h1>
                <QuestionFileUpload />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mx-auto p-6">
                <Toaster position="top-right" />
                {questions.map((question, questionIndex) => (
                    <Card key={questionIndex}>
                        <CardHeader>
                            <CardTitle>Question {questionIndex + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`subject-${questionIndex}`}>Subject</Label>
                                    <Select
                                        value={question.subject}
                                        onValueChange={(value) => {
                                            updateQuestion(questionIndex, "subject", value)
                                            updateQuestion(questionIndex, "subsection", "")
                                        }}
                                    >
                                        <SelectTrigger className={getFieldError(`subject-${questionIndex}`) ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select a subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((subject) => (
                                                <SelectItem key={subject._id} value={subject._id}>
                                                    {subject.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError(`subject-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`subject-${questionIndex}`)}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`subsection-${questionIndex}`}>Subsection</Label>
                                    <Select
                                        value={question.subsection}
                                        onValueChange={(value) => updateQuestion(questionIndex, "subsection", value)}
                                        disabled={!question.subject}
                                    >
                                        <SelectTrigger className={getFieldError(`subsection-${questionIndex}`) ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select a subsection" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subsections.map((subsection) => (
                                                <SelectItem key={subsection._id} value={subsection._id}>
                                                    {subsection.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError(`subsection-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`subsection-${questionIndex}`)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`question-${questionIndex}`}>Question Text</Label>
                                <Textarea
                                    id={`question-${questionIndex}`}
                                    value={question.question}
                                    onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                                    className={getFieldError(`question-${questionIndex}`) ? "border-red-500" : ""}
                                />
                                {isFieldTouched(`question-${questionIndex}`) && getFieldError(`question-${questionIndex}`) && (
                                    <p className="text-sm text-red-500">{getFieldError(`question-${questionIndex}`)}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {question.question.length}/{VALIDATION_RULES.question.max} characters
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Options</Label>
                                {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex gap-2 items-center">
                                        <Input
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...question.options] as [string, string, string, string]
                                                newOptions[optionIndex] = e.target.value
                                                updateQuestion(questionIndex, "options", newOptions)
                                            }}
                                            className={getFieldError(`option-${questionIndex}-${optionIndex}`) ? "border-red-500" : ""}
                                        />
                                        <Button
                                            type="button"
                                            variant={option === question.answer ? "default" : "outline"}
                                            onClick={() => updateQuestion(questionIndex, "answer", option)}
                                        >
                                            {option === question.answer ? "Correct" : "Set as Correct"}
                                        </Button>
                                    </div>
                                ))}
                                {getFieldError(`answer-${questionIndex}`) && (
                                    <p className="text-sm text-red-500">{getFieldError(`answer-${questionIndex}`)}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`explanation-${questionIndex}`}>Explanation</Label>
                                <Textarea
                                    id={`explanation-${questionIndex}`}
                                    value={question.explanation}
                                    onChange={(e) => updateQuestion(questionIndex, "explanation", e.target.value)}
                                    className={getFieldError(`explanation-${questionIndex}`) ? "border-red-500" : ""}
                                />
                                {isFieldTouched(`explanation-${questionIndex}`) && getFieldError(`explanation-${questionIndex}`) && (
                                    <p className="text-sm text-red-500">{getFieldError(`explanation-${questionIndex}`)}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {question.explanation.length}/{VALIDATION_RULES.explanation.max} characters
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`exam_type-${questionIndex}`}>Exam Type</Label>
                                    <Select
                                        value={question.exam_type}
                                        onValueChange={(value) =>
                                            updateQuestion(questionIndex, "exam_type", value as (typeof EXAM_TYPES)[number])
                                        }
                                    >
                                        <SelectTrigger className={getFieldError(`exam_type-${questionIndex}`) ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select exam type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EXAM_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError(`exam_type-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`exam_type-${questionIndex}`)}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`difficulty-${questionIndex}`}>Difficulty</Label>
                                    <Select
                                        value={question.difficulty}
                                        onValueChange={(value) =>
                                            updateQuestion(questionIndex, "difficulty", value as (typeof DIFFICULTY_LEVELS)[number])
                                        }
                                    >
                                        <SelectTrigger className={getFieldError(`difficulty-${questionIndex}`) ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIFFICULTY_LEVELS.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError(`difficulty-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`difficulty-${questionIndex}`)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`system-${questionIndex}`}>System</Label>
                                    <Input
                                        id={`system-${questionIndex}`}
                                        value={question.system}
                                        onChange={(e) => updateQuestion(questionIndex, "system", e.target.value)}
                                    />
                                    {getFieldError(`system-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`system-${questionIndex}`)}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`topic-${questionIndex}`}>Topic</Label>
                                    <Input
                                        id={`topic-${questionIndex}`}
                                        value={question.topic}
                                        onChange={(e) => updateQuestion(questionIndex, "topic", e.target.value)}
                                    />
                                    {getFieldError(`topic-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`topic-${questionIndex}`)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`subtopics-${questionIndex}`}>Subtopics</Label>
                                {question.subtopics.map((subtopic, subtopicIndex) => (
                                    <div key={subtopicIndex} className="flex gap-2">
                                        <Input
                                            value={subtopic}
                                            onChange={(e) => {
                                                const newSubtopics = [...question.subtopics]
                                                newSubtopics[subtopicIndex] = e.target.value
                                                updateQuestion(questionIndex, "subtopics", newSubtopics)
                                            }}
                                        />
                                        {question.subtopics.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => {
                                                    const newSubtopics = question.subtopics.filter((_, i) => i !== subtopicIndex)
                                                    updateQuestion(questionIndex, "subtopics", newSubtopics)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const newSubtopics = [...question.subtopics, ""]
                                        updateQuestion(questionIndex, "subtopics", newSubtopics)
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Subtopic
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`specialty-${questionIndex}`}>Specialty</Label>
                                    <Input
                                        id={`specialty-${questionIndex}`}
                                        value={question.specialty}
                                        onChange={(e) => updateQuestion(questionIndex, "specialty", e.target.value)}
                                    />
                                    {getFieldError(`specialty-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`specialty-${questionIndex}`)}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`clinical_setting-${questionIndex}`}>Clinical Setting</Label>
                                    <Input
                                        id={`clinical_setting-${questionIndex}`}
                                        value={question.clinical_setting}
                                        onChange={(e) => updateQuestion(questionIndex, "clinical_setting", e.target.value)}
                                    />
                                    {getFieldError(`clinical_setting-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`clinical_setting-${questionIndex}`)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`state_specific-${questionIndex}`}>State Specific</Label>
                                    <Input
                                        id={`state_specific-${questionIndex}`}
                                        value={question.state_specific || ""}
                                        onChange={(e) => updateQuestion(questionIndex, "state_specific", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`question_type-${questionIndex}`}>Question Type</Label>
                                    <Select
                                        value={question.question_type}
                                        onValueChange={(value) =>
                                            updateQuestion(questionIndex, "question_type", value as (typeof QUESTION_TYPES)[number])
                                        }
                                    >
                                        <SelectTrigger className={getFieldError(`question_type-${questionIndex}`) ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select question type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QUESTION_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace("_", " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError(`question_type-${questionIndex}`) && (
                                        <p className="text-sm text-red-500">{getFieldError(`question_type-${questionIndex}`)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`year-${questionIndex}`}>Year</Label>
                                <Input
                                    id={`year-${questionIndex}`}
                                    type="number"
                                    value={question.year}
                                    onChange={(e) => updateQuestion(questionIndex, "year", Number.parseInt(e.target.value, 10))}
                                />
                                {getFieldError(`year-${questionIndex}`) && (
                                    <p className="text-sm text-red-500">{getFieldError(`year-${questionIndex}`)}</p>
                                )}
                            </div>

                            {questions.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => removeQuestion(questionIndex)}
                                    className="mt-4"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Remove Question
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}

                <div className="flex justify-between">
                    <Button type="button" onClick={addQuestion} variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="h-4 w-4 mr-2" /> {isSubmitting ? "Submitting..." : "Submit All Questions"}
                    </Button>
                </div>
            </form>
        </div>
    )
}