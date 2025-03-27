"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowRight, BookOpen, Brain, CheckCircle2, Info, Target, Zap } from "lucide-react"
import { useState } from "react"

interface TopicMasteryData {
  name: string
  masteryScore: number
  masteryLevel: string
  isQuestPriority?: boolean
}

interface NextTaskCTAProps {
  weakestTopics: TopicMasteryData[]
  className?: string
  variant?: "default" | "compact" | "card"
  onStartStudy?: (topicName: string) => void
}

export default function NextTaskCTA({
  weakestTopics,
  className = "",
  variant = "default",
  onStartStudy,
}: NextTaskCTAProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Get the weakest topic (first in the array)
  const weakestTopic = weakestTopics && weakestTopics.length > 0 ? weakestTopics[0] : null

  // If no weakest topic is available, show a fallback
  if (!weakestTopic) {
    return (
      <div className={`text-center p-4 bg-muted/30 rounded-lg ${className}`}>
        <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">
          No topic data available yet. Take more tests to get personalized recommendations.
        </p>
      </div>
    )
  }

  // Get the appropriate icon based on mastery level
  const getMasteryIcon = (level: string) => {
    switch (level) {
      case "Not Started":
        return <AlertTriangle className="h-5 w-5" />
      case "Beginner":
        return <AlertTriangle className="h-5 w-5" />
      case "Intermediate":
        return <Info className="h-5 w-5" />
      case "Advanced":
        return <CheckCircle2 className="h-5 w-5" />
      case "Expert":
        return <CheckCircle2 className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  // Get color based on mastery level
  const getMasteryColor = (level: string) => {
    switch (level) {
      case "Not Started":
      case "Beginner":
        return "text-red-500 dark:text-red-400"
      case "Intermediate":
        return "text-yellow-500 dark:text-yellow-400"
      case "Advanced":
      case "Expert":
        return "text-green-500 dark:text-green-400"
      default:
        return "text-blue-500 dark:text-blue-400"
    }
  }

  // Get progress bar color based on mastery score
  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Generate a study recommendation based on mastery level
  const getStudyRecommendation = (topic: TopicMasteryData) => {
    switch (topic.masteryLevel) {
      case "Not Started":
      case "Beginner":
        return `Focus on building a strong foundation in ${topic.name}. Start with the basic concepts and principles.`
      case "Intermediate":
        return `Continue strengthening your knowledge of ${topic.name}. Focus on more complex scenarios and edge cases.`
      case "Advanced":
      case "Expert":
        return `You're doing well with ${topic.name}. Focus on maintaining your knowledge and exploring advanced concepts.`
      default:
        return `Study ${topic.name} to improve your overall mastery.`
    }
  }

  // Handle the start study button click
  const handleStartStudy = () => {
    if (onStartStudy) {
      onStartStudy(weakestTopic.name)
    }
    setIsDialogOpen(false)
  }

  // Render the appropriate variant
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" size="sm">
              <Target className="h-4 w-4" />
              Study Next: {weakestTopic.name}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={getMasteryColor(weakestTopic.masteryLevel)}>
                  {getMasteryIcon(weakestTopic.masteryLevel)}
                </span>
                Study Plan: {weakestTopic.name}
              </DialogTitle>
              <DialogDescription>
                This topic needs your attention based on your current mastery level.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Mastery</span>
                <span className="text-sm font-medium">{weakestTopic.masteryScore}%</span>
              </div>
              <Progress value={weakestTopic.masteryScore} className={getProgressColor(weakestTopic.masteryScore)} />
              <p className="text-sm mt-4">{getStudyRecommendation(weakestTopic)}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartStudy}>
                Start Studying
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg">Next Study Task</h3>
              <p className="text-sm text-muted-foreground mb-3">Based on your performance, we recommend focusing on:</p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-3">
                <div className="flex items-center gap-2">
                  <span className={getMasteryColor(weakestTopic.masteryLevel)}>
                    {getMasteryIcon(weakestTopic.masteryLevel)}
                  </span>
                  <span className="font-medium">{weakestTopic.name}</span>
                  {weakestTopic.isQuestPriority && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      Priority
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Current Mastery</span>
                    <span>{weakestTopic.masteryScore}%</span>
                  </div>
                  <Progress value={weakestTopic.masteryScore} className={getProgressColor(weakestTopic.masteryScore)} />
                </div>
              </div>
              <DialogTrigger asChild>
                <Button className="w-full">
                  Start Studying Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
            </div>
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={getMasteryColor(weakestTopic.masteryLevel)}>
                  {getMasteryIcon(weakestTopic.masteryLevel)}
                </span>
                Study Plan: {weakestTopic.name}
              </DialogTitle>
              <DialogDescription>
                This topic needs your attention based on your current mastery level.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Mastery</span>
                <span className="text-sm font-medium">{weakestTopic.masteryScore}%</span>
              </div>
              <Progress value={weakestTopic.masteryScore} className={getProgressColor(weakestTopic.masteryScore)} />
              <p className="text-sm mt-4">{getStudyRecommendation(weakestTopic)}</p>
              <div className="bg-muted/30 p-3 rounded-lg mt-4">
                <h4 className="text-sm font-medium mb-2">Study Approach</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 text-blue-500" />
                    <span>Review core concepts and principles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Brain className="h-4 w-4 mt-0.5 text-purple-500" />
                    <span>Practice with targeted questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 mt-0.5 text-yellow-500" />
                    <span>Test your knowledge with quizzes</span>
                  </li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartStudy}>
                Start Studying
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm ${className}`}
    >
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Your Next Task</h3>
              <p className="text-sm text-muted-foreground">Focus on your weakest topic</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={getMasteryColor(weakestTopic.masteryLevel)}>
                  {getMasteryIcon(weakestTopic.masteryLevel)}
                </span>
                <span className="font-medium">{weakestTopic.name}</span>
              </div>
              {weakestTopic.isQuestPriority && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  Priority Topic
                </span>
              )}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Current Mastery</span>
                <span>{weakestTopic.masteryScore}%</span>
              </div>
              <Progress value={weakestTopic.masteryScore} className={getProgressColor(weakestTopic.masteryScore)} />
            </div>
            <p className="text-sm mt-3">{getStudyRecommendation(weakestTopic)}</p>
          </div>

          <DialogTrigger asChild>
            <Button className="w-full">
              Start Studying Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={getMasteryColor(weakestTopic.masteryLevel)}>
                {getMasteryIcon(weakestTopic.masteryLevel)}
              </span>
              Study Plan: {weakestTopic.name}
            </DialogTitle>
            <DialogDescription>This topic needs your attention based on your current mastery level.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Mastery</span>
              <span className="text-sm font-medium">{weakestTopic.masteryScore}%</span>
            </div>
            <Progress value={weakestTopic.masteryScore} className={getProgressColor(weakestTopic.masteryScore)} />
            <p className="text-sm mt-4">{getStudyRecommendation(weakestTopic)}</p>
            <div className="bg-muted/30 p-3 rounded-lg mt-4">
              <h4 className="text-sm font-medium mb-2">Study Approach</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-0.5 text-blue-500" />
                  <span>Review core concepts and principles</span>
                </li>
                <li className="flex items-start gap-2">
                  <Brain className="h-4 w-4 mt-0.5 text-purple-500" />
                  <span>Practice with targeted questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 text-yellow-500" />
                  <span>Test your knowledge with quizzes</span>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartStudy}>
              Start Studying
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

