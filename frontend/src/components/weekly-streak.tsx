"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import axios from "axios"
import { Award, Calendar, Flame, Star, Trophy } from "lucide-react"
import { useEffect, useState } from "react"

interface StreakData {
  date: string
  count: number
}

export default function WeeklyStreak() {
  const [userId, setUserId] = useState<string | null>(null)
  const [streakData, setStreakData] = useState<StreakData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("Medical_User_Id")
      setUserId(storedUserId)
    }
  }, [])

  useEffect(() => {
    const fetchStreakData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/test/streak/${userId}`)
        console.log("Streak data response:", response.data)

        if (response.data && Array.isArray(response.data.streakData)) {
          setStreakData(response.data.streakData)
          setCurrentStreak(response.data.currentStreak || 0)
          // Assuming the API would return this, or calculate it client-side
          setLongestStreak(response.data.longestStreak || response.data.currentStreak || 0)

          // Trigger animation if there's a streak
          if (response.data.currentStreak > 0) {
            setShowAnimation(true)
            setTimeout(() => setShowAnimation(false), 2000)
          }
        } else {
          console.error("Invalid streak data format:", response.data)
          setError("Invalid data format received from server")
        }
      } catch (error) {
        console.error("Error fetching streak data:", error)
        setError("Failed to fetch streak data")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchStreakData()
    }
  }, [userId])

  // Get the last 7 days
  const getLast7Days = () => {
    const days = []
    const today = new Date()

    // Start with today (current day) and then the next 6 days
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(today.getDate() + i)
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        isToday: i === 0,
      })
    }
    return days
  }

  const last7Days = getLast7Days()

  // Map streak data to the last 7 days
  const mappedData = last7Days.map((day) => {
    const found = streakData.find((item) => item.date === day.date)
    return {
      ...day,
      count: found ? found.count : 0,
      hasActivity: found && found.count > 0,
    }
  })

  // Calculate milestone achievements
  const milestones = [
    { days: 3, achieved: currentStreak >= 3, icon: <Star className="h-4 w-4" />, label: "3-Day Streak" },
    { days: 7, achieved: currentStreak >= 7, icon: <Flame className="h-4 w-4" />, label: "7-Day Streak" },
    { days: 14, achieved: currentStreak >= 14, icon: <Trophy className="h-4 w-4" />, label: "14-Day Streak" },
    { days: 30, achieved: currentStreak >= 30, icon: <Award className="h-4 w-4" />, label: "30-Day Streak" },
  ]

  // Get motivational message based on streak
  const getMotivationalMessage = () => {
    if (currentStreak === 0) return "Start your streak today!"
    if (currentStreak === 1) return "Great start! Keep going!"
    if (currentStreak < 5) return "You're building momentum!"
    if (currentStreak < 10) return "Impressive dedication!"
    if (currentStreak < 20) return "You're on fire! Amazing work!"
    return "Unstoppable! You're a study champion!"
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Study Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Study Streak
          </CardTitle>
          {currentStreak > 0 && (
            <Badge variant="secondary" className="bg-white text-blue-600">
              {currentStreak} day{currentStreak !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <div className="flex items-center gap-2">
                  <Flame
                    className={cn(
                      "h-6 w-6 transition-all duration-500",
                      currentStreak > 0 ? "text-orange-500" : "text-muted",
                      showAnimation && "scale-150 text-orange-600",
                    )}
                  />
                  <span className="text-2xl font-bold">{currentStreak}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground">Longest Streak</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{longestStreak}</span>
                  <Trophy className={cn("h-6 w-6", longestStreak > 0 ? "text-amber-500" : "text-muted")} />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-center font-medium mb-2">{getMotivationalMessage()}</p>
              <Progress value={(currentStreak / 30) * 100} className="h-2" />
            </div>

            <div className="flex justify-between items-end h-36 mt-6 mb-2">
              {mappedData.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 rounded-t-md transition-all duration-300 ease-out flex items-center justify-center",
                      day.hasActivity ? "bg-gradient-to-t from-blue-500 to-indigo-500" : "bg-gray-200",
                      day.isToday && day.hasActivity && "animate-pulse",
                    )}
                    style={{
                      height: day.count > 0 ? `${Math.min(100, Math.max(20, day.count * 15))}%` : "10%",
                    }}
                  >
                    {day.count > 0 && <span className="text-xs font-bold text-white">{day.count}</span>}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-2 font-medium",
                      day.isToday ? "bg-blue-600 text-white px-2 py-0.5 rounded-full" : "text-muted-foreground",
                    )}
                  >
                    {day.dayName}
                  </div>
                  {day.isToday && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1"></div>}
                </div>
              ))}
            </div>

            {/* Milestones/Achievements */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Achievements</h4>
              <div className="flex flex-wrap gap-2">
                {milestones.map((milestone, index) => (
                  <Badge
                    key={index}
                    variant={milestone.achieved ? "default" : "outline"}
                    className={cn(
                      "flex items-center gap-1 transition-all",
                      milestone.achieved ? "bg-blue-600" : "text-muted-foreground opacity-70",
                    )}
                  >
                    {milestone.icon}
                    {milestone.label}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

