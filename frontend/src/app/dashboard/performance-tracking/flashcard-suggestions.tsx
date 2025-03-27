"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { BookOpen, Brain, FileText, Info, Lightbulb, Sparkles, Star } from 'lucide-react'
import { useState } from "react"

interface Question {
  questionId: string
  questionText: string
  userAnswer: string
  correctAnswer: string
  timeSpent: number
}

interface TestResult {
  userId: string
  questions: Question[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
}

interface FlashcardSuggestionsProps {
  performanceData: TestResult[]
  isLoading?: boolean
  className?: string
}

interface MissedTopic {
  topic: string
  count: number
  questions: Question[]
  relatedConcepts: string[]
}

export default function FlashcardSuggestions({
  performanceData,
  isLoading = false,
  className = "",
}: FlashcardSuggestionsProps) {
  const [activeTab, setActiveTab] = useState("flashcards")

  // Extract topics from question text using a simple keyword extraction
  // In a real implementation, this would use more sophisticated NLP or be based on metadata from the backend
  const extractTopicFromQuestion = (questionText: string): string => {
    // Common medical topics/keywords to look for
    const medicalTopics = [
      "Cardiovascular",
      "Respiratory",
      "Gastrointestinal",
      "Neurology",
      "Endocrine",
      "Renal",
      "Hematology",
      "Immunology",
      "Infectious Disease",
      "Pharmacology",
      "Pathology",
      "Anatomy",
      "Physiology",
      "Biochemistry",
      "Genetics",
      "Oncology",
      "Pediatrics",
      "Obstetrics",
      "Gynecology",
      "Psychiatry",
      "Dermatology",
      "Orthopedics",
    ]

    // Check if any of the medical topics appear in the question
    for (const topic of medicalTopics) {
      if (questionText.toLowerCase().includes(topic.toLowerCase())) {
        return topic
      }
    }

    // If no specific topic is found, try to extract a key term
    const words = questionText.split(" ")
    const keyTerms = words.filter((word) => word.length > 7 && /^[A-Z]/.test(word))
    
    if (keyTerms.length > 0) {
      return keyTerms[0].replace(/[.,;:?!]/g, '')
    }

    return "General Medicine" // Default topic if nothing specific is found
  }

  // Generate related concepts for a topic
  const generateRelatedConcepts = (topic: string): string[] => {
    const conceptMap: Record<string, string[]> = {
      "Cardiovascular": ["Heart anatomy", "ECG interpretation", "Cardiac cycle", "Heart failure", "Arrhythmias"],
      "Respiratory": ["Lung anatomy", "Pulmonary function", "Respiratory disorders", "Ventilation", "Gas exchange"],
      "Gastrointestinal": ["Digestive system", "Liver function", "GI disorders", "Nutrition", "Metabolism"],
      "Neurology": ["Brain anatomy", "Nervous system", "Neurological disorders", "Reflexes", "Neurotransmitters"],
      "Endocrine": ["Hormones", "Endocrine glands", "Diabetes", "Thyroid disorders", "Feedback mechanisms"],
      "Renal": ["Kidney anatomy", "Nephron function", "Electrolyte balance", "Acid-base balance", "Renal disorders"],
      "Pharmacology": ["Drug mechanisms", "Pharmacokinetics", "Drug interactions", "Adverse effects", "Therapeutic uses"],
      "General Medicine": ["Medical terminology", "Diagnostic procedures", "Treatment approaches", "Patient assessment", "Clinical reasoning"],
    }

    return conceptMap[topic] || [
      "Key definitions", 
      "Fundamental concepts", 
      "Clinical applications", 
      "Diagnostic criteria",
      "Treatment guidelines"
    ]
  }

  // Analyze incorrect answers to identify missed topics
  const analyzeMissedTopics = (): MissedTopic[] => {
    if (!performanceData || performanceData.length === 0) {
      return []
    }

    const incorrectQuestions: Question[] = []
    
    // Collect all incorrect questions from all tests
    performanceData.forEach(test => {
      test.questions.forEach(question => {
        if (question.userAnswer !== question.correctAnswer) {
          incorrectQuestions.push(question)
        }
      })
    })

    // Group questions by topic
    const topicMap: Record<string, Question[]> = {}
    incorrectQuestions.forEach(question => {
      const topic = extractTopicFromQuestion(question.questionText)
      if (!topicMap[topic]) {
        topicMap[topic] = []
      }
      topicMap[topic].push(question)
    })

    // Convert to array and sort by frequency
    const missedTopics: MissedTopic[] = Object.entries(topicMap).map(([topic, questions]) => ({
      topic,
      count: questions.length,
      questions,
      relatedConcepts: generateRelatedConcepts(topic)
    }))

    return missedTopics.sort((a, b) => b.count - a.count)
  }

  const missedTopics = analyzeMissedTopics()

  // Generate flashcard content based on missed questions
  const generateFlashcardContent = (question: Question): { front: string; back: string } => {
    // Remove the actual question and convert to a flashcard format
    const questionText = question.questionText
    
    // For front of card, turn the question into a concept question
    let front = questionText
      .replace(/What is/, "Define")
      .replace(/Which of the following/, "")
      .replace(/Choose the correct/, "")
      .replace(/\?/, "")
      .trim()
    
    // If the question is too long, simplify it
    if (front.length > 100) {
      const topic = extractTopicFromQuestion(questionText)
      front = `Explain the key concepts related to ${topic} in this context: ${front.substring(0, 80)}...`
    }
    
    // For back of card, provide the correct answer with explanation
    const back = `${question.correctAnswer}\n\nExplanation: This relates to ${extractTopicFromQuestion(questionText)} concepts. The correct answer demonstrates understanding of the underlying principles.`
    
    return { front, back }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Flashcard & Review Suggestions</CardTitle>
          <CardDescription>Loading your personalized study materials...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (missedTopics.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Flashcard & Review Suggestions</CardTitle>
          <CardDescription>We&apos;ll generate personalized study materials based on your test results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No missed questions found in your test history</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Take more tests to receive personalized flashcard and review material suggestions based on your performance
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Flashcard & Review Suggestions
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <p>
                        These suggestions are generated based on your incorrect answers from recent tests. Focus on these
                        topics to improve your performance.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Personalized study materials based on your missed questions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flashcards" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flashcards">
                <Brain className="h-4 w-4 mr-2" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="resources">
                <BookOpen className="h-4 w-4 mr-2" />
                Review Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flashcards" className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Top Missed Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {missedTopics.slice(0, 5).map((topic, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 text-xs rounded-full bg-primary/10 text-primary flex items-center gap-1"
                    >
                      <span>{topic.topic}</span>
                      <span className="bg-primary/20 rounded-full px-1.5 py-0.5 text-xs">
                        {topic.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {missedTopics.map((topic, topicIndex) => (
                    <motion.div
                      key={topicIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: topicIndex * 0.1 }}
                    >
                      <h3 className="font-medium text-lg mb-2">{topic.topic} Flashcards</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topic.questions.slice(0, 4).map((question, qIndex) => {
                          const flashcard = generateFlashcardContent(question)
                          return (
                            <div
                              key={qIndex}
                              className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-hidden"
                            >
                              <div className="p-4 border-b bg-blue-50 dark:bg-blue-900/20">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-muted-foreground">Front</span>
                                  <Star className="h-3 w-3 text-yellow-500" />
                                </div>
                                <p className="font-medium">{flashcard.front}</p>
                              </div>
                              <div className="p-4">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-muted-foreground">Back</span>
                                </div>
                                <p className="text-sm">{flashcard.back}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {topic.questions.length > 4 && (
                        <div className="mt-2 text-center">
                          <Button variant="ghost" size="sm">
                            View all {topic.questions.length} {topic.topic} flashcards
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-end">
                <Button>
                  Export All Flashcards
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {missedTopics.map((topic, topicIndex) => (
                    <motion.div
                      key={topicIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: topicIndex * 0.1 }}
                      className="bg-white dark:bg-gray-800 border rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{topic.topic}</h3>
                          <p className="text-sm text-muted-foreground">
                            {topic.count} missed questions related to this topic
                          </p>
                        </div>
                      </div>

                      <div className="ml-10 space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Concepts to Review</h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {topic.relatedConcepts.map((concept, cIndex) => (
                              <li key={cIndex} className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                  <Brain className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm">{concept}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Recommended Resources</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{topic.topic} Study Guide</span>
                              <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full ml-auto">
                                PDF
                              </span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{topic.topic} Chapter Review</span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full ml-auto">
                                Article
                              </span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Practice Questions: {topic.topic}</span>
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full ml-auto">
                                Quiz
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button variant="outline" size="sm">
                            View All Resources
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
