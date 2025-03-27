"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface ProgressData {
  totalScheduled: number
  totalCompleted: number
  progressPercentage: number
}

export function ReviewProgressMeter() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true)
        setError(null)

        const userId = localStorage.getItem("Medical_User_Id")
        if (!userId) {
          setError("User ID not found")
          setLoading(false)
          return
        }

        // Use the existing dashboard API endpoint
        const response = await fetch(`https://medical-backend-loj4.onrender.com/api/reviews/dashboard?userId=${userId}`)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        // Extract the relevant data for the progress meter
        const totalScheduled = data.totalReviews || 0
        const totalCompleted = data.completedReviews || 0
        const progressPercentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0

        setProgressData({
          totalScheduled,
          totalCompleted,
          progressPercentage,
        })

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch progress data:", error)
        setError("Failed to load progress data")
        setLoading(false)
      }
    }

    fetchProgressData()
  }, [])

  // Calculate the stroke-dasharray and stroke-dashoffset for the donut chart
  const calculateDonutValues = (percentage: number) => {
    const radius = 40
    const circumference = 2 * Math.PI * radius

    return {
      circumference,
      offset: circumference - (percentage / 100) * circumference,
    }
  }

  const renderDonutChart = () => {
    if (!progressData) return null

    const { circumference, offset } = calculateDonutValues(progressData.progressPercentage)

    return (
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="60" cy="60" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold">{progressData.progressPercentage}%</span>
          <span className="text-xs text-muted-foreground">Reviewed</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Progress</CardTitle>
          <CardDescription>Track your overall review progress</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Progress</CardTitle>
          <CardDescription>Track your overall review progress</CardDescription>
        </CardHeader>
        <CardContent className="py-2">
          <div className="text-center text-sm text-muted-foreground">
            <p>Unable to load progress data</p>
            <button onClick={() => window.location.reload()} className="text-primary underline mt-1">
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Progress</CardTitle>
        <CardDescription>Track how much of your scheduled content you&apos;ve reviewed</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-between">
        {renderDonutChart()}
        <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
          <h3 className="text-lg font-medium mb-2">Your Progress</h3>
          <p className="text-sm text-muted-foreground mb-1">
            You&apos;ve reviewed <span className="font-medium">{progressData?.progressPercentage}%</span> of your total
            scheduled content.
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{progressData?.totalCompleted}</span> of{" "}
            <span className="font-medium">{progressData?.totalScheduled}</span> items completed
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ReviewProgressMeter

