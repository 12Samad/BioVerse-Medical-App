"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  Sector,
} from "recharts"
import {
  Brain,
  BookOpen,
  BarChart2,
  PieChartIcon,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle,
  XCircle,
  Clock3,
  Filter,
  Download,
} from "lucide-react"
import type { Flashcard } from "@/services/api-service"

interface ThemeStatisticsProps {
  flashcards: Flashcard[]
  timeframe?: "all" | "week" | "month" | "year"
}

export default function ThemeStatistics({ flashcards, timeframe = "all" }: ThemeStatisticsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [activeIndex, setActiveIndex] = useState(0)

  // Get all unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    flashcards.forEach((card) => {
      if (card.category) categorySet.add(card.category)
    })
    return Array.from(categorySet)
  }, [flashcards])

  // Filter flashcards by timeframe
  // Removed unused filteredFlashcards variable

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalCards = flashcards.length
    const reviewedCards = flashcards.filter((card) => card.reviewCount > 0).length
    const masteredCards = flashcards.filter((card) => card.mastery >= 80).length
    const needReviewCards = flashcards.filter((card) => {
      if (!card.nextReviewDate) return false
      return new Date(card.nextReviewDate) <= new Date()
    }).length

    const averageMastery = totalCards > 0 ? flashcards.reduce((sum, card) => sum + card.mastery, 0) / totalCards : 0

    return {
      totalCards,
      reviewedCards,
      masteredCards,
      needReviewCards,
      averageMastery,
      reviewedPercentage: totalCards > 0 ? (reviewedCards / totalCards) * 100 : 0,
      masteredPercentage: totalCards > 0 ? (masteredCards / totalCards) * 100 : 0,
    }
  }, [flashcards])

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    return categories
      .map((category) => {
        const cardsInCategory = flashcards.filter((card) => card.category === category)
        const totalCards = cardsInCategory.length
        const reviewedCards = cardsInCategory.filter((card) => card.reviewCount > 0).length
        const masteredCards = cardsInCategory.filter((card) => card.mastery >= 80).length
        const needReviewCards = cardsInCategory.filter((card) => {
          if (!card.nextReviewDate) return false
          return new Date(card.nextReviewDate) <= new Date()
        }).length

        const averageMastery =
          totalCards > 0 ? cardsInCategory.reduce((sum, card) => sum + card.mastery, 0) / totalCards : 0

        return {
          name: category,
          totalCards,
          reviewedCards,
          masteredCards,
          needReviewCards,
          averageMastery,
          reviewedPercentage: totalCards > 0 ? (reviewedCards / totalCards) * 100 : 0,
          masteredPercentage: totalCards > 0 ? (masteredCards / totalCards) * 100 : 0,
        }
      })
      .sort((a, b) => b.totalCards - a.totalCards) // Sort by card count
  }, [flashcards, categories])

  // Prepare data for charts
  const masteryByCategory = useMemo(() => {
    return categoryStats.map((stat) => ({
      name: stat.name,
      mastery: Math.round(stat.averageMastery),
      cards: stat.totalCards,
    }))
  }, [categoryStats])

  const masteryDistribution = useMemo(() => {
    const distribution = [
      { name: "Not Started", value: 0, color: "#94a3b8" },
      { name: "Beginning", value: 0, color: "#f87171" },
      { name: "Developing", value: 0, color: "#fb923c" },
      { name: "Competent", value: 0, color: "#facc15" },
      { name: "Mastered", value: 0, color: "#4ade80" },
    ]

    flashcards.forEach((card) => {
      if (card.reviewCount === 0) {
        distribution[0].value++
      } else if (card.mastery < 25) {
        distribution[1].value++
      } else if (card.mastery < 50) {
        distribution[2].value++
      } else if (card.mastery < 80) {
        distribution[3].value++
      } else {
        distribution[4].value++
      }
    })

    return distribution
  }, [flashcards])

  // Calculate review status
  const reviewStatus = useMemo(() => {
    const now = new Date()
    const today = new Date(now.setHours(0, 0, 0, 0))
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const overdue = flashcards.filter((card) => {
      if (!card.nextReviewDate) return false
      return new Date(card.nextReviewDate) < today
    }).length

    const dueToday = flashcards.filter((card) => {
      if (!card.nextReviewDate) return false
      const reviewDate = new Date(card.nextReviewDate)
      return reviewDate >= today && reviewDate < tomorrow
    }).length

    const dueThisWeek = flashcards.filter((card) => {
      if (!card.nextReviewDate) return false
      const reviewDate = new Date(card.nextReviewDate)
      return reviewDate >= tomorrow && reviewDate < nextWeek
    }).length

    const later = flashcards.filter((card) => {
      if (!card.nextReviewDate) return false
      return new Date(card.nextReviewDate) >= nextWeek
    }).length

    const notScheduled = flashcards.filter((card) => !card.nextReviewDate).length

    return [
      { name: "Overdue", value: overdue, color: "#ef4444" },
      { name: "Due Today", value: dueToday, color: "#f97316" },
      { name: "This Week", value: dueThisWeek, color: "#3b82f6" },
      { name: "Later", value: later, color: "#10b981" },
      { name: "Not Scheduled", value: notScheduled, color: "#94a3b8" },
    ]
  }, [flashcards])

  // Get detailed stats for selected category
  const selectedCategoryStats = useMemo(() => {
    if (selectedCategory === "all") {
      return {
        name: "All Categories",
        ...overallStats,
      }
    }

    return (
      categoryStats.find((stat) => stat.name === selectedCategory) || {
        name: selectedCategory,
        totalCards: 0,
        reviewedCards: 0,
        masteredCards: 0,
        needReviewCards: 0,
        averageMastery: 0,
        reviewedPercentage: 0,
        masteredPercentage: 0,
      }
    )
  }, [selectedCategory, categoryStats, overallStats])

  // Get weak areas (categories with low mastery)
  const weakAreas = useMemo(() => {
    return categoryStats
      .filter((stat) => stat.totalCards >= 3) // Only consider categories with enough cards
      .sort((a, b) => a.averageMastery - b.averageMastery)
      .slice(0, 3)
  }, [categoryStats])

  // Get strong areas (categories with high mastery)
  const strongAreas = useMemo(() => {
    return categoryStats
      .filter((stat) => stat.totalCards >= 3 && stat.reviewedPercentage > 50) // Only consider categories with enough reviewed cards
      .sort((a, b) => b.averageMastery - a.averageMastery)
      .slice(0, 3)
  }, [categoryStats])

  // Custom active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888888" className="text-xs">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#000000" className="text-lg font-medium">
          {value}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#888888" className="text-xs">
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }

  // Handle pie chart hover
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  // Get color based on mastery percentage
  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-green-500"
    if (mastery >= 50) return "text-yellow-500"
    if (mastery >= 25) return "text-orange-500"
    return "text-red-500"
  }

  // Get background color based on mastery percentage
  const getMasteryBgColor = (mastery: number) => {
    if (mastery >= 80) return "bg-green-100"
    if (mastery >= 50) return "bg-yellow-100"
    if (mastery >= 25) return "bg-orange-100"
    return "bg-red-100"
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Study Progress Analytics</h2>
          <p className="text-muted-foreground">
            Track your progress across different subjects and identify areas for improvement
          </p>
        </div>

        <Select
          value={timeframe}
          onValueChange={(value: "all" | "week" | "month" | "year") => {
            // This would be handled by a parent component in a real implementation
            console.log("Timeframe changed:", value)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flashcards</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCards}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.reviewedPercentage > 0 && (
                <>
                  <span className="text-green-500">{formatPercentage(overallStats.reviewedPercentage)}</span> reviewed
                  at least once
                </>
              )}
              {overallStats.reviewedPercentage === 0 && "Start reviewing to track progress"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Mastery</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMasteryColor(overallStats.averageMastery)}`}>
              {formatPercentage(overallStats.averageMastery)}
            </div>
            <Progress
              value={overallStats.averageMastery}
              className={`h-2 mt-1 ${getMasteryBgColor(overallStats.averageMastery)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mastered Cards</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.masteredCards}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.totalCards > 0 ? (
                <>
                  <span className="text-green-500">{formatPercentage(overallStats.masteredPercentage)}</span> of total
                  cards
                </>
              ) : (
                "No cards mastered yet"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.needReviewCards}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.needReviewCards > 0 ? <>Cards due for review today</> : "All caught up!"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Mastery Distribution</CardTitle>
                <CardDescription>Breakdown of your flashcards by mastery level</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={masteryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                      >
                        {masteryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Review Status</CardTitle>
                <CardDescription>When your cards are scheduled for review</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reviewStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {reviewStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mastery by Category</CardTitle>
              <CardDescription>Average mastery level across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={masteryByCategory}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="mastery" name="Mastery %" barSize={40}>
                      {masteryByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.mastery >= 80
                              ? "#4ade80"
                              : entry.mastery >= 50
                                ? "#facc15"
                                : entry.mastery >= 25
                                  ? "#fb923c"
                                  : "#f87171"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[280px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export statistics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{selectedCategoryStats.name}</CardTitle>
              <CardDescription>
                Detailed statistics for{" "}
                {selectedCategoryStats.name === "All Categories"
                  ? "all categories"
                  : `the ${selectedCategoryStats.name} category`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">Progress Overview</h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Mastery Level</span>
                        <span
                          className={`text-sm font-medium ${getMasteryColor(selectedCategoryStats.averageMastery)}`}
                        >
                          {formatPercentage(selectedCategoryStats.averageMastery)}
                        </span>
                      </div>
                      <Progress value={selectedCategoryStats.averageMastery} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Cards Reviewed</span>
                        <span className="text-sm font-medium">
                          {selectedCategoryStats.reviewedCards}/{selectedCategoryStats.totalCards}
                        </span>
                      </div>
                      <Progress value={selectedCategoryStats.reviewedPercentage} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Cards Mastered</span>
                        <span className="text-sm font-medium">
                          {selectedCategoryStats.masteredCards}/{selectedCategoryStats.totalCards}
                        </span>
                      </div>
                      <Progress
                        value={selectedCategoryStats.masteredPercentage}
                        className="h-1.5 bg-green-100"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Status Breakdown</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50">
                        <div className="p-1.5 rounded-full bg-green-100">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{selectedCategoryStats.masteredCards}</div>
                          <div className="text-xs text-muted-foreground">Mastered</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50">
                        <div className="p-1.5 rounded-full bg-amber-100">
                          <Clock3 className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{selectedCategoryStats.needReviewCards}</div>
                          <div className="text-xs text-muted-foreground">Need Review</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50">
                        <div className="p-1.5 rounded-full bg-blue-100">
                          <Brain className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {selectedCategoryStats.reviewedCards - selectedCategoryStats.masteredCards}
                          </div>
                          <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50">
                        <div className="p-1.5 rounded-full bg-slate-200">
                          <XCircle className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {selectedCategoryStats.totalCards - selectedCategoryStats.reviewedCards}
                          </div>
                          <div className="text-xs text-muted-foreground">Not Started</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Performance Insights</h3>

                  {selectedCategoryStats.totalCards > 0 ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">Mastery Rating</h4>
                            <p className="text-sm text-muted-foreground">Based on your review performance</p>
                          </div>
                          <Badge className={`${getMasteryColor(selectedCategoryStats.averageMastery)}`}>
                            {selectedCategoryStats.averageMastery >= 80
                              ? "Excellent"
                              : selectedCategoryStats.averageMastery >= 60
                                ? "Good"
                                : selectedCategoryStats.averageMastery >= 40
                                  ? "Fair"
                                  : "Needs Work"}
                          </Badge>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <div className="text-3xl font-bold">
                            {formatPercentage(selectedCategoryStats.averageMastery)}
                          </div>
                          <div className="text-sm text-muted-foreground">average mastery</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Review Status</h4>

                        <div className="space-y-3">
                          {selectedCategoryStats.needReviewCards > 0 ? (
                            <div className="flex items-center gap-2 text-amber-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">
                                {selectedCategoryStats.needReviewCards} cards due for review
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">All caught up with reviews</span>
                            </div>
                          )}

                          {selectedCategoryStats.totalCards - selectedCategoryStats.reviewedCards > 0 && (
                            <div className="flex items-center gap-2 text-blue-600">
                              <Info className="h-4 w-4" />
                              <span className="text-sm">
                                {selectedCategoryStats.totalCards - selectedCategoryStats.reviewedCards} cards not yet
                                studied
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Recommendation</h4>

                        <p className="text-sm">
                          {selectedCategoryStats.averageMastery < 40 ? (
                            <>Focus on reviewing basic concepts in this category more frequently.</>
                          ) : selectedCategoryStats.averageMastery < 70 ? (
                            <>Continue regular practice to strengthen your knowledge in this area.</>
                          ) : (
                            <>Maintain your excellent progress with periodic reviews.</>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-700">No Data Available</h3>
                      <p className="text-sm text-slate-500 mt-2">There are no flashcards in this category yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {categoryStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Number of flashcards per category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryStats.map((stat) => (
                      <div key={stat.name} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{stat.name}</span>
                          <span className="text-sm text-muted-foreground">{stat.totalCards} cards</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={100}
                            className="h-2 bg-slate-100"
                            indicatorClassName={`${getMasteryBgColor(stat.averageMastery)}`}
                          />
                          <span className="text-xs font-medium">{formatPercentage(stat.averageMastery)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your study progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <p className="text-sm text-muted-foreground">
                    Activity tracking will be available after more review sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowUpRight className="mr-2 h-5 w-5 text-green-500" />
                  Strong Areas
                </CardTitle>
                <CardDescription>Categories where you're performing well</CardDescription>
              </CardHeader>
              <CardContent>
                {strongAreas.length > 0 ? (
                  <div className="space-y-4">
                    {strongAreas.map((area) => (
                      <div key={area.name} className="p-4 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-green-800">{area.name}</h3>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            {formatPercentage(area.averageMastery)} Mastery
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-green-700">
                          {area.masteredCards} of {area.totalCards} cards mastered
                        </p>
                        <div className="mt-2">
                          <Progress
                            value={area.masteredPercentage}
                            className="h-1.5 bg-green-100"
                            indicatorClassName="bg-green-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                    <CheckCircle className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700">No Strong Areas Yet</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      Continue reviewing to develop mastery in different categories.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowDownRight className="mr-2 h-5 w-5 text-red-500" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>Categories that need more attention</CardDescription>
              </CardHeader>
              <CardContent>
                {weakAreas.length > 0 ? (
                  <div className="space-y-4">
                    {weakAreas.map((area) => (
                      <div key={area.name} className="p-4 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-red-800">{area.name}</h3>
                          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                            {formatPercentage(area.averageMastery)} Mastery
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-red-700">{area.needReviewCards} cards need review</p>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            Focus on this area
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                    <Brain className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700">No Weak Areas Identified</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      Great job! Continue reviewing to maintain your progress.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Study Recommendations</CardTitle>
              <CardDescription>Personalized suggestions to improve your mastery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overallStats.needReviewCards > 0 && (
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-amber-100">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-amber-800">Review Due Cards</h3>
                        <p className="mt-1 text-sm text-amber-700">
                          You have {overallStats.needReviewCards} cards due for review. Prioritize these to maintain
                          your knowledge.
                        </p>
                        <Button className="mt-3 bg-amber-600 hover:bg-amber-700 text-white">
                          Start Review Session
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {weakAreas.length > 0 && (
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-red-100">
                        <Brain className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-red-800">Focus on Weak Areas</h3>
                        <p className="mt-1 text-sm text-red-700">
                          Concentrate on {weakAreas[0].name} where your mastery is{" "}
                          {formatPercentage(weakAreas[0].averageMastery)}.
                        </p>
                        <Button className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                          Study {weakAreas[0].name}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {overallStats.totalCards - overallStats.reviewedCards > 0 && (
                  <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-800">Start New Cards</h3>
                        <p className="mt-1 text-sm text-blue-700">
                          You have {overallStats.totalCards - overallStats.reviewedCards} cards you haven't studied yet.
                        </p>
                        <Button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">Explore New Cards</Button>
                      </div>
                    </div>
                  </div>
                )}

                {overallStats.reviewedCards > 0 && overallStats.needReviewCards === 0 && weakAreas.length === 0 && (
                  <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-800">All Caught Up!</h3>
                        <p className="mt-1 text-sm text-green-700">
                          Great job! You&apos;re up to date with your reviews. Consider adding more flashcards or challenging
                          yourself.
                        </p>
                        <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white">Try Challenge Mode</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper component for the Lightbulb icon
function Lightbulb({ className }: { className?: string }) {
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
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}

