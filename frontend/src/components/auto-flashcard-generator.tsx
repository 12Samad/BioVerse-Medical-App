"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Lightbulb, Brain, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import apiService, { type Flashcard } from "@/services/api-service"
import missedQuestionsService, { type MissedQuestion } from "@/services/missed-questions-service"
import toast from "react-hot-toast"

interface AutoFlashcardGeneratorProps {
  userId: string
  onFlashcardsGenerated: (flashcards: Flashcard[]) => void
}

// Common medical subjects and their related tags
const SUBJECT_TAGS_MAP: Record<string, string[]> = {
  Anatomy: ["Structural", "Gross Anatomy", "Neuroanatomy", "Histology"],
  Physiology: ["Function", "Homeostasis", "Regulation", "Systems"],
  Pathology: ["Disease", "Pathogenesis", "Morphology", "Clinical"],
  Pharmacology: ["Drugs", "Mechanisms", "Side Effects", "Therapeutics"],
  Biochemistry: ["Metabolism", "Molecular", "Enzymes", "Genetics"],
  Microbiology: ["Bacteria", "Viruses", "Fungi", "Parasites", "Infection"],
  Immunology: ["Immune System", "Antibodies", "Inflammation", "Hypersensitivity"],
  Endocrine: ["Hormones", "Regulation", "Feedback", "Glands"],
  Cardiovascular: ["Heart", "Vessels", "Circulation", "Hemodynamics"],
  Respiratory: ["Lungs", "Ventilation", "Gas Exchange", "Breathing"],
  Gastrointestinal: ["Digestion", "Absorption", "GI Tract", "Liver"],
  Renal: ["Kidney", "Filtration", "Electrolytes", "Acid-Base"],
  Neurology: ["Brain", "Nerves", "CNS", "PNS", "Neurotransmitters"],
  Psychiatry: ["Mental Health", "Disorders", "Behavior", "Therapy"],
  Hematology: ["Blood", "Coagulation", "Cells", "Anemia"],
  Oncology: ["Cancer", "Tumors", "Metastasis", "Therapy"],
}

// High-yield topics for USMLE
const HIGH_YIELD_TOPICS = [
  "Pathophysiology",
  "Clinical Presentation",
  "Diagnosis",
  "Treatment",
  "First Aid",
  "Epidemiology",
  "Risk Factors",
  "Complications",
]

export default function AutoFlashcardGenerator({ userId, onFlashcardsGenerated }: AutoFlashcardGeneratorProps) {
  const [missedQuestions, setMissedQuestions] = useState<MissedQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("missed")

  // Fetch missed questions from recent tests
  const fetchMissedQuestions = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // Use the new missedQuestionsService instead of apiService
      const response = await missedQuestionsService.getMissedQuestions(userId)
      setMissedQuestions(response.data || [])

      // Auto-select all questions by default
      setSelectedQuestions(response.data.map((q: MissedQuestion) => q.id))
    } catch (error) {
      console.error("Error fetching missed questions:", error)
      toast.error("Failed to load missed questions")
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchMissedQuestions()
  }, [fetchMissedQuestions])

  // Toggle question selection
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  // Select or deselect all questions
  const toggleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedQuestions(missedQuestions.map((q) => q.id))
    } else {
      setSelectedQuestions([])
    }
  }

  // Determine difficulty based on question content and user performance
  const determineDifficulty = (question: MissedQuestion): "easy" | "medium" | "hard" => {
    // Use the question's original difficulty if available
    if (question.difficulty) {
      const normalizedDifficulty = question.difficulty.toLowerCase()
      if (normalizedDifficulty === "easy" || normalizedDifficulty === "medium" || normalizedDifficulty === "hard") {
        return normalizedDifficulty as "easy" | "medium" | "hard"
      }
    }

    // Otherwise, use heuristics to determine difficulty
    // Complex questions with longer text tend to be harder
    const questionLength = question.question.length
    const answerLength = question.correctAnswer.length

    if (questionLength > 300 || answerLength > 150) {
      return "hard"
    } else if (questionLength > 150 || answerLength > 80) {
      return "medium"
    } else {
      return "easy"
    }
  }

  // Generate tags based on subject, topic, and content
  const generateTags = (question: MissedQuestion): string[] => {
    const tags: Set<string> = new Set()

    // Add subject as a tag
    if (question.subject) {
      tags.add(question.subject)

      // Add related tags based on subject
      const subjectKey = Object.keys(SUBJECT_TAGS_MAP).find(
        (key) => key.toLowerCase() === question.subject.toLowerCase(),
      )

      if (subjectKey && SUBJECT_TAGS_MAP[subjectKey]) {
        // Add up to 2 random related tags
        const relatedTags = SUBJECT_TAGS_MAP[subjectKey]
        const shuffled = [...relatedTags].sort(() => 0.5 - Math.random())
        shuffled.slice(0, 2).forEach((tag) => tags.add(tag))
      }
    }

    // Add topic as a tag
    if (question.topic) {
      tags.add(question.topic)
    }

    // Check for high-yield topics in the question or explanation
    const combinedText = `${question.question} ${question.explanation}`.toLowerCase()
    HIGH_YIELD_TOPICS.forEach((topic) => {
      if (combinedText.includes(topic.toLowerCase())) {
        tags.add(topic)
      }
    })

    // Add "High-Yield" tag for important concepts
    if (
      combinedText.includes("high yield") ||
      combinedText.includes("important") ||
      combinedText.includes("commonly tested")
    ) {
      tags.add("High-Yield")
    }

    // Add source tag to track where this flashcard came from
    tags.add(`Test-${question.testId}`)

    // Limit to 5 tags maximum
    return Array.from(tags).slice(0, 5)
  }

  // Create a concise flashcard from a missed question
  const createFlashcardFromQuestion = (question: MissedQuestion): Flashcard => {
    // Extract the core question by removing any case presentation if it's too long
    let flashcardQuestion = question.question
    if (flashcardQuestion.length > 200) {
      // Try to find the actual question which often comes after phrases like "Which of the following"
      const questionPhrases = [
        "which of the following",
        "what is the most likely",
        "what is the diagnosis",
        "what would be the best",
      ]

      for (const phrase of questionPhrases) {
        const index = flashcardQuestion.toLowerCase().indexOf(phrase)
        if (index > 50) {
          flashcardQuestion = flashcardQuestion.substring(index)
          break
        }
      }
    }

    // Create a concise answer, using the explanation if available
    let flashcardAnswer = question.correctAnswer
    if (question.explanation && question.explanation.length > 0) {
      // Extract the most relevant part of the explanation
      const sentences = question.explanation.split(/[.!?]+/)
      if (sentences.length > 1) {
        // Use the first 1-2 sentences of the explanation
        flashcardAnswer = `${question.correctAnswer}. ${sentences.slice(0, 2).join(". ")}.`
      } else {
        flashcardAnswer = `${question.correctAnswer}. ${question.explanation}`
      }
    }

    // Generate hint from the explanation if available
    let hintText = ""
    if (question.explanation && question.explanation.length > 0) {
      const keyPhrases = ["key feature", "remember", "important", "characteristic", "hallmark"]
      const explanationLower = question.explanation.toLowerCase()

      for (const phrase of keyPhrases) {
        const index = explanationLower.indexOf(phrase)
        if (index >= 0) {
          // Extract the sentence containing the key phrase
          const start = explanationLower.lastIndexOf(".", index) + 1
          const end = explanationLower.indexOf(".", index) + 1
          if (start < end) {
            hintText = question.explanation.substring(start, end).trim()
            break
          }
        }
      }

      // If no key phrase found, use a generic hint
      if (!hintText && question.userAnswer) {
        hintText = `You previously answered "${question.userAnswer}" instead of "${question.correctAnswer}"`
      }
    }

    // If still no hint, add source information
    if (!hintText) {
      hintText = `From Test: ${question.testId} (${question.testDate})`
    }

    // Create the flashcard object with only properties that exist in your Flashcard interface
    return {
      id: `auto_${question.id}`,
      question: flashcardQuestion,
      answer: flashcardAnswer,
      hint: hintText,
      category: question.subject || "Uncategorized",
      difficulty: determineDifficulty(question),
      tags: generateTags(question),
      mastery: 0,
      reviewCount: 0,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Generate flashcards from selected missed questions
  const generateFlashcards = async () => {
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question")
      return
    }

    setIsGenerating(true)
    try {
      // Filter selected questions
      const questionsToProcess = missedQuestions.filter((q) => selectedQuestions.includes(q.id))

      // Generate flashcards
      const newFlashcards = questionsToProcess.map(createFlashcardFromQuestion)

      // In a real implementation, you would save these to your API
      // const savedFlashcards = await Promise.all(
      //   newFlashcards.map(card => apiService.createFlashcard(card))
      // )

      setGeneratedFlashcards(newFlashcards)
      onFlashcardsGenerated(newFlashcards)
      setActiveTab("generated")

      toast.success(`Generated ${newFlashcards.length} flashcards`)
    } catch (error) {
      console.error("Error generating flashcards:", error)
      toast.error("Failed to generate flashcards")
    } finally {
      setIsGenerating(false)
    }
  }

  // Save generated flashcards to the database
  const saveFlashcards = async () => {
    if (generatedFlashcards.length === 0) {
      toast.error("No flashcards to save")
      return
    }

    setIsGenerating(true)
    try {
      // In a real implementation, save to your API
      await Promise.all(generatedFlashcards.map((card) => apiService.createFlashcard(card)))

      toast.success(`Saved ${generatedFlashcards.length} flashcards`)

      // Clear generated flashcards after saving
      setGeneratedFlashcards([])
      setActiveTab("missed")

      // Refresh missed questions
      fetchMissedQuestions()
    } catch (error) {
      console.error("Error saving flashcards:", error)
      toast.error("Failed to save flashcards")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Automatic Flashcard Generator
        </CardTitle>
        <CardDescription>
          Create flashcards from your missed or skipped questions to improve your knowledge
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="missed">Missed Questions</TabsTrigger>
          <TabsTrigger value="generated">Generated Flashcards</TabsTrigger>
        </TabsList>

        <TabsContent value="missed">
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : missedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-700">No Missed Questions Found</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Complete more practice tests to generate flashcards from your mistakes.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedQuestions.length === missedQuestions.length}
                      onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                      Select All ({missedQuestions.length})
                    </label>
                  </div>
                  <Badge variant="outline" className="text-primary">
                    {selectedQuestions.length} Selected
                  </Badge>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {missedQuestions.map((question) => (
                      <div key={question.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`question-${question.id}`}
                            checked={selectedQuestions.includes(question.id)}
                            onCheckedChange={() => toggleQuestionSelection(question.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {question.subject || "Unknown Subject"}
                              </Badge>
                              {question.topic && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {question.topic}
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  question.difficulty === "easy"
                                    ? "default"
                                    : question.difficulty === "hard"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="ml-auto"
                              >
                                {question.difficulty || "Medium"}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-slate-800 mb-2 line-clamp-2">{question.question}</p>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <Brain className="h-3 w-3" />
                              <span>Correct: {question.correctAnswer}</span>
                            </div>
                            {question.userAnswer && (
                              <div className="text-xs text-red-500 flex items-center gap-2 mt-1">
                                <AlertCircle className="h-3 w-3" />
                                <span>Your answer: {question.userAnswer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={generateFlashcards}
              disabled={isGenerating || selectedQuestions.length === 0 || isLoading}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Generate Flashcards ({selectedQuestions.length})
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>

        <TabsContent value="generated">
          <CardContent>
            {generatedFlashcards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-700">No Flashcards Generated Yet</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Select missed questions and generate flashcards to see them here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {generatedFlashcards.map((flashcard) => (
                    <div key={flashcard.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {flashcard.category}
                        </Badge>
                        <Badge
                          variant={
                            flashcard.difficulty === "easy"
                              ? "default"
                              : flashcard.difficulty === "hard"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {flashcard.difficulty.charAt(0).toUpperCase() + flashcard.difficulty.slice(1)}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-slate-800 mb-1">Question:</h4>
                        <p className="text-sm text-slate-600">{flashcard.question}</p>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-slate-800 mb-1">Answer:</h4>
                        <p className="text-sm text-slate-600">{flashcard.answer}</p>
                      </div>

                      {flashcard.hint && (
                        <div className="mb-3 bg-amber-50 p-2 rounded-md">
                          <h4 className="text-sm font-medium text-amber-800 mb-1 flex items-center">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Hint:
                          </h4>
                          <p className="text-sm text-amber-700">{flashcard.hint}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {flashcard.tags.map((tag, index) => (
                          <Badge key={`${flashcard.id}-${tag}-${index}`} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("missed")} disabled={isGenerating}>
              Back to Questions
            </Button>
            <Button
              onClick={saveFlashcards}
              disabled={isGenerating || generatedFlashcards.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save All Flashcards
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

