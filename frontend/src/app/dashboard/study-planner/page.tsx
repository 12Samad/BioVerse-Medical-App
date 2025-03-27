"use client"

import type React from "react"

import axios from "axios"
import { AnimatePresence, motion } from "framer-motion"
import {
    AlertCircle,
    Award,
    Book,
    BookMarked,
    BookOpen,
    Brain,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit3,
    Eye,
    HandshakeIcon as HandsClapping,
    Headphones,
    Layers,
    Lightbulb,
    Loader2,
    Sparkles,
    Target,
    X,
    Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import StudyPlanResults from "./study-plan-results"

// Add these type definitions at the top of the file, after the imports

// Define types for form data
interface FormData {
    // Personal details
    name: string
    email: string
    currentLevel: "beginner" | "intermediate" | "advanced" | "expert"

    // Exam details
    targetExam: string
    examDate: string

    // Subject preferences
    strongSubjects: string[]
    weakSubjects: string[]

    // Study preferences
    availableHours: number
    daysPerWeek: number
    preferredTimeOfDay: "morning" | "afternoon" | "evening" | "night" | "mixed"
    preferredLearningStyle: "visual" | "auditory" | "reading" | "kinesthetic" | "mixed"

    // Goals and objectives
    targetScore: string
    specificGoals: string

    // Additional information
    additionalInfo: string
    previousScores: string
}

// Define types for form errors
interface FormErrors {
    [key: string]: string
}

// Define types for API response
interface StudyPlanWeeklyGoal {
    subject: string
    description: string
}

interface StudyPlanResource {
    name: string
    type: string
    description: string
}

interface StudyPlanTask {
    subject: string
    duration: number
    activity: string
    resources?: StudyPlanResource[]
}

interface StudyPlanDay {
    dayOfWeek: string
    focusAreas?: string[]
    tasks: StudyPlanTask[]
}

interface StudyPlanWeek {
    weekNumber: number
    theme: string
    focusAreas?: string[]
    weeklyGoals?: StudyPlanWeeklyGoal[]
    days?: StudyPlanDay[]
}

interface StudyPlanBook {
    title: string
    author: string
    description: string
    relevantTopics?: string[]
}

interface StudyPlanVideo {
    title: string
    platform: string
    description: string
    relevantTopics?: string[]
}

interface StudyPlanQuestionBank {
    title: string
    description: string
    relevantTopics?: string[]
}

interface StudyPlanResources {
    books?: StudyPlanBook[]
    videos?: StudyPlanVideo[]
    questionBanks?: StudyPlanQuestionBank[]
}

interface StudyPlanTip {
    title: string
    description: string
}

interface StudyPlanExamInfo {
    exam: string
    targetDate?: string
    targetScore?: string
}

interface StudyPlanData {
    title: string
    overview: string
    examInfo?: StudyPlanExamInfo
    weeklyPlans: StudyPlanWeek[]
    resources?: StudyPlanResources
    studyTips?: StudyPlanTip[]
}

interface StudyPlanMetadata {
    generatedAt: string
    model: string
    examName: string
    duration: string
}

interface StudyPlanResponse {
    plan: StudyPlanData
    metadata: StudyPlanMetadata
}

// Define types for component props
// interface LearningStyle {
//   value: string
//   label: string
//   icon: React.ReactNode
// }

// Update the component definition
const PlannerForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<number>(1)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [showSuccess, setShowSuccess] = useState<boolean>(false)
    const [animateDirection, setAnimateDirection] = useState<"left" | "right">("right")
    const [showTip, setShowTip] = useState<boolean>(false)
    const [currentTip, setCurrentTip] = useState<string>("")
    const [errors, setErrors] = useState<FormErrors>({})
    const [apiError, setApiError] = useState<string | null>(null)
    const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null)
    const [generationProgress, setGenerationProgress] = useState<number>(0)
    const [generationStage, setGenerationStage] = useState<string>("")
    const [hasExistingPlan, setHasExistingPlan] = useState<boolean>(false)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const studyTips: string[] = [
        "Spaced repetition is more effective than cramming",
        "Teaching concepts to others improves your own understanding",
        "Taking short breaks every 25-30 minutes can improve focus",
        "Mixing different subjects in one study session can improve retention",
        "Sleep is crucial for memory consolidation",
    ]


    useEffect(() => {
        // Show a random tip when the form loads
        const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)]
        setCurrentTip(randomTip)
        setShowTip(true)

        const tipTimer = setTimeout(() => {
            setShowTip(false)
        }, 8000)

        return () => clearTimeout(tipTimer)
    }, [])

    useEffect(() => {
        const savedPlan = localStorage.getItem("studyPlan")
        if (savedPlan) {
            try {
                const parsedPlan = JSON.parse(savedPlan)
                if (parsedPlan && parsedPlan.plan) {
                    setHasExistingPlan(true)
                }
            } catch (error) {
                console.error("Error parsing saved plan:", error)
                localStorage.removeItem("studyPlan")
            }
        }
    }, [])

    const [formData, setFormData] = useState<FormData>({
        // Personal details
        name: "",
        email: "",
        currentLevel: "beginner",

        // Exam details
        targetExam: "USMLE Step 1",
        examDate: "",

        // Subject preferences
        strongSubjects: [],
        weakSubjects: [],

        // Study preferences
        availableHours: 2,
        daysPerWeek: 5,
        preferredTimeOfDay: "morning",
        preferredLearningStyle: "visual",

        // Goals and objectives
        targetScore: "",
        specificGoals: "",

        // Additional information
        additionalInfo: "",
        previousScores: "",
    })

    useEffect(() => {
        const name = localStorage.getItem("name")
        const email = localStorage.getItem("email")

        if (name) {
            setFormData(prev => ({
                ...prev,
                name: name
            }))
        }

        if (email) {
            setFormData(prev => ({
                ...prev,
                email: email
            }))
        }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        // Clear error for this field if it exists
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    //   const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const { name, value, checked } = e.target

    //     setFormData((prev) => {
    //       if (checked) {
    //         return {
    //           ...prev,
    //           [name]: [...(prev[name as keyof FormData] as string[]), value],
    //         }
    //       } else {
    //         return {
    //           ...prev,
    //           [name]: (prev[name as keyof FormData] as string[]).filter((item) => item !== value),
    //         }
    //       }
    //     })

    //     // Clear error for this field if it exists
    //     if (errors[name]) {
    //       setErrors((prev) => {
    //         const newErrors = { ...prev }
    //         delete newErrors[name]
    //         return newErrors
    //       })
    //     }
    //   }

    const validateStep = (step: number): boolean => {
        const newErrors: FormErrors = {}

        switch (step) {
            case 1:
                if (!formData.name.trim()) newErrors.name = "Name is required"
                if (!formData.email.trim()) {
                    newErrors.email = "Email is required"
                } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                    newErrors.email = "Email is invalid"
                }
                break

            case 2:
                if (!formData.targetExam) newErrors.targetExam = "Target exam is required"
                if (formData.examDate) {
                    const examDate = new Date(formData.examDate)
                    const today = new Date()
                    if (examDate < today) {
                        newErrors.examDate = "Exam date cannot be in the past"
                    }
                }
                break

            case 3:
                if (formData.strongSubjects.length === 0) {
                    newErrors.strongSubjects = "Select at least one strong subject"
                }
                if (formData.weakSubjects.length === 0) {
                    newErrors.weakSubjects = "Select at least one weak subject"
                }
                break

            case 4:
                // These fields have default values, so no validation needed
                break

            case 5:
                // Optional fields, no validation needed
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const nextStep = (): void => {
        if (validateStep(currentStep)) {
            setAnimateDirection("right")
            // Add a small delay to prevent animation glitches
            setTimeout(() => {
                setCurrentStep((prev) => prev + 1)
            }, 50)

            // Show a random tip when moving to the next step
            if (Math.random() > 0.7) {
                const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)]
                setCurrentTip(randomTip)
                setShowTip(true)

                setTimeout(() => {
                    setShowTip(false)
                }, 5000)
            }
        }
    }

    const prevStep = (): void => {
        setAnimateDirection("left")
        setCurrentStep((prev) => prev - 1)
    }

    // Modify the simulateProgress function to match the 2-2.5 minute timeframe
    const simulateProgress = () => {
        setGenerationProgress(0)
        setGenerationStage("Analyzing your preferences...")

        const stages = [
            "Analyzing your preferences...",
            "Identifying optimal study patterns...",
            "Creating personalized schedule...",
            "Selecting recommended resources...",
            "Optimizing for your learning style...",
            "Finalizing your study plan...",
        ]

        let currentStage = 0

        // Slow down the progress to match 2-2.5 minutes (150 seconds)
        // We'll update roughly every 2 seconds, with 75 total updates
        const totalTime = 150000 // 2.5 minutes in milliseconds
        const updateInterval = 2000 // 2 seconds
        const incrementPerUpdate = 100 / (totalTime / updateInterval)

        progressIntervalRef.current = setInterval(() => {
            setGenerationProgress((prev) => {
                const newProgress = prev + incrementPerUpdate

                // Change stage at certain progress points
                if (newProgress > (currentStage + 1) * 16 && currentStage < stages.length - 1) {
                    currentStage++
                    setGenerationStage(stages[currentStage])

                    // Show a random tip when changing stages
                    const randomTip = studyTips[Math.floor(Math.random() * studyTips.length)]
                    setCurrentTip(randomTip)
                    setShowTip(true)

                    setTimeout(() => {
                        setShowTip(false)
                    }, 5000)
                }

                if (newProgress >= 98) {
                    if (progressIntervalRef.current) {
                        clearInterval(progressIntervalRef.current)
                    }
                    return 99
                }

                return newProgress
            })
        }, updateInterval)
    }

    const loadExistingPlan = () => {
        try {
            const savedPlan = localStorage.getItem("studyPlan")
            if (savedPlan) {
                const parsedPlan = JSON.parse(savedPlan)
                const savedUserData = localStorage.getItem("userData")
                const parsedUserData = savedUserData ? JSON.parse(savedUserData) : formData

                setStudyPlan(parsedPlan)
                setFormData(parsedUserData)
            }
        } catch (error) {
            console.error("Error loading saved plan:", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()

        // Validate final step
        if (!validateStep(currentStep)) {
            return
        }

        setIsSubmitting(true)
        setApiError(null)

        // Start progress simulation
        simulateProgress()

        try {
            // Save user data to localStorage
            localStorage.setItem("userData", JSON.stringify(formData))
            const userId = localStorage.getItem("Medical_User_Id")

            const response = await axios.post(`https://medical-backend-loj4.onrender.com/api/test/generatePlan?userId=${userId}`, formData, {
                headers: {
                    "Content-Type": "application/json",
                },
            })

            const result = response.data

            if (response.status !== 200) {
                throw new Error(result.error || "Failed to generate plan")
            }

            // Set progress to 100% when done
            setGenerationProgress(100)
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }

            // Store the study plan data
            const planData = result.data as StudyPlanResponse
            setStudyPlan(planData)

            // Save to localStorage
            localStorage.setItem("studyPlan", JSON.stringify(planData))

            // Show success message
            setShowSuccess(true)
        } catch (error) {
            console.error("Error generating plan:", error)
            setApiError((error as Error).message || "Failed to generate study plan. Please try again.")

            // Clear progress interval on error
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        }
    }, [])

    // Lists of subjects for checkboxes
    const allSubjects = [
        "Anatomy",
        "Physiology",
        "Biochemistry",
        "Pharmacology",
        "Pathology",
        "Microbiology",
        "Immunology",
        "Behavioral Science",
        "Biostatistics",
        "Genetics",
        "Nutrition",
        "Cell Biology",
    ]

    // Exam options
    const examOptions = [
        "USMLE Step 1",
        "USMLE Step 2",
        "USMLE Step 3",
        "COMLEX Level 1",
        "COMLEX Level 2",
        "COMLEX Level 3",
        "NCLEX-RN",
        "NCLEX-PN",
        "MCAT",
        "PANCE",
        "NEET",
        "PLAB",
    ]

    // Step titles and icons for the progress bar
    const stepInfo = [
        { title: "Personal", icon: <Edit3 size={16} /> },
        { title: "Exam", icon: <Target size={16} /> },
        { title: "Subjects", icon: <Book size={16} /> },
        { title: "Schedule", icon: <Clock size={16} /> },
        { title: "Goals", icon: <Award size={16} /> },
    ]

    // Animation variants for page transitions
    const pageVariants = {
        initial: (direction: "left" | "right") => ({
            x: direction === "right" ? 300 : -300,
            opacity: 0,
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        },
        exit: (direction: "left" | "right") => ({
            x: direction === "right" ? -300 : 300,
            opacity: 0,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        }),
    }

    // Render different form steps
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        className="space-y-4"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        custom={animateDirection}
                        key="step1"
                    >
                        <h2 className="text-xl font-semibold flex items-center text-blue-700">
                            <Edit3 className="mr-2 text-blue-500" size={20} />
                            Personal Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="group">
                                <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400`}
                                    required
                                    disabled={formData.name.length > 0}
                                    placeholder="Enter your full name"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500 flex items-center">
                                        <AlertCircle size={12} className="mr-1" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="group">
                                <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={formData.email.length > 0}
                                    className={`w-full p-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400`}
                                    required
                                    placeholder="your.email@example.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500 flex items-center">
                                        <AlertCircle size={12} className="mr-1" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Current Knowledge Level
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                {["beginner", "intermediate", "advanced", "expert"].map((level, index) => (
                                    <div
                                        key={level}
                                        onClick={() => setFormData((prev) => ({ ...prev, currentLevel: level as FormData["currentLevel"] }))}
                                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-300 ${formData.currentLevel === level
                                            ? "border-blue-500 bg-blue-50 shadow-md"
                                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                                            }`}
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${formData.currentLevel === level ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div
                                                className={`font-medium ${formData.currentLevel === level ? "text-blue-700" : "text-gray-700"}`}
                                            >
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {level === "beginner" && "Just starting out"}
                                                {level === "intermediate" && "Some knowledge"}
                                                {level === "advanced" && "Solid foundation"}
                                                {level === "expert" && "Focused review"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )

            case 2:
                return (
                    <motion.div
                        className="space-y-4"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        custom={animateDirection}
                        key="step2"
                    >
                        <h2 className="text-xl font-semibold flex items-center text-blue-700">
                            <Target className="mr-2 text-blue-500" size={20} />
                            Exam Details
                        </h2>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Target Exam <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="targetExam"
                                value={formData.targetExam}
                                onChange={handleInputChange}
                                className={`w-full p-2 border ${errors.targetExam ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400`}
                                required
                            >
                                {examOptions.map((exam) => (
                                    <option key={exam} value={exam}>
                                        {exam}
                                    </option>
                                ))}
                            </select>
                            {errors.targetExam && (
                                <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {errors.targetExam}
                                </p>
                            )}
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Target Exam Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="examDate"
                                    value={formData.examDate}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 pl-10 border ${errors.examDate ? "border-red-500" : "border-gray-300"} rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400`}
                                />
                            </div>
                            {errors.examDate && (
                                <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {errors.examDate}
                                </p>
                            )}
                            {formData.examDate && !errors.examDate && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm">
                                    <div className="flex items-center">
                                        <span className="text-blue-600 font-medium">
                                            {calculateDaysRemaining(formData.examDate)} days remaining
                                        </span>
                                        <div className="ml-2 h-2 bg-gray-200 rounded-full flex-grow">
                                            <div
                                                className={`h-2 rounded-full ${getDaysRemainingColor(formData.examDate)}`}
                                                style={{ width: `${Math.min(100, calculateDaysRemaining(formData.examDate) / 3)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Target Score/Percentile
                            </label>
                            <input
                                type="text"
                                name="targetScore"
                                value={formData.targetScore}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                                placeholder="e.g., 250+, 90th percentile"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Previous Scores (if any)
                            </label>
                            <textarea
                                name="previousScores"
                                value={formData.previousScores}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                                rows={2}
                                placeholder="e.g., NBME 25: 230, UWorld: 65%"
                            />
                        </div>
                    </motion.div>
                )

            case 3:
                return (
                    <motion.div
                        className="space-y-4"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        custom={animateDirection}
                        key="step3"
                    >
                        <h2 className="text-xl font-semibold flex items-center text-blue-700">
                            <Book className="mr-2 text-blue-500" size={20} />
                            Subject Assessment
                        </h2>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                                Strong Subjects <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {allSubjects.map((subject) => (
                                    <div
                                        key={`strong-${subject}`}
                                        onClick={() => {
                                            const isSelected = formData.strongSubjects.includes(subject)
                                            setFormData((prev) => ({
                                                ...prev,
                                                strongSubjects: isSelected
                                                    ? prev.strongSubjects.filter((s) => s !== subject)
                                                    : [...prev.strongSubjects, subject],
                                            }))

                                            // Clear error if at least one subject is selected
                                            if (errors.strongSubjects && !isSelected) {
                                                setErrors((prev) => {
                                                    const newErrors = { ...prev }
                                                    delete newErrors.strongSubjects
                                                    return newErrors
                                                })
                                            }
                                        }}
                                        className={`cursor-pointer p-2 rounded-md border transition-all duration-300 ${formData.strongSubjects.includes(subject)
                                            ? "border-green-500 bg-green-50"
                                            : errors.strongSubjects
                                                ? "border-red-200 hover:border-green-300 hover:bg-green-50/50"
                                                : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div
                                                className={`w-4 h-4 rounded-sm mr-2 flex items-center justify-center ${formData.strongSubjects.includes(subject)
                                                    ? "bg-green-500 text-white"
                                                    : "border border-gray-300"
                                                    }`}
                                            >
                                                {formData.strongSubjects.includes(subject) && <CheckCircle size={12} />}
                                            </div>
                                            <span
                                                className={`text-sm ${formData.strongSubjects.includes(subject) ? "text-green-700 font-medium" : "text-gray-700"}`}
                                            >
                                                {subject}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.strongSubjects && (
                                <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {errors.strongSubjects}
                                </p>
                            )}
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                                Weak Subjects <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {allSubjects.map((subject) => (
                                    <div
                                        key={`weak-${subject}`}
                                        onClick={() => {
                                            const isSelected = formData.weakSubjects.includes(subject)
                                            setFormData((prev) => ({
                                                ...prev,
                                                weakSubjects: isSelected
                                                    ? prev.weakSubjects.filter((s) => s !== subject)
                                                    : [...prev.weakSubjects, subject],
                                            }))

                                            // Clear error if at least one subject is selected
                                            if (errors.weakSubjects && !isSelected) {
                                                setErrors((prev) => {
                                                    const newErrors = { ...prev }
                                                    delete newErrors.weakSubjects
                                                    return newErrors
                                                })
                                            }
                                        }}
                                        className={`cursor-pointer p-2 rounded-md border transition-all duration-300 ${formData.weakSubjects.includes(subject)
                                            ? "border-amber-500 bg-amber-50"
                                            : errors.weakSubjects
                                                ? "border-red-200 hover:border-amber-300 hover:bg-amber-50/50"
                                                : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div
                                                className={`w-4 h-4 rounded-sm mr-2 flex items-center justify-center ${formData.weakSubjects.includes(subject) ? "bg-amber-500 text-white" : "border border-gray-300"
                                                    }`}
                                            >
                                                {formData.weakSubjects.includes(subject) && <CheckCircle size={12} />}
                                            </div>
                                            <span
                                                className={`text-sm ${formData.weakSubjects.includes(subject) ? "text-amber-700 font-medium" : "text-gray-700"}`}
                                            >
                                                {subject}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.weakSubjects && (
                                <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {errors.weakSubjects}
                                </p>
                            )}
                        </div>

                        {formData.strongSubjects.length > 0 && formData.weakSubjects.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-blue-50 border border-blue-100 rounded-lg"
                            >
                                <div className="flex items-start">
                                    <Lightbulb className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
                                    <div className="text-sm text-blue-700">
                                        <span className="font-medium">Pro tip:</span> Your study plan will focus more on your weak subjects
                                        while using your strong subjects as foundation for related concepts.
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )

            case 4:
                return (
                    <motion.div
                        className="space-y-4"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        custom={animateDirection}
                        key="step4"
                    >
                        <h2 className="text-xl font-semibold flex items-center text-blue-700">
                            <Clock className="mr-2 text-blue-500" size={20} />
                            Study Preferences
                        </h2>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Hours Available for Study Daily
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="range"
                                    name="availableHours"
                                    min="1"
                                    max="6"
                                    value={formData.availableHours}
                                    onChange={handleInputChange}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="ml-3 w-8 text-center font-medium text-blue-600">{formData.availableHours}h</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1h</span>
                                <span>2h</span>
                                <span>3h</span>
                                <span>4h</span>
                                <span>5h</span>
                                <span>6h+</span>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Days Per Week for Study
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[3, 4, 5, 6, 7].map((day) => (
                                    <div
                                        key={day}
                                        onClick={() => setFormData((prev) => ({ ...prev, daysPerWeek: day }))}
                                        className={`cursor-pointer w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${formData.daysPerWeek === day
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                                            }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                {formData.daysPerWeek} days per week × {formData.availableHours} hours ={" "}
                                {formData.daysPerWeek * formData.availableHours} hours total per week
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Preferred Time of Day
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {["morning", "afternoon", "evening", "night", "mixed"].map((time) => (
                                    <div
                                        key={time}
                                        onClick={() => setFormData((prev) => ({ ...prev, preferredTimeOfDay: time as FormData["preferredTimeOfDay"] }))}
                                        className={`cursor-pointer p-2 rounded-md border text-center transition-all duration-300 ${formData.preferredTimeOfDay === time
                                            ? "border-blue-500 bg-blue-50 shadow-sm"
                                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                                            }`}
                                    >
                                        <span
                                            className={`text-sm ${formData.preferredTimeOfDay === time ? "text-blue-700 font-medium" : "text-gray-700"}`}
                                        >
                                            {time.charAt(0).toUpperCase() + time.slice(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Preferred Learning Style
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                                {[
                                    { value: "visual", label: "Visual", icon: <Eye size={18} /> },
                                    { value: "auditory", label: "Auditory", icon: <Headphones size={18} /> },
                                    { value: "reading", label: "Reading", icon: <BookOpen size={18} /> },
                                    { value: "kinesthetic", label: "Kinesthetic", icon: <HandsClapping size={18} /> },
                                    { value: "mixed", label: "Mixed", icon: <Layers size={18} /> },
                                ].map((style) => (
                                    <div
                                        key={style.value}
                                        onClick={() => setFormData((prev) => ({ ...prev, preferredLearningStyle: style.value as FormData["preferredLearningStyle"] }))}
                                        className={`cursor-pointer p-3 rounded-md border transition-all duration-300 ${formData.preferredLearningStyle === style.value
                                            ? "border-purple-500 bg-purple-50 shadow-sm"
                                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                                            }`}
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${formData.preferredLearningStyle === style.value
                                                    ? "bg-purple-500 text-white"
                                                    : "bg-gray-100 text-gray-500"
                                                    }`}
                                            >
                                                {style.icon}
                                            </div>
                                            <span
                                                className={`text-sm ${formData.preferredLearningStyle === style.value ? "text-purple-700 font-medium" : "text-gray-700"}`}
                                            >
                                                {style.label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )

            case 5:
                return (
                    <motion.div
                        className="space-y-4"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        custom={animateDirection}
                        key="step5"
                    >
                        <h2 className="text-xl font-semibold flex items-center text-blue-700">
                            <Award className="mr-2 text-blue-500" size={20} />
                            Goals & Additional Information
                        </h2>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Specific Goals or Objectives
                            </label>
                            <textarea
                                name="specificGoals"
                                value={formData.specificGoals}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                                rows={3}
                                placeholder="e.g., Improve understanding of cardiac physiology, master pharmacology concepts"
                            />
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-blue-600 transition-colors">
                                Additional Information
                            </label>
                            <textarea
                                name="additionalInfo"
                                value={formData.additionalInfo}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                                rows={3}
                                placeholder="Any other information that might help us create a better plan for you"
                            />
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                                <Sparkles className="mr-2 text-blue-500" size={18} />
                                Your Study Plan Will Include:
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start">
                                    <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                                    <span className="text-sm text-gray-700">Personalized daily and weekly schedule</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                                    <span className="text-sm text-gray-700">Recommended resources for each subject</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                                    <span className="text-sm text-gray-700">Focus on your weak subjects with targeted practice</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                                    <span className="text-sm text-gray-700">Progress tracking and milestone recommendations</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                                    <span className="text-sm text-gray-700">Adaptive adjustments based on your performance</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                )

            default:
                return null
        }
    }

    // Helper functions

    const calculateDaysRemaining = (dateString: string): number => {
        const targetDate = new Date(dateString)
        const today = new Date()
        const diffTime = targetDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : 0
    }

    const getDaysRemainingColor = (dateString: string): string => {
        const days = calculateDaysRemaining(dateString)
        if (days < 30) return "bg-red-500"
        if (days < 90) return "bg-amber-500"
        return "bg-green-500"
    }

    // If we have a study plan, show the results component
    if (studyPlan) {
        return <StudyPlanResults plan={studyPlan} userData={formData} onReset={() => setStudyPlan(null)} />
    }

    if (isSubmitting) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-lg shadow-md"
            >
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Zap className="mr-2 text-blue-600" size={24} />
                    Generating Your Personalized Study Plan
                </h2>

                <div className="mb-6">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-blue-700">{generationStage}</span>
                        <span className="text-sm font-medium text-blue-700">{Math.round(generationProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${generationProgress}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <Lightbulb className="text-blue-500 mr-2 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="font-medium text-blue-800 mb-1">Study Tip</h3>
                            <p className="text-sm text-blue-700">{currentTip}</p>
                        </div>
                    </div>
                </div>

                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            </motion.div>
        )
    }

    // Success message after form submission
    if (showSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-lg shadow-md text-center"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                    className="flex justify-center mb-4"
                >
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 1] }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <CheckCircle size={48} className="text-white" />
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-green-500 rounded-full"
                        />
                    </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Plan Generated Successfully!</h2>
                <p className="text-gray-600 mb-4">Your personalized study plan has been created and is ready to view.</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center mx-auto"
                    onClick={() => setStudyPlan(studyPlan)}
                >
                    <BookMarked className="mr-2" size={18} />
                    View Your Plan
                </motion.button>
            </motion.div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md relative overflow-hidden">
            {hasExistingPlan && !studyPlan && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <BookMarked className="text-blue-600 mr-2" size={20} />
                            <div>
                                <h3 className="font-medium text-blue-800">You have a saved study plan</h3>
                                <p className="text-sm text-blue-600">You can continue with your previous plan or create a new one.</p>
                            </div>
                        </div>
                        <button
                            onClick={loadExistingPlan}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <BookOpen className="mr-2" size={16} />
                            Load Saved Plan
                        </button>
                    </div>
                </div>
            )}
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-70 -z-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-tr-full opacity-70 -z-10"></div>

            {/* Study tip toast notification */}
            <AnimatePresence>
                {showTip && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg max-w-xs z-10"
                    >
                        <div className="flex items-start">
                            <Lightbulb className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                            <div>
                                <div className="font-medium text-sm mb-1">Study Tip</div>
                                <div className="text-xs">{currentTip}</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* API Error message */}
            <AnimatePresence>
                {apiError && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-10"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex">
                                <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                                <div>
                                    <div className="font-medium text-sm">Error</div>
                                    <div className="text-xs">{apiError}</div>
                                </div>
                            </div>
                            <button onClick={() => setApiError(null)} className="text-white hover:text-red-100">
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    <Brain className="mr-2 text-blue-600" size={24} />
                    AI-Powered Study Planner
                </h1>
                <p className="text-gray-600">
                    Answer a few questions to get a personalized study plan tailored to your needs, goals, and schedule.
                </p>
            </div>

            {/* Progress indicator */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {stepInfo.map((step, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => {
                                if (index + 1 < currentStep) {
                                    setAnimateDirection("left")
                                    setCurrentStep(index + 1)
                                }
                            }}
                            className={`relative cursor-pointer ${index + 1 < currentStep ? "cursor-pointer" : "cursor-default"}`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > index + 1
                                    ? "bg-green-500 text-white"
                                    : currentStep === index + 1
                                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {currentStep > index + 1 ? <CheckCircle size={16} /> : step.icon}
                            </div>
                            <div
                                className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${currentStep === index + 1 ? "text-blue-700" : "text-gray-500"
                                    }`}
                            >
                                {step.title}
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-8">
                    <motion.div
                        initial={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                        animate={{ width: `${(currentStep / 5) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className="bg-blue-600 h-2 rounded-full"
                    ></motion.div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait" initial={false} custom={animateDirection}>
                    {renderStep()}
                </AnimatePresence>

                <div className="mt-8 flex justify-between">
                    {currentStep > 1 ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={prevStep}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center"
                        >
                            <ChevronLeft className="mr-1" size={18} />
                            Previous
                        </motion.button>
                    ) : (
                        <div></div> // Empty div to maintain flex spacing
                    )}

                    {currentStep < 5 ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={nextStep}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                            Next
                            <ChevronRight className="ml-1" size={18} />
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "#047857" }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            onClick={(e) => {
                                if (isSubmitting) {
                                    e.preventDefault()
                                }
                            }}
                            disabled={isSubmitting}
                            className={`px-4 py-2 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                                } text-white rounded-md transition-colors flex items-center shadow-md`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 animate-spin" size={18} />
                                    Generating Plan...
                                </>
                            ) : (
                                <>
                                    <Zap className="mr-2" size={18} />
                                    Generate Study Plan
                                </>
                            )}
                        </motion.button>
                    )}
                </div>
            </form>
        </div>
    )
}

// Update the component props for the custom icon components

// Replace the existing icon component definitions with these typed versions:

// interface IconProps {
//     size: number
//     className?: string
// }

// const EyeIcon: React.FC<IconProps> = ({ size, className }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width={size}
//     height={size}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={className}
//   >
//     <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
//     <circle cx="12" cy="12" r="3" />
//   </svg>
// )

// const HeadphonesIcon: React.FC<IconProps> = ({ size, className }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width={size}
//     height={size}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={className}
//   >
//     <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
//   </svg>
// )

// const HandsClappingIcon: React.FC<IconProps> = ({ size, className }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width={size}
//     height={size}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={className}
//   >
//     <path d="M9 12.5 7 14a4 4 0 0 1-6-3v-2a6 6 0 0 1 12 0v5" />
//     <path d="M18 5.5 20 4a4 4 0 0 1 6 3v2a6 6 0 0 1-12 0v-5" />
//   </svg>
// )

// const LayersIcon: React.FC<IconProps> = ({ size, className }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width={size}
//     height={size}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={className}
//   >
//     <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
//     <path d="m22 12.18-8.58 3.91a2 2 0 0 1-1.66 0L2 12.18" />
//     <path d="m22 16.18-8.58 3.91a2 2 0 0 1-1.66 0L2 16.18" />
//   </svg>
// )

// const Loader2Icon: React.FC<IconProps> = ({ size, className }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     width={size}
//     height={size}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//     className={className}
//   >
//     <path d="M21 12a9 9 0 1 1-6.219-8.56" />
//   </svg>
// )

export default PlannerForm

