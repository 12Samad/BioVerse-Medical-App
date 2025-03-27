"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Filter,
  Lightbulb,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Tag,
  Trash2,
  X,
  XCircle,
  Calendar,
  Clock,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import toast, { Toaster } from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import apiService, { type Flashcard } from "@/services/api-service"
import FlashcardForm from "./flashcard-form"
import AutoFlashcardGenerator from "@/components/auto-flashcard-generator"

// Import our new components
import FlashcardReviewStatus from "@/components/flashcard-review-status"
import ReviewControls from "@/components/review-controls"
import spacedRepetitionService from "@/services/spaced-repetition-service"
import ChallengeMode from "@/components/challenge-mode"
import ThemeStatistics from "@/components/theme-statistics"

export default function FlashcardsPage() {
  // State for flashcards and filtering
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [flipping, setFlipping] = useState(false)

  // Filters and search state
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [reviewFilter, setReviewFilter] = useState<"all" | "due" | "overdue" | "today">("all")

  // UI state
  const [activeTab, setActiveTab] = useState("browse")
  const [isNewCardDialogOpen, setIsNewCardDialogOpen] = useState(false)
  const [isEditCardDialogOpen, setIsEditCardDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [studyProgress, setStudyProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingReview, setIsProcessingReview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [showAutoGenerator, setShowAutoGenerator] = useState(false)

  // Default flashcard template
  const defaultFlashcard: Partial<Flashcard> = {
    question: "",
    answer: "",
    hint: "",
    category: "",
    difficulty: "medium",
    tags: [],
    mastery: 0,
    reviewCount: 0,
    userId: "",
    reviewStage: 0,
    reviewPriority: null,
  }

  // Initialize user ID from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("Medical_User_Id")
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      // Handle case where user ID is not available
      toast.error("User ID not found. Please log in again.")
      // You could redirect to login page here
    }
  }, [])

  // Extract unique categories from flashcards
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set<string>()
    flashcards.forEach((card) => {
      if (card && card.category) categorySet.add(card.category)
    })
    return Array.from(categorySet)
  }, [flashcards])

  // Extract unique tags from flashcards
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>()
    flashcards.forEach((card) => {
      if (card && card.tags && Array.isArray(card.tags)) {
        card.tags.forEach((tag) => {
          if (tag) tagSet.add(tag)
        })
      }
    })
    return Array.from(tagSet)
  }, [flashcards])

  // Calculate due and overdue cards
  const { dueCount, overdueCount, todayCount } = useMemo(() => {
    const now = new Date()
    let due = 0
    let overdue = 0
    let today = 0

    flashcards.forEach((card) => {
      if (card.nextReviewDate) {
        const reviewDate = new Date(card.nextReviewDate)

        // Check if due today
        if (reviewDate.toDateString() === now.toDateString()) {
          today++
        }
        // Check if overdue
        else if (reviewDate < now) {
          overdue++
        }
        // Check if due in the next 3 days
        else if (reviewDate <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)) {
          due++
        }
      }
    })

    return { dueCount: due, overdueCount: overdue, todayCount: today }
  }, [flashcards])

  // Fetch flashcards based on selected filters
  const fetchFlashcards = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // Prepare filter parameters
      const params: Record<string, string> = {}

      if (categoryFilter) {
        params.category = categoryFilter
      }

      if (difficultyFilter) {
        params.difficulty = difficultyFilter
      }

      if (tagFilter) {
        params.tag = tagFilter
      }

      const response = await apiService.getFlashcards(params)
      setFlashcards(response.data)

      // Apply review filter
      applyFilters(response.data, searchQuery, reviewFilter)
    } catch (error) {
      console.error("Error fetching flashcards:", error)

      // Set a user-friendly error message for the UI
      if (error && typeof error === "object" && "message" in error) {
        setError((error as Error).message || "Failed to load flashcards")
      } else {
        setError("Failed to load flashcards. Please try again later.")
      }

      setFlashcards([])
      setFilteredCards([])
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter, difficultyFilter, tagFilter, userId, reviewFilter, searchQuery])

  // Apply filters to cards
  const applyFilters = useCallback((cards: Flashcard[], query: string, reviewFilterValue: string) => {
    let filtered = [...cards]

    // Apply search query filter
    if (query.trim() !== "") {
      const lowercaseQuery = query.toLowerCase()
      filtered = filtered.filter((card) => {
        const questionMatch = card.question && card.question.toLowerCase().includes(lowercaseQuery)
        const answerMatch = card.answer && card.answer.toLowerCase().includes(lowercaseQuery)
        const tagsMatch =
          card.tags &&
          Array.isArray(card.tags) &&
          card.tags.some((tag) => tag && tag.toLowerCase().includes(lowercaseQuery))
        const categoryMatch = card.category && card.category.toLowerCase().includes(lowercaseQuery)

        return questionMatch || answerMatch || tagsMatch || categoryMatch
      })
    }

    // Apply review filter
    const now = new Date()
    if (reviewFilterValue === "due") {
      filtered = filtered.filter((card) => {
        if (!card.nextReviewDate) return false
        const reviewDate = new Date(card.nextReviewDate)
        return reviewDate > now && reviewDate <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      })
    } else if (reviewFilterValue === "overdue") {
      filtered = filtered.filter((card) => {
        if (!card.nextReviewDate) return false
        return new Date(card.nextReviewDate) < now
      })
    } else if (reviewFilterValue === "today") {
      filtered = filtered.filter((card) => {
        if (!card.nextReviewDate) return false
        const reviewDate = new Date(card.nextReviewDate)
        return reviewDate.toDateString() === now.toDateString()
      })
    }

    // Sort by priority and review date
    filtered.sort((a, b) => {
      // First by review priority (higher first)
      const priorityDiff = getPriorityValue(b.reviewPriority) - getPriorityValue(a.reviewPriority)
      if (priorityDiff !== 0) return priorityDiff

      // Then by review date (earlier first)
      if (a.nextReviewDate && b.nextReviewDate) {
        return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
      }

      // Cards without review date go last
      if (a.nextReviewDate && !b.nextReviewDate) return -1
      if (!a.nextReviewDate && b.nextReviewDate) return 1

      return 0
    })

    setFilteredCards(filtered)
    setCurrentCard(0)
  }, [])

  // Helper function to convert priority to numeric value for sorting
  const getPriorityValue = (priority: "high" | "medium" | "low" | null | undefined): number => {
    if (!priority) return 0
    if (priority === "high") return 3
    if (priority === "medium") return 2
    if (priority === "low") return 1
    return 0
  }

  // Initial data load
  useEffect(() => {
    if (userId) {
      fetchFlashcards()
    }
  }, [fetchFlashcards, userId])

  // Update filtered cards when search query or review filter changes
  useEffect(() => {
    applyFilters(flashcards, searchQuery, reviewFilter)
  }, [searchQuery, reviewFilter, flashcards, applyFilters])

  // Calculate overall study progress
  useEffect(() => {
    if (filteredCards.length > 0) {
      const totalMastery = filteredCards.reduce((sum, card) => sum + (card.mastery || 0), 0)
      const progress = totalMastery / filteredCards.length
      setStudyProgress(progress)
    } else {
      setStudyProgress(0)
    }
  }, [filteredCards])

  // Navigation functions
  const nextCard = () => {
    if (filteredCards.length === 0) return
    setCurrentCard((prev) => (prev + 1) % filteredCards.length)
    setShowAnswer(false)
  }

  const prevCard = () => {
    if (filteredCards.length === 0) return
    setCurrentCard((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
    setShowAnswer(false)
  }

  const flipCard = () => {
    setFlipping(true)
    setTimeout(() => {
      setShowAnswer((prev) => !prev)
      setFlipping(false)
    }, 150)
  }

  const shuffleCards = () => {
    if (filteredCards.length <= 1) {
      toast.error("Not enough cards to shuffle")
      return
    }

    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
    setFilteredCards(shuffled)
    setCurrentCard(0)
    setShowAnswer(false)
    toast.success("Cards shuffled")
  }

  // Handle filter changes
  const handleFilterCategoryChange = (value: string) => {
    setCategoryFilter(value === "all_categories" ? "" : value)
  }

  const handleFilterDifficultyChange = (value: string) => {
    setDifficultyFilter(value === "all_difficulties" ? "" : value)
  }

  const handleFilterTagChange = (value: string) => {
    setTagFilter(value === "all_tags" ? "" : value)
  }

  const handleReviewFilterChange = (value: string) => {
    setReviewFilter(value as "all" | "due" | "overdue" | "today")
  }

  // Form submission handlers
  const handleNewCardSubmit = async (data: Partial<Flashcard>) => {
    setIsSubmitting(true)

    try {
      const response = await apiService.createFlashcard({
        ...data,
        userId,
        reviewStage: 0,
        reviewPriority: null,
      })

      setFlashcards((prevCards) => [...prevCards, response.data])
      setFilteredCards((prevCards) => [...prevCards, response.data])
      setCurrentCard(filteredCards.length)
      setIsNewCardDialogOpen(false)

      toast.success("New flashcard created successfully")
    } catch (error) {
      apiService.handleApiError(error, "Failed to create flashcard")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle auto-generated flashcards
  const handleFlashcardsGenerated = (newFlashcards: Flashcard[]) => {
    // Add the generated flashcards to the state
    setFlashcards((prevCards) => [...prevCards, ...newFlashcards])
    setFilteredCards((prevCards) => [...prevCards, ...newFlashcards])

    // Show a success message
    toast.success(`${newFlashcards.length} flashcards generated from your missed questions`)

    // Hide the generator after successful generation
    setShowAutoGenerator(false)
  }

  // Edit card handlers
  const openEditDialog = (card: Flashcard) => {
    setEditingCard({ ...card })
    setIsEditCardDialogOpen(true)
  }

  const handleUpdateCardSubmit = async (data: Partial<Flashcard>) => {
    if (!editingCard || !editingCard.id) {
      toast.error("Missing flashcard ID")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiService.updateFlashcard(editingCard.id, {
        ...data,
        userId,
      })

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((card) => (card.id === response.data.id ? response.data : card)))

      setFilteredCards((prevCards) => prevCards.map((card) => (card.id === response.data.id ? response.data : card)))

      setIsEditCardDialogOpen(false)
      setEditingCard(null)

      toast.success("Flashcard updated successfully")
    } catch (error) {
      apiService.handleApiError(error, "Failed to update flashcard")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCard = async (id: string) => {
    try {
      await apiService.deleteFlashcard(id)

      // Remove the card from state
      setFlashcards((prevCards) => prevCards.filter((card) => card.id !== id))
      setFilteredCards((prevCards) => prevCards.filter((card) => card.id !== id))

      // Adjust current card index if needed
      if (currentCard >= filteredCards.length - 1) {
        setCurrentCard(Math.max(0, filteredCards.length - 2))
      }

      setIsEditCardDialogOpen(false)
      setEditingCard(null)

      toast.success("Flashcard deleted successfully")
    } catch (error) {
      apiService.handleApiError(error, "Failed to delete flashcard")
    }
  }

  // Spaced repetition functions
  const markCardForLater = async (priority: "low" | "medium" | "high") => {
    if (filteredCards.length === 0) return

    const card = filteredCards[currentCard]
    setIsProcessingReview(true)

    try {
      // Calculate updated card fields using the spaced repetition service
      const updatedFields = spacedRepetitionService.scheduleNextReview(card, {
        priority,
      })

      const updatedCard = {
        ...card,
        ...updatedFields,
        reviewCount: card.reviewCount + 1,
      }

      if (!card.id) {
        throw new Error("Card ID is missing")
      }

      const response = await apiService.updateFlashcard(card.id, updatedCard)

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      setFilteredCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      nextCard()
      toast.success(`Card scheduled for ${priority} priority review`)
    } catch (error) {
      apiService.handleApiError(error, "Failed to schedule card for later review")
      nextCard() // Still move to next card even if there was an error
    } finally {
      setIsProcessingReview(false)
    }
  }

  const markCardAsMastered = async () => {
    if (filteredCards.length === 0) return

    const card = filteredCards[currentCard]
    setIsProcessingReview(true)

    try {
      // Set card to mastered state
      const updatedFields = spacedRepetitionService.scheduleNextReview(card, {
        mastery: 100,
        reviewStage: 5, // Mastered stage
      })

      const updatedCard = {
        ...card,
        ...updatedFields,
        mastery: 100,
        reviewCount: card.reviewCount + 1,
      }

      if (!card.id) {
        throw new Error("Card ID is missing")
      }

      const response = await apiService.updateFlashcard(card.id, updatedCard)

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      setFilteredCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      // Update overall study progress
      const totalMastery = filteredCards.reduce((sum, card, index) => {
        return sum + (index === currentCard ? 100 : card.mastery)
      }, 0)

      const newProgress = totalMastery / filteredCards.length
      setStudyProgress(newProgress)

      nextCard()
      toast.success("Card marked as mastered! 🎉")
    } catch (error) {
      apiService.handleApiError(error, "Failed to mark card as mastered")
      nextCard() // Still move to next card even if there was an error
    } finally {
      setIsProcessingReview(false)
    }
  }

  // Update the existing markCardAsKnown function
  const markCardAsKnown = async () => {
    if (filteredCards.length === 0) return

    const card = filteredCards[currentCard]
    setIsProcessingReview(true)

    try {
      // Calculate new mastery level (increase by 10-20% based on current level)
      const masteryIncrease = card.mastery < 50 ? 20 : 10
      const newMastery = Math.min(100, card.mastery + masteryIncrease)

      // Use the spaced repetition service to calculate the next review date
      const updatedFields = spacedRepetitionService.scheduleNextReview(card, {
        mastery: newMastery,
      })

      const updatedCard = {
        ...card,
        ...updatedFields,
        mastery: newMastery,
        reviewCount: card.reviewCount + 1,
      }

      if (!card.id) {
        throw new Error("Card ID is missing")
      }

      const response = await apiService.updateFlashcard(card.id, updatedCard)

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      setFilteredCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      // Update overall study progress
      const totalMastery = filteredCards.reduce((sum, card, index) => {
        return sum + (index === currentCard ? newMastery : card.mastery)
      }, 0)

      const newProgress = totalMastery / filteredCards.length
      setStudyProgress(newProgress)

      nextCard()
      toast.success("Card marked as known")
    } catch (error) {
      apiService.handleApiError(error, "Failed to update card progress")
      nextCard() // Still move to next card even if there was an error
    } finally {
      setIsProcessingReview(false)
    }
  }

  // Update the existing markCardAsUnknown function
  const markCardAsUnknown = async () => {
    if (filteredCards.length === 0) return

    const card = filteredCards[currentCard]
    setIsProcessingReview(true)

    try {
      // Decrease mastery level (by 5-10% based on current level)
      const masteryDecrease = card.mastery > 50 ? 10 : 5
      const newMastery = Math.max(0, card.mastery - masteryDecrease)

      // Use the spaced repetition service to calculate the next review date
      const updatedFields = spacedRepetitionService.scheduleNextReview(card, {
        mastery: newMastery,
        priority: "medium", // Schedule for review soon
      })

      const updatedCard = {
        ...card,
        ...updatedFields,
        mastery: newMastery,
        reviewCount: card.reviewCount + 1,
      }

      if (!card.id) {
        throw new Error("Card ID is missing")
      }

      const response = await apiService.updateFlashcard(card.id, updatedCard)

      // Update the cards in state
      setFlashcards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))
      setFilteredCards((prevCards) => prevCards.map((c) => (c.id === response.data.id ? response.data : c)))

      // Update overall study progress
      const totalMastery = filteredCards.reduce((sum, card, index) => {
        return sum + (index === currentCard ? newMastery : card.mastery)
      }, 0)

      const newProgress = totalMastery / filteredCards.length
      setStudyProgress(newProgress)

      nextCard()
      toast("Card marked as difficult", { icon: "📝" })
    } catch (error) {
      apiService.handleApiError(error, "Failed to update card progress")
      nextCard() // Still move to next card even if there was an error
    } finally {
      setIsProcessingReview(false)
    }
  }

  // Add a new function to fetch due cards
  const fetchDueCards = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch all cards
      const response = await apiService.getFlashcards({})

      // Filter to get only due cards and sort by priority
      const allCards = response.data
      const dueCards = spacedRepetitionService.getDueCards(allCards)
      const sortedDueCards = spacedRepetitionService.sortCardsByPriority(dueCards)

      setFlashcards(allCards)
      setFilteredCards(sortedDueCards)
      setCurrentCard(0)

      if (sortedDueCards.length === 0) {
        toast.success("No cards due for review! 🎉")
      } else {
        toast.success(`${sortedDueCards.length} cards due for review`)
      }
    } catch (error) {
      console.error("Error fetching due cards:", error)

      if (error && typeof error === "object" && "message" in error) {
        setError((error as Error).message || "Failed to load due cards")
      } else {
        setError("Failed to load due cards. Please try again later.")
      }

      setFlashcards([])
      setFilteredCards([])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl text-gray-700 font-bold">Flashcards</h1>
          <div className="flex gap-3">
            <ChallengeMode flashcards={flashcards} />
            <Button
              onClick={() => setShowAutoGenerator(!showAutoGenerator)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {showAutoGenerator ? "Hide Generator" : "Auto-Generate Flashcards"}
            </Button>
          </div>
        </div>

        {/* Auto Flashcard Generator */}
        {showAutoGenerator && (
          <div className="mb-8">
            <AutoFlashcardGenerator userId={userId} onFlashcardsGenerated={handleFlashcardsGenerated} />
          </div>
        )}

        {/* Review Status Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-amber-800">Due Today</h3>
                <p className="text-2xl font-bold text-amber-600">{todayCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-800">Coming Up</h3>
                <p className="text-2xl font-bold text-blue-600">{dueCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-800">Overdue</h3>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="due" onClick={fetchDueCards}>
              Due Reviews
            </TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-slate-400"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex space-x-3 w-full md:w-auto">
                <Dialog open={isNewCardDialogOpen} onOpenChange={setIsNewCardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      New Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <FlashcardForm
                      initialData={defaultFlashcard}
                      onSubmit={handleNewCardSubmit}
                      onCancel={() => setIsNewCardDialogOpen(false)}
                      isSubmitting={isSubmitting}
                      title="Add New Flashcard"
                      submitLabel="Add Card"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
              </div>

              <div className="flex flex-wrap gap-3 w-full">
                <Select value={categoryFilter} onValueChange={handleFilterCategoryChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_categories">All categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={handleFilterDifficultyChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_difficulties">All difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tagFilter} onValueChange={handleFilterTagChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_tags">All tags</SelectItem>
                    {uniqueTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* New Review Status Filter */}
                <Select value={reviewFilter} onValueChange={handleReviewFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All cards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cards</SelectItem>
                    <SelectItem value="today">Due today ({todayCount})</SelectItem>
                    <SelectItem value="due">Coming up ({dueCount})</SelectItem>
                    <SelectItem value="overdue">Overdue ({overdueCount})</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" size="icon" onClick={shuffleCards}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Flashcard */}
            {isLoading ? (
              <div className="flex justify-center items-center h-[28rem]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Error Loading Cards</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={() => fetchFlashcards()}>Try Again</Button>
                </CardContent>
              </Card>
            ) : filteredCards.length === 0 ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Cards Found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {searchQuery ? "No cards match your search criteria." : "There are no cards in this category."}
                  </p>
                  <Button onClick={() => setIsNewCardDialogOpen(true)}>Create New Card</Button>
                </CardContent>
              </Card>
            ) : (
              // Add defensive checks for card rendering
              filteredCards.length > 0 &&
              currentCard < filteredCards.length && (
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCard}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card
                        className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-hidden
                          ${flipping ? "scale-95 opacity-50" : ""}
                          ${showAnswer ? "bg-indigo-50 dark:bg-indigo-950" : "bg-white dark:bg-slate-800"}`}
                      >
                        <CardHeader className="p-0">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex flex-col gap-2">
                              <Badge
                                variant="outline"
                                className="text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-950"
                              >
                                {filteredCards[currentCard]?.category || "Uncategorized"}
                              </Badge>
                              <Badge
                                variant={
                                  filteredCards[currentCard]?.difficulty === "easy"
                                    ? "default"
                                    : filteredCards[currentCard]?.difficulty === "hard"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="w-fit"
                              >
                                {(filteredCards[currentCard]?.difficulty || "medium").charAt(0).toUpperCase() +
                                  (filteredCards[currentCard]?.difficulty || "medium").slice(1)}
                              </Badge>

                              {/* Display review schedule badge */}
                              {filteredCards[currentCard]?.nextReviewDate && (
                                <FlashcardReviewStatus
                                  nextReviewDate={filteredCards[currentCard].nextReviewDate}
                                  lastReviewedDate={filteredCards[currentCard].lastReviewedDate ?? null}
                                  reviewStage={filteredCards[currentCard].reviewStage || 0}
                                />
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">
                                Card {currentCard + 1}/{filteredCards.length}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(filteredCards[currentCard])}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                      <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Delete Card</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Are you sure you want to delete this card? This action cannot be undone.
                                        </p>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            filteredCards[currentCard]?.id &&
                                            handleDeleteCard(filteredCards[currentCard].id as string)
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-grow flex items-center justify-center p-0">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={showAnswer ? "answer" : "question"}
                              initial={{ opacity: 0, rotateY: 180 }}
                              animate={{ opacity: 1, rotateY: 0 }}
                              exit={{ opacity: 0, rotateY: -180 }}
                              transition={{ duration: 0.5 }}
                              className="w-full h-full flex flex-col items-center justify-center"
                            >
                              {showAnswer ? (
                                <div className="text-center">
                                  <Badge className="mb-4 bg-green-500">Answer</Badge>
                                  <p className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                                    {filteredCards[currentCard]?.answer || "No answer provided"}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Badge className="mb-4 bg-indigo-500">Question</Badge>
                                  <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                                    {filteredCards[currentCard]?.question || "No question provided"}
                                  </p>
                                  {filteredCards[currentCard]?.hint && (
                                    <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 inline-block">
                                      <Lightbulb className="text-amber-500 inline mr-2 h-5 w-5" />
                                      <span className="text-slate-700 dark:text-slate-300 italic">
                                        {filteredCards[currentCard]?.hint}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </CardContent>

                        <CardFooter className="p-0 flex flex-col gap-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {filteredCards[currentCard]?.tags &&
                              Array.isArray(filteredCards[currentCard]?.tags) &&
                              filteredCards[currentCard]?.tags.map((tag, index) => (
                                <Badge key={`${tag}-${index}`} variant="outline" className="flex items-center gap-1">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                          </div>

                          {showAnswer ? (
                            <ReviewControls
                              onMarkKnown={markCardAsKnown}
                              onMarkUnknown={markCardAsUnknown}
                              onMarkForLater={markCardForLater}
                              onMarkMastered={markCardAsMastered}
                              isProcessing={isProcessingReview}
                            />
                          ) : (
                            <div className="flex justify-between items-center w-full">
                              <Button
                                variant="ghost"
                                onClick={prevCard}
                                disabled={filteredCards.length <= 1}
                                className="text-slate-600 dark:text-slate-400"
                              >
                                <ChevronLeft className="h-5 w-5 mr-1" />
                                Previous
                              </Button>

                              <Button onClick={flipCard} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6">
                                <RotateCcw className="mr-2 h-5 w-5" />
                                Reveal Answer
                              </Button>

                              <Button
                                variant="ghost"
                                onClick={nextCard}
                                disabled={filteredCards.length <= 1}
                                className="text-slate-600 dark:text-slate-400"
                              >
                                Next
                                <ChevronRight className="h-5 w-5 ml-1" />
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="study" className="mt-6">
            {/* Study Mode */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Study Progress</h2>
                <Badge variant="outline" className="text-indigo-500">
                  {Math.round(studyProgress)}% Mastery
                </Badge>
              </div>
              <Progress value={studyProgress} className="h-2" />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[28rem]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Error Loading Cards</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={() => fetchFlashcards()}>Try Again</Button>
                </CardContent>
              </Card>
            ) : filteredCards.length === 0 ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Cards to Study</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Select a different category or create new cards to study.
                  </p>
                  <Button onClick={() => setIsNewCardDialogOpen(true)}>Create New Card</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCard}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-hidden
                        ${flipping ? "scale-95 opacity-50" : ""}
                        ${showAnswer ? "bg-indigo-50 dark:bg-indigo-950" : "bg-white dark:bg-slate-800"}`}
                    >
                      <CardHeader className="p-0">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex flex-col gap-2">
                            <Badge
                              variant="outline"
                              className="text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-950"
                            >
                              {filteredCards[currentCard]?.category}
                            </Badge>
                            <Badge
                              variant={
                                filteredCards[currentCard]?.difficulty === "easy"
                                  ? "default"
                                  : filteredCards[currentCard]?.difficulty === "hard"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="w-fit"
                            >
                              {filteredCards[currentCard]?.difficulty.charAt(0).toUpperCase() +
                                filteredCards[currentCard]?.difficulty.slice(1)}
                            </Badge>

                            {/* Display review schedule badge */}
                            {filteredCards[currentCard]?.nextReviewDate && (
                              <FlashcardReviewStatus
                                nextReviewDate={filteredCards[currentCard].nextReviewDate}
                                lastReviewedDate={filteredCards[currentCard].lastReviewedDate}
                                reviewStage={filteredCards[currentCard].reviewStage || 0}
                              />
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              Card {currentCard + 1}/{filteredCards.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                Mastery: {filteredCards[currentCard]?.mastery}%
                              </span>
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${filteredCards[currentCard]?.mastery}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-grow flex items-center justify-center p-0">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={showAnswer ? "answer" : "question"}
                            initial={{ opacity: 0, rotateY: 180 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: -180 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full flex flex-col items-center justify-center"
                          >
                            {showAnswer ? (
                              <div className="text-center">
                                <Badge className="mb-4 bg-green-500">Answer</Badge>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                                  {filteredCards[currentCard]?.answer}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Badge className="mb-4 bg-indigo-500">Question</Badge>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                                  {filteredCards[currentCard]?.question}
                                </p>
                                {filteredCards[currentCard]?.hint && (
                                  <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 inline-block">
                                    <Lightbulb className="text-amber-500 inline mr-2 h-5 w-5" />
                                    <span className="text-slate-700 dark:text-slate-300 italic">
                                      {filteredCards[currentCard]?.hint}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </CardContent>

                      <CardFooter className="p-0 flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {filteredCards[currentCard]?.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="flex items-center gap-1">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {showAnswer ? (
                          <ReviewControls
                            onMarkKnown={markCardAsKnown}
                            onMarkUnknown={markCardAsUnknown}
                            onMarkForLater={markCardForLater}
                            onMarkMastered={markCardAsMastered}
                            isProcessing={isProcessingReview}
                          />
                        ) : (
                          <Button onClick={flipCard} className="bg-indigo-500 hover:bg-indigo-600 text-white w-full">
                            <RotateCcw className="mr-2 h-5 w-5" />
                            Reveal Answer
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="due" className="mt-6">
            {/* Due Reviews Mode */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Due Reviews</h2>
                <Button variant="outline" onClick={fetchDueCards} className="text-indigo-500">
                  <Clock className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[28rem]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Error Loading Cards</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={() => fetchDueCards()}>Try Again</Button>
                </CardContent>
              </Card>
            ) : filteredCards.length === 0 ? (
              <Card className="h-[28rem] flex items-center justify-center">
                <CardContent className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">All Caught Up!</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    You have no cards due for review. Great job staying on top of your studies!
                  </p>
                  <Button onClick={() => setActiveTab("browse")}>Browse All Cards</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCard}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      className={`h-[28rem] p-8 flex flex-col justify-between rounded-xl shadow-md overflow-hidden
                        ${flipping ? "scale-95 opacity-50" : ""}
                        ${showAnswer ? "bg-indigo-50 dark:bg-indigo-950" : "bg-white dark:bg-slate-800"}`}
                    >
                      <CardHeader className="p-0">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex flex-col gap-2">
                            <Badge
                              variant="outline"
                              className="text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-950"
                            >
                              {filteredCards[currentCard]?.category}
                            </Badge>
                            <Badge
                              variant={
                                filteredCards[currentCard]?.difficulty === "easy"
                                  ? "default"
                                  : filteredCards[currentCard]?.difficulty === "hard"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="w-fit"
                            >
                              {filteredCards[currentCard]?.difficulty.charAt(0).toUpperCase() +
                                filteredCards[currentCard]?.difficulty.slice(1)}
                            </Badge>

                            {/* Display review schedule badge */}
                            {filteredCards[currentCard]?.nextReviewDate && (
                              <FlashcardReviewStatus
                                nextReviewDate={filteredCards[currentCard].nextReviewDate}
                                lastReviewedDate={filteredCards[currentCard].lastReviewedDate}
                                reviewStage={filteredCards[currentCard].reviewStage || 0}
                              />
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              Card {currentCard + 1}/{filteredCards.length}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                Mastery: {filteredCards[currentCard]?.mastery}%
                              </span>
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${filteredCards[currentCard]?.mastery}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-grow flex items-center justify-center p-0">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={showAnswer ? "answer" : "question"}
                            initial={{ opacity: 0, rotateY: 180 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: -180 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full flex flex-col items-center justify-center"
                          >
                            {showAnswer ? (
                              <div className="text-center">
                                <Badge className="mb-4 bg-green-500">Answer</Badge>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white text-center">
                                  {filteredCards[currentCard]?.answer}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Badge className="mb-4 bg-indigo-500">Question</Badge>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
                                  {filteredCards[currentCard]?.question}
                                </p>
                                {filteredCards[currentCard]?.hint && (
                                  <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 inline-block">
                                    <Lightbulb className="text-amber-500 inline mr-2 h-5 w-5" />
                                    <span className="text-slate-700 dark:text-slate-300 italic">
                                      {filteredCards[currentCard]?.hint}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </CardContent>

                      <CardFooter className="p-0 flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {filteredCards[currentCard]?.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="flex items-center gap-1">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {showAnswer ? (
                          <ReviewControls
                            onMarkKnown={markCardAsKnown}
                            onMarkUnknown={markCardAsUnknown}
                            onMarkForLater={markCardForLater}
                            onMarkMastered={markCardAsMastered}
                            isProcessing={isProcessingReview}
                          />
                        ) : (
                          <Button onClick={flipCard} className="bg-indigo-500 hover:bg-indigo-600 text-white w-full">
                            <RotateCcw className="mr-2 h-5 w-5" />
                            Reveal Answer
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <ThemeStatistics flashcards={flashcards} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Card Dialog */}
      <Dialog open={isEditCardDialogOpen} onOpenChange={setIsEditCardDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          {editingCard && (
            <FlashcardForm
              initialData={editingCard}
              onSubmit={handleUpdateCardSubmit}
              onCancel={() => {
                setIsEditCardDialogOpen(false)
                setEditingCard(null)
              }}
              isSubmitting={isSubmitting}
              title="Edit Flashcard"
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
    </div>
  )
}

