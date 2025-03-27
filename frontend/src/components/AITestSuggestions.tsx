"use client"

import React, { useState } from "react"
import { Brain, Loader2 } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AITestSuggestionsProps {
  mode: "tutor" | "timer"
}

const AITestSuggestions: React.FC<AITestSuggestionsProps> = ({ mode }) => {
  const router = useRouter()
  const [topic, setTopic] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<string>("10")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [difficultyDistribution, setDifficultyDistribution] = useState<string>("balanced")
  
  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numeric values
    if (value === "" || /^\d+$/.test(value)) {
      setQuestionCount(value)
    }
  }

  const handleGenerateTest = async () => {
    // Validate inputs
    if (!topic.trim()) {
      toast.error("Please enter a medical topic")
      return
    }

    const count = parseInt(questionCount, 10)
    if (isNaN(count) || count < 1 || count > 50) {
      toast.error("Please enter a valid number of questions (1-50)")
      return
    }

    setIsGenerating(true)

    try {
      // Call the API to generate AI test suggestions
      // Using the hardcoded API endpoint instead of a prop
      const apiUrl = 'http://localhost:5000/api/test/ai-test-suggestions';
      const { data } = await axios.post(apiUrl, {
        topic: topic.trim(),
        questionCount: count,
        difficultyDistribution,
      })

      if (data && data.questions) {
        // Create URL parameters for the test
        const params = new URLSearchParams({
          mode,
          isAIGenerated: "true",
          topic: topic.trim(),
          aiGeneratedQuestions: JSON.stringify(data.questions)
        })

        // Redirect to the take-test page with the AI-generated questions
        router.push(`/dashboard/take-test?${params.toString()}`)
      } else {
        toast.error("Failed to generate test questions. Please try again.")
      }
    } catch (error) {
      console.error("Error generating AI test:", error)
      toast.error("An error occurred while generating the test. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold flex items-center text-gray-700">
          <Brain className="mr-2" size={24} />
          AI Test Suggestions
        </CardTitle>
        <CardDescription>
          Generate a customized test focused on a specific medical topic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="medical-topic" className="block text-sm font-medium text-gray-700 mb-1">
            Medical Topic
          </label>
          <Input
            id="medical-topic"
            type="text"
            placeholder="e.g., Cardiovascular Physiology, Diabetes Management"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full"
            disabled={isGenerating}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="question-count" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
            </label>
            <Input
              id="question-count"
              type="text"
              placeholder="10"
              value={questionCount}
              onChange={handleQuestionCountChange}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 5-30 questions
            </p>
          </div>
          
          <div>
            <label htmlFor="difficulty-distribution" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Distribution
            </label>
            <Select
              value={difficultyDistribution}
              onValueChange={setDifficultyDistribution}
              disabled={isGenerating}
            >
              <SelectTrigger id="difficulty-distribution">
                <SelectValue placeholder="Select difficulty distribution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanced (33% each)</SelectItem>
                <SelectItem value="easy-focused">Easy Focused (50% easy, 30% medium, 20% hard)</SelectItem>
                <SelectItem value="challenge">Challenging (20% easy, 30% medium, 50% hard)</SelectItem>
                <SelectItem value="exam-prep">Exam Prep (25% easy, 50% medium, 25% hard)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          onClick={handleGenerateTest}
          disabled={isGenerating}
          className="w-full bg-primary text-white hover:bg-primary-dark h-10 py-2 mt-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Test...
            </>
          ) : (
            "Generate Topic-Focused Test"
          )}
        </Button>
        
        <p className="text-xs text-gray-500 italic text-center">
          The AI will generate questions focused specifically on {topic || "your chosen topic"} with varying difficulty levels.
        </p>
      </CardContent>
    </Card>
  )
}

export default AITestSuggestions