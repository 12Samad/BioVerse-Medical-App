"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Brain, Clock, Flame, CloudLightningIcon as Lightning, Lightbulb, Medal, RotateCcw, Trophy, XCircle, CheckCircle } from 'lucide-react'
import confetti from "canvas-confetti"
import type { Flashcard } from "@/services/api-service"

// Challenge difficulty levels
type DifficultyLevel = "easy" | "medium" | "hard" | "expert"

// Challenge settings
interface ChallengeSettings {
  duration: number // in seconds
  cardsCount: number
  difficulty: DifficultyLevel
  categories: string[]
  includeHints: boolean
}

// Challenge stats
interface ChallengeStats {
  score: number
  correctAnswers: number
  incorrectAnswers: number
  skippedAnswers: number
  averageResponseTime: number
  streak: number
  longestStreak: number
  timeRemaining: number
}

// Achievement definition
interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  condition: (stats: ChallengeStats) => boolean
  unlocked: boolean
}

// Challenge history entry
interface ChallengeHistoryEntry {
  id: string
  date: Date
  score: number
  correctAnswers: number
  totalCards: number
  categories: string[]
  difficulty: DifficultyLevel
  duration: number
  achievements: string[]
}

interface ChallengeModeProps {
  flashcards: Flashcard[]
  onComplete?: (stats: ChallengeStats, history: ChallengeHistoryEntry) => void
}

export default function ChallengeMode({ flashcards, onComplete }: ChallengeModeProps) {
  // State for challenge dialog
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"setup" | "challenge" | "results">("setup")
  
  // Challenge settings
  const [settings, setSettings] = useState<ChallengeSettings>({
    duration: 120, // 2 minutes
    cardsCount: 10,
    difficulty: "medium",
    categories: [],
    includeHints: true,
  })
  
  // Challenge state
  const [isRunning, setIsRunning] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [challengeCards, setChallengeCards] = useState<Flashcard[]>([])
  const [responses, setResponses] = useState<Array<"correct" | "incorrect" | "skipped">>([])
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [startTime, setStartTime] = useState<number>(0)
  const [cardStartTime, setCardStartTime] = useState<number>(0)
  
  // Challenge stats
  const [stats, setStats] = useState<ChallengeStats>({
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    skippedAnswers: 0,
    averageResponseTime: 0,
    streak: 0,
    longestStreak: 0,
    timeRemaining: 0,
  })
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(settings.duration)
  
  // Challenge history
  const [history, setHistory] = useState<ChallengeHistoryEntry[]>([])
  
  // Available categories from flashcards
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    flashcards.forEach(card => {
      if (card.category) categories.add(card.category)
    })
    return Array.from(categories)
  }, [flashcards])
  
  // Achievements
  const achievements = useMemo<Achievement[]>(() => [
    {
      id: "perfect_score",
      name: "Perfect Score",
      description: "Answer all questions correctly",
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      condition: (stats) => stats.correctAnswers === settings.cardsCount && stats.incorrectAnswers === 0,
      unlocked: false
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      description: "Complete the challenge with more than 50% of time remaining",
      icon: <Lightning className="h-5 w-5 text-blue-500" />,
      condition: (stats) => stats.timeRemaining > settings.duration * 0.5,
      unlocked: false
    },
    {
      id: "streak_master",
      name: "Streak Master",
      description: "Achieve a streak of 5 or more correct answers",
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      condition: (stats) => stats.longestStreak >= 5,
      unlocked: false
    },
    {
      id: "quick_thinker",
      name: "Quick Thinker",
      description: "Average response time under 5 seconds",
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      condition: (stats) => stats.averageResponseTime < 5,
      unlocked: false
    },
    {
      id: "challenge_champion",
      name: "Challenge Champion",
      description: "Score over 90% on a hard or expert challenge",
      icon: <Medal className="h-5 w-5 text-indigo-500" />,
      condition: (stats) => 
        (stats.correctAnswers / settings.cardsCount) > 0.9 && 
        (settings.difficulty === "hard" || settings.difficulty === "expert"),
      unlocked: false
    }
  ], [settings.cardsCount, settings.difficulty, settings.duration])
  
  // Prepare challenge cards based on settings
  const prepareChallenge = useCallback(() => {
    let filteredCards = [...flashcards]
    
    // Filter by categories if selected
    if (settings.categories.length > 0) {
      filteredCards = filteredCards.filter(card => 
        settings.categories.includes(card.category)
      )
    }
    
    // Filter by difficulty
    if (settings.difficulty !== "expert") {
      filteredCards = filteredCards.filter(card => 
        settings.difficulty === "easy" ? card.difficulty === "easy" :
        settings.difficulty === "medium" ? ["easy", "medium"].includes(card.difficulty) :
        true // hard includes all difficulties
      )
    }
    
    // Shuffle cards
    filteredCards = filteredCards.sort(() => Math.random() - 0.5)
    
    // Limit to card count
    filteredCards = filteredCards.slice(0, settings.cardsCount)
    
    // If not enough cards, add random cards to reach the count
    if (filteredCards.length < settings.cardsCount) {
      const remainingCount = settings.cardsCount - filteredCards.length
      const additionalCards = flashcards
        .filter(card => !filteredCards.includes(card))
        .sort(() => Math.random() - 0.5)
        .slice(0, remainingCount)
      
      filteredCards = [...filteredCards, ...additionalCards]
    }
    
    return filteredCards
  }, [flashcards, settings.categories, settings.difficulty, settings.cardsCount])
  
  // Start challenge
  const startChallenge = useCallback(() => {
    const cards = prepareChallenge()
    setChallengeCards(cards)
    setCurrentCardIndex(0)
    setShowAnswer(false)
    setResponses(new Array(cards.length).fill(null))
    setResponseTimes(new Array(cards.length).fill(0))
    setTimeLeft(settings.duration)
    setStats({
      score: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedAnswers: 0,
      averageResponseTime: 0,
      streak: 0,
      longestStreak: 0,
      timeRemaining: 0,
    })
    setIsRunning(true)
    setStartTime(Date.now())
    setCardStartTime(Date.now())
    setActiveTab("challenge")
  }, [prepareChallenge, settings.duration])
  
  // End challenge
  const endChallenge = useCallback((timeExpired = false) => {
    setIsRunning(false)
    
    // Calculate final stats
    const correctCount = responses.filter(r => r === "correct").length
    const incorrectCount = responses.filter(r => r === "incorrect").length
    const skippedCount = responses.filter(r => r === "skipped").length + 
      (challengeCards.length - currentCardIndex - (timeExpired ? 0 : 1))
    
    const avgResponseTime = responseTimes.filter(t => t > 0).reduce((sum, time) => sum + time, 0) / 
      responseTimes.filter(t => t > 0).length || 0
    
    // Calculate score: base points for correct answers, bonus for speed, penalty for incorrect
    const basePoints = correctCount * 100
    const speedBonus = Math.round((settings.duration - avgResponseTime) * 2)
    const streakBonus = stats.longestStreak * 20
    const incorrectPenalty = incorrectCount * 30
    
    const finalScore = Math.max(0, basePoints + speedBonus + streakBonus - incorrectPenalty)
    
    const finalStats: ChallengeStats = {
      score: finalScore,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      skippedAnswers: skippedCount,
      averageResponseTime: avgResponseTime,
      streak: stats.streak,
      longestStreak: stats.longestStreak,
      timeRemaining: timeLeft,
    }
    
    setStats(finalStats)
    
    // Check achievements
    const unlockedAchievements = achievements.map(achievement => ({
      ...achievement,
      unlocked: achievement.condition(finalStats)
    }))
    
    // If any achievements were unlocked, trigger confetti
    if (unlockedAchievements.some(a => a.unlocked)) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
    
    // Create history entry
    const historyEntry: ChallengeHistoryEntry = {
      id: Date.now().toString(),
      date: new Date(),
      score: finalScore,
      correctAnswers: correctCount,
      totalCards: challengeCards.length,
      categories: settings.categories.length > 0 ? settings.categories : ["All"],
      difficulty: settings.difficulty,
      duration: settings.duration,
      achievements: unlockedAchievements.filter(a => a.unlocked).map(a => a.id)
    }
    
    setHistory(prev => [historyEntry, ...prev])
    
    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(finalStats, historyEntry)
    }
    
    setActiveTab("results")
  }, [
    responses, 
    responseTimes, 
    challengeCards.length, 
    currentCardIndex, 
    settings.duration, 
    settings.categories, 
    settings.difficulty, 
    stats.streak, 
    stats.longestStreak, 
    timeLeft, 
    achievements, 
    onComplete
  ])
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            endChallenge(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRunning, timeLeft, endChallenge])
  
  // Handle card response
  const handleResponse = (response: "correct" | "incorrect") => {
    if (!isRunning) return
    
    // Calculate response time
    const responseTime = (Date.now() - cardStartTime) / 1000
    
    // Update responses and times
    const newResponses = [...responses]
    newResponses[currentCardIndex] = response
    setResponses(newResponses)
    
    const newResponseTimes = [...responseTimes]
    newResponseTimes[currentCardIndex] = responseTime
    setResponseTimes(newResponseTimes)
    
    // Update streak
    let newStreak = stats.streak
    let newLongestStreak = stats.longestStreak
    
    if (response === "correct") {
      newStreak++
      if (newStreak > newLongestStreak) {
        newLongestStreak = newStreak
      }
    } else {
      newStreak = 0
    }
    
    setStats(prev => ({
      ...prev,
      correctAnswers: response === "correct" ? prev.correctAnswers + 1 : prev.correctAnswers,
      incorrectAnswers: response === "incorrect" ? prev.incorrectAnswers + 1 : prev.incorrectAnswers,
      streak: newStreak,
      longestStreak: newLongestStreak
    }))
    
    // Move to next card or end challenge
    if (currentCardIndex < challengeCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setShowAnswer(false)
      setCardStartTime(Date.now())
    } else {
      endChallenge()
    }
  }
  
  // Handle skipping a card
  const handleSkip = () => {
    if (!isRunning) return
    
    // Update responses
    const newResponses = [...responses]
    newResponses[currentCardIndex] = "skipped"
    setResponses(newResponses)
    
    setStats(prev => ({
      ...prev,
      skippedAnswers: prev.skippedAnswers + 1,
      streak: 0 // Reset streak on skip
    }))
    
    // Move to next card or end challenge
    if (currentCardIndex < challengeCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setShowAnswer(false)
      setCardStartTime(Date.now())
    } else {
      endChallenge()
    }
  }
  
  // Reset challenge
  const resetChallenge = () => {
    setActiveTab("setup")
    setIsRunning(false)
  }
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    return (currentCardIndex / challengeCards.length) * 100
  }, [currentCardIndex, challengeCards.length])
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy": return "text-green-500"
      case "medium": return "text-amber-500"
      case "hard": return "text-red-500"
      case "expert": return "text-purple-500"
      default: return "text-blue-500"
    }
  }
  
  // Get grade based on percentage correct
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: "A", color: "text-green-500" }
    if (percentage >= 80) return { grade: "B", color: "text-blue-500" }
    if (percentage >= 70) return { grade: "C", color: "text-amber-500" }
    if (percentage >= 60) return { grade: "D", color: "text-orange-500" }
    return { grade: "F", color: "text-red-500" }
  }
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
            <Lightning className="mr-2 h-5 w-5" />
            Challenge Mode
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <Trophy className="mr-2 h-6 w-6 text-amber-500" />
              Challenge Mode
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "setup" | "challenge" | "results")}>
            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Challenge Settings</h3>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      {/* Difficulty */}
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select 
                          value={settings.difficulty} 
                          onValueChange={(value) => setSettings({...settings, difficulty: value as DifficultyLevel})}
                        >
                          <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          {settings.difficulty === "easy" && "Basic concepts, shorter time limits."}
                          {settings.difficulty === "medium" && "Balanced challenge for intermediate learners."}
                          {settings.difficulty === "hard" && "Advanced concepts, stricter time limits."}
                          {settings.difficulty === "expert" && "Maximum difficulty, includes all card types."}
                        </p>
                      </div>
                      
                      {/* Duration */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="duration">Time Limit: {formatTime(settings.duration)}</Label>
                        </div>
                        <Slider
                          id="duration"
                          min={30}
                          max={300}
                          step={30}
                          value={[settings.duration]}
                          onValueChange={(value) => setSettings({...settings, duration: value[0]})}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>30s</span>
                          <span>5m</span>
                        </div>
                      </div>
                      
                      {/* Card Count */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="cardCount">Number of Cards: {settings.cardsCount}</Label>
                        </div>
                        <Slider
                          id="cardCount"
                          min={5}
                          max={30}
                          step={5}
                          value={[settings.cardsCount]}
                          onValueChange={(value) => setSettings({...settings, cardsCount: value[0]})}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>5</span>
                          <span>30</span>
                        </div>
                      </div>
                      
                      {/* Categories */}
                      <div className="space-y-2">
                        <Label>Categories</Label>
                        <Select 
                          value={settings.categories.length === 0 ? "all" : "custom"}
                          onValueChange={(value) => {
                            if (value === "all") {
                              setSettings({...settings, categories: []})
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="custom">Custom Selection</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {settings.categories.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {settings.categories.map(category => (
                              <Badge 
                                key={category}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {category}
                                <button 
                                  onClick={() => setSettings({
                                    ...settings, 
                                    categories: settings.categories.filter(c => c !== category)
                                  })}
                                  className="ml-1 rounded-full hover:bg-slate-200 p-0.5"
                                >
                                  <XCircle className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {settings.categories.length === 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Using all available categories</p>
                          </div>
                        )}
                        
                        {settings.categories.length !== availableCategories.length && (
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              {availableCategories
                                .filter(category => !settings.categories.includes(category))
                                .map(category => (
                                  <Button
                                    key={category}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSettings({
                                      ...settings,
                                      categories: [...settings.categories, category]
                                    })}
                                    className="justify-start"
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    {category}
                                  </Button>
                                ))
                              }
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Include Hints */}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="includeHints"
                          checked={settings.includeHints}
                          onCheckedChange={(checked) => setSettings({...settings, includeHints: checked})}
                        />
                        <Label htmlFor="includeHints">Show hints during challenge</Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={startChallenge} disabled={flashcards.length === 0}>
                    <Lightning className="mr-2 h-4 w-4" />
                    Start Challenge
                  </Button>
                </div>
                
                {/* Challenge History */}
                {history.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Challenge History</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                          {history.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between border-b pb-2">
                              <div>
                                <p className="font-medium">{entry.date.toLocaleDateString()}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className={getDifficultyColor(entry.difficulty)}>
                                    {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                                  </span>
                                  <span>•</span>
                                  <span>{entry.correctAnswers}/{entry.totalCards} correct</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{entry.score}</p>
                                <p className="text-xs text-muted-foreground">points</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Challenge Tab */}
            <TabsContent value="challenge" className="space-y-4 py-4">
              {isRunning && challengeCards.length > 0 && currentCardIndex < challengeCards.length && (
                <div className="space-y-4">
                  {/* Timer and Progress */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-slate-500" />
                      <span className={`font-mono text-xl ${timeLeft < 10 ? "text-red-500 animate-pulse" : ""}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {currentCardIndex + 1} / {challengeCards.length}
                      </span>
                      {stats.streak > 2 && (
                        <Badge className="bg-orange-500">
                          <Flame className="mr-1 h-3 w-3" />
                          Streak: {stats.streak}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Progress value={progressPercentage} className="h-2" />
                  
                  {/* Flashcard */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCardIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="min-h-[300px] flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <Badge variant="outline">
                              {challengeCards[currentCardIndex].category}
                            </Badge>
                            <Badge 
                              variant={
                                challengeCards[currentCardIndex].difficulty === "easy" 
                                  ? "default" 
                                  : challengeCards[currentCardIndex].difficulty === "hard" 
                                    ? "destructive" 
                                    : "secondary"
                              }
                            >
                              {challengeCards[currentCardIndex].difficulty.charAt(0).toUpperCase() + 
                                challengeCards[currentCardIndex].difficulty.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-grow flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={showAnswer ? "answer" : "question"}
                              initial={{ opacity: 0, rotateY: 90 }}
                              animate={{ opacity: 1, rotateY: 0 }}
                              exit={{ opacity: 0, rotateY: -90 }}
                              transition={{ duration: 0.4 }}
                              className="w-full text-center"
                            >
                              {showAnswer ? (
                                <div>
                                  <Badge className="mb-4 bg-green-500">Answer</Badge>
                                  <p className="text-2xl font-bold">
                                    {challengeCards[currentCardIndex].answer}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <Badge className="mb-4 bg-blue-500">Question</Badge>
                                  <p className="text-2xl font-bold mb-4">
                                    {challengeCards[currentCardIndex].question}
                                  </p>
                                  
                                  {settings.includeHints && challengeCards[currentCardIndex].hint && (
                                    <div className="mt-4 bg-amber-50 p-3 rounded-lg inline-block">
                                      <div className="flex items-center">
                                        <Lightbulb className="h-4 w-4 text-amber-500 mr-2" />
                                        <span className="text-amber-700 text-sm font-medium">
                                          Hint: {challengeCards[currentCardIndex].hint}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </CardContent>
                        
                        <CardFooter className="flex justify-between">
                          {!showAnswer ? (
                            <div className="w-full">
                              <Button 
                                onClick={() => setShowAnswer(true)} 
                                className="w-full bg-indigo-500 hover:bg-indigo-600"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reveal Answer
                              </Button>
                            </div>
                          ) : (
                            <div className="w-full grid grid-cols-3 gap-2">
                              <Button 
                                variant="outline" 
                                onClick={handleSkip}
                                className="border-slate-300"
                              >
                                Skip
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleResponse("incorrect")}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Incorrect
                              </Button>
                              <Button 
                                onClick={() => handleResponse("correct")}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Correct
                              </Button>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
            
            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4 py-4">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">Challenge Complete!</h2>
                  <p className="text-slate-500">
                    You scored {stats.score} points
                  </p>
                </div>
                
                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-slate-700">Accuracy</h3>
                        <div className="mt-2 flex justify-center">
                          <div className="relative inline-flex items-center justify-center">
                            <svg className="w-24 h-24">
                              <circle
                                className="text-slate-100"
                                strokeWidth="6"
                                stroke="currentColor"
                                fill="transparent"
                                r="36"
                                cx="48"
                                cy="48"
                              />
                              <circle
                                className={`${
                                  stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers) > 0.7
                                    ? "text-green-500"
                                    : stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers) > 0.4
                                    ? "text-amber-500"
                                    : "text-red-500"
                                }`}
                                strokeWidth="6"
                                strokeDasharray={36 * 2 * Math.PI}
                                strokeDashoffset={
                                  36 * 2 * Math.PI *
                                  (1 - stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers + 0.0001))
                                }
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="36"
                                cx="48"
                                cy="48"
                              />
                            </svg>
                            <span className="absolute text-2xl font-bold">
                              {Math.round(
                                (stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers + 0.0001)) * 100
                              )}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {stats.correctAnswers} Correct
                          </Badge>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="mr-1 h-3 w-3" />
                            {stats.incorrectAnswers} Incorrect
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-slate-700">Performance</h3>
                        <div className="mt-2">
                          <div className="text-4xl font-bold">
                            {stats.score}
                          </div>
                          <div className="text-sm text-slate-500">points</div>
                        </div>
                        <div className="mt-2">
                          {(() => {
                            const percentage = stats.correctAnswers / (stats.correctAnswers + stats.incorrectAnswers + 0.0001) * 100
                            const { grade, color } = getGrade(percentage)
                            return (
                              <Badge className={`${color} text-lg px-3 py-1`}>
                                Grade: {grade}
                              </Badge>
                            )
                          })()}
                        </div>
                      </div>
                      
                      <div className="col-span-2 p-4 bg-white rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-slate-700 mb-3">Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-500">Time Remaining</span>
                              <span className="font-medium">{formatTime(stats.timeRemaining)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-500">Avg. Response Time</span>
                              <span className="font-medium">{stats.averageResponseTime.toFixed(1)}s</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-500">Longest Streak</span>
                              <span className="font-medium">{stats.longestStreak}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-500">Skipped</span>
                              <span className="font-medium">{stats.skippedAnswers}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Achievements */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Achievements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {achievements.map(achievement => {
                      const isUnlocked = achievement.condition(stats)
                      return (
                        <div 
                          key={achievement.id}
                          className={`p-3 rounded-lg border flex items-center gap-3 ${
                            isUnlocked 
                              ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200" 
                              : "bg-slate-50 border-slate-200 opacity-70"
                          }`}
                        >
                          <div className={`p-2 rounded-full ${isUnlocked ? "bg-amber-100" : "bg-slate-200"}`}>
                            {achievement.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{achievement.name}</h4>
                            <p className="text-xs text-slate-500">{achievement.description}</p>
                          </div>
                          {isUnlocked && (
                            <Badge className="ml-auto bg-amber-500">
                              <Trophy className="h-3 w-3 mr-1" />
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetChallenge}>
                    Try Again
                  </Button>
                  <Button onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper component for the plus icon
function Plus({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
