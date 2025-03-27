"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { Award, Calendar, CheckCircle2, Flame, Info, Star, Trophy } from "lucide-react"
import { useEffect, useState } from "react"

interface TestResult {
  userId: string
  questions: {
    questionId: string
    questionText: string
    userAnswer: string
    correctAnswer: string
    timeSpent: number
  }[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
}

interface StreakTrackerProps {
  performanceData: TestResult[]
  isLoading?: boolean
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActive: string | null
  streakDates: string[]
  streakCalendar: {
    date: string
    active: boolean
    inStreak: boolean
  }[]
}

export default function StreakTracker({ performanceData, isLoading = false }: StreakTrackerProps) {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActive: null,
    streakDates: [],
    streakCalendar: [],
  })
  const [calendarView, setCalendarView] = useState<"week" | "month">("week")

  // Calculate streak data from performance data
  useEffect(() => {
    if (!performanceData || performanceData.length === 0) {
      return
    }

    // Extract dates from performance data and format them as YYYY-MM-DD
    const testDates = performanceData.map((test) => {
      const date = new Date(test.createdAt)
      return date.toISOString().split("T")[0]
    })

    // Remove duplicates (in case multiple tests were taken on the same day)
    const uniqueDates = Array.from(new Set(testDates)).sort()

    // Calculate current streak
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    const lastActive = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null

    // Check if the last active date is today or yesterday
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
    const isActiveToday = lastActive === today
    const isActiveYesterday = lastActive === yesterday

    // If not active today or yesterday, streak is broken
    if (!isActiveToday && !isActiveYesterday) {
      currentStreak = 0
    } else {
      // Calculate current streak by checking consecutive days backwards
    //   const lastActiveDate = new Date(lastActive!)
      const checkDate = isActiveToday ? new Date() : new Date(Date.now() - 86400000)

      while (true) {
        const checkDateStr = checkDate.toISOString().split("T")[0]
        if (uniqueDates.includes(checkDateStr)) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i])

      if (i === 0) {
        tempStreak = 1
      } else {
        const prevDate = new Date(uniqueDates[i - 1])
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
    }

    // Generate calendar data for visualization
    const calendar = generateCalendarData(uniqueDates, currentStreak, calendarView)

    setStreakData({
      currentStreak,
      longestStreak,
      lastActive,
      streakDates: uniqueDates,
      streakCalendar: calendar,
    })
  }, [performanceData, calendarView])

  // Generate calendar data for visualization
  const generateCalendarData = (activeDates: string[], currentStreak: number, view: "week" | "month") => {
    const today = new Date()
    const calendar = []
    const daysToShow = view === "week" ? 7 : 30

    // Generate dates for the calendar
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      // Check if this date is active (has a test)
      const isActive = activeDates.includes(dateStr)

      // Check if this date is part of the current streak
      let isInStreak = false
      if (currentStreak > 0) {
        const streakStartDate = new Date(today)
        streakStartDate.setDate(streakStartDate.getDate() - currentStreak + 1)

        if (date >= streakStartDate && date <= today) {
          isInStreak = isActive
        }
      }

      calendar.push({
        date: dateStr,
        active: isActive,
        inStreak: isInStreak,
      })
    }

    return calendar
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Get streak message based on current streak
  const getStreakMessage = () => {
    if (streakData.currentStreak === 0) {
      return "Start studying today to begin your streak!"
    } else if (streakData.currentStreak === 1) {
      return "You've started your streak! Keep going!"
    } else if (streakData.currentStreak < 3) {
      return "Great start! Keep your momentum going!"
    } else if (streakData.currentStreak < 7) {
      return "Impressive consistency! You're building good habits!"
    } else if (streakData.currentStreak < 14) {
      return "Amazing dedication! You're on fire!"
    } else {
      return "Extraordinary commitment! You're a study champion!"
    }
  }

  // Get color based on streak length
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-500 dark:text-purple-400"
    if (streak >= 14) return "text-blue-500 dark:text-blue-400"
    if (streak >= 7) return "text-green-500 dark:text-green-400"
    if (streak >= 3) return "text-yellow-500 dark:text-yellow-400"
    if (streak > 0) return "text-orange-500 dark:text-orange-400"
    return "text-muted-foreground"
  }

  // Get icon based on streak length
  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return <Trophy className="h-6 w-6" />
    if (streak >= 14) return <Award className="h-6 w-6" />
    if (streak >= 7) return <Star className="h-6 w-6" />
    if (streak > 0) return <Flame className="h-6 w-6" />
    return <Calendar className="h-6 w-6" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Streak Tracker</CardTitle>
          <CardDescription>Loading streak data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                Streak Tracker
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Track your daily study consistency. A streak is maintained by studying at least once every day.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={calendarView === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("week")}
              >
                Week
              </Button>
              <Button
                variant={calendarView === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setCalendarView("month")}
              >
                Month
              </Button>
            </div>
          </div>
          <CardDescription>Track your daily study consistency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-primary/10 ${getStreakColor(streakData.currentStreak)}`}>
                  {getStreakIcon(streakData.currentStreak)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className={`text-3xl font-bold ${getStreakColor(streakData.currentStreak)}`}>
                    {streakData.currentStreak} {streakData.currentStreak === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to next milestone</span>
                  <span className="font-medium">
                    {streakData.currentStreak < 3
                      ? `${streakData.currentStreak}/3`
                      : streakData.currentStreak < 7
                        ? `${streakData.currentStreak}/7`
                        : streakData.currentStreak < 14
                          ? `${streakData.currentStreak}/14`
                          : streakData.currentStreak < 30
                            ? `${streakData.currentStreak}/30`
                            : `${streakData.currentStreak}/100`}
                  </span>
                </div>
                <Progress
                  value={
                    streakData.currentStreak < 3
                      ? (streakData.currentStreak / 3) * 100
                      : streakData.currentStreak < 7
                        ? (streakData.currentStreak / 7) * 100
                        : streakData.currentStreak < 14
                          ? (streakData.currentStreak / 14) * 100
                          : streakData.currentStreak < 30
                            ? (streakData.currentStreak / 30) * 100
                            : (streakData.currentStreak / 100) * 100
                  }
                  className={`h-2 ${getStreakColor(streakData.currentStreak).replace("text-", "bg-")}`}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-yellow-500 dark:text-yellow-400">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longest Streak</p>
                  <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">
                    {streakData.longestStreak} {streakData.longestStreak === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Last Active</p>
                <p className="font-medium">
                  {streakData.lastActive ? formatDate(streakData.lastActive) : "Not yet started"}
                </p>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">{getStreakMessage()}</p>
                <p className="text-xs text-muted-foreground">
                  {streakData.currentStreak === 0
                    ? "Take a test or study session to start your streak"
                    : `Keep your streak going by studying again ${
                        streakData.lastActive === new Date().toISOString().split("T")[0] ? "tomorrow" : "today"
                      }`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Activity Calendar</h3>
              <div className="grid grid-cols-7 gap-2">
                {calendarView === "week" ? (
                  // Week view - show days of the week
                  <>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-xs text-center text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </>
                ) : (
                  // Month view - no day labels needed
                  <></>
                )}

                {streakData.streakCalendar.map((day, index) => {
                  // For week view, organize by days of the week
                  if (calendarView === "week") {
                    const date = new Date(day.date)
                    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

                    // Only show the current week
                    if (index < streakData.streakCalendar.length - 7) {
                      return null
                    }

                    return (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs
                          ${
                            day.active
                              ? day.inStreak
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        style={{ gridColumn: dayOfWeek + 1 }}
                      >
                        <span className="font-medium">{date.getDate()}</span>
                        {day.active && <CheckCircle2 className="h-3 w-3 mt-1" />}
                      </div>
                    )
                  } else {
                    // Month view - show a grid of days
                    const date = new Date(day.date)
                    return (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs
                          ${
                            day.active
                              ? day.inStreak
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                      >
                        <span className="font-medium">{date.getDate()}</span>
                        {day.active && <CheckCircle2 className="h-3 w-3 mt-1" />}
                      </div>
                    )
                  }
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></div>
                  <span>Current Streak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"></div>
                  <span>Active Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-muted"></div>
                  <span>Inactive</span>
                </div>
              </div>

              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Streak Milestones</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-xs">3 Day Streak</span>
                    </div>
                    <span className="text-xs font-medium">
                      {streakData.currentStreak >= 3 ? "Achieved" : `${streakData.currentStreak}/3`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs">7 Day Streak</span>
                    </div>
                    <span className="text-xs font-medium">
                      {streakData.currentStreak >= 7 ? "Achieved" : `${streakData.currentStreak}/7`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span className="text-xs">14 Day Streak</span>
                    </div>
                    <span className="text-xs font-medium">
                      {streakData.currentStreak >= 14 ? "Achieved" : `${streakData.currentStreak}/14`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-purple-500" />
                      <span className="text-xs">30 Day Streak</span>
                    </div>
                    <span className="text-xs font-medium">
                      {streakData.currentStreak >= 30 ? "Achieved" : `${streakData.currentStreak}/30`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

