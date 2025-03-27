"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { BarChart3, Calendar, Clock, Settings, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"
import { CompletionChart } from "./completion-chart"
import FlashcardExport from "./flashcard-export"
import InfographicSuggestions from "./infographic-suggestions"
import { ReviewPreferencesForm } from "./review-preferences-form"
import { ReviewProgressMeter } from "./review-progress-meter"
import { UpcomingReviews } from "./upcoming-reviews"
import ChallengeModeSession from "./challenge-mode-session"

export default function ReviewDashboard() {
  interface Review {
    _id: string
    title: string
    type: "daily" | "other"
    scheduledFor: string
    stage: number
  }

  interface DashboardStats {
    completionRate: number
    totalReviews: number
    completedReviews: number
    upcomingReviews: Review[]
  }

  const [stats, setStats] = useState<DashboardStats>({
    completionRate: 0,
    totalReviews: 0,
    completedReviews: 0,
    upcomingReviews: [],
  })
  const [loading, setLoading] = useState(true)
  const [showChallengeMode, setShowChallengeMode] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      setLoading(true)
      const response = await axios.get(
        `https://medical-backend-loj4.onrender.com/api/reviews/dashboard?userId=${userId}`,
      )
      setStats(response.data)
      setLoading(false)
    } catch (error) {
      toast.error("Failed to load dashboard data")
      console.log(error)
      setLoading(false)
    }
  }

  const startReviewSession = async () => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await axios.post(
        `https://medical-backend-loj4.onrender.com/api/reviews/start-session?userId=${userId}`,
      )
      toast.success("Review session started!")
      window.location.href = `/dashboard/review/session/${response.data.sessionId}`
    } catch (error) {
      console.log(error)
      toast.error("Failed to start review session")
    }
  }

  const startChallengeMode = () => {
    setShowChallengeMode(true)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  // If challenge mode is active, show the challenge component
  if (showChallengeMode) {
    return <ChallengeModeSession />
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Review Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={startChallengeMode} variant="outline" className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Start Challenge Mode
            </Button>
            <Button onClick={startReviewSession}>Start Review Session</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">{stats.completedReviews} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.upcomingReviews && stats.upcomingReviews[0]
                  ? new Date(stats.upcomingReviews[0].scheduledFor).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "No upcoming reviews"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.upcomingReviews && stats.upcomingReviews[0]
                  ? new Date(stats.upcomingReviews[0].scheduledFor).toLocaleDateString()
                  : "Schedule a review session"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Review Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">Intervals: 24h, 7d, 30d</div>
              <p className="text-xs text-muted-foreground">Based on Ebbinghaus curve</p>
            </CardContent>
          </Card>
        </div>

        {/* Add the ReviewProgressMeter component as a separate section */}
        <div className="mt-6">
          <ReviewProgressMeter />
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Reviews</TabsTrigger>
            <TabsTrigger value="completion">Completion History</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="infographics">Infographics</TabsTrigger>
            <TabsTrigger value="preferences">Review Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Review Sessions</CardTitle>
                <CardDescription>
                  Your scheduled review sessions based on the spaced repetition algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingReviews reviews={stats.upcomingReviews} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completion" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completion History</CardTitle>
                <CardDescription>Your review completion history over time</CardDescription>
              </CardHeader>
              <CardContent>
                <CompletionChart />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="flashcards" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Flashcard Export</CardTitle>
                <CardDescription>Export your flashcards as PDF for offline study or printing</CardDescription>
              </CardHeader>
              <CardContent>
                <FlashcardExport />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="infographics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Infographics</CardTitle>
                <CardDescription>Visual learning aids for your most challenging topics</CardDescription>
              </CardHeader>
              <CardContent>
                <InfographicSuggestions />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="preferences" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Preferences</CardTitle>
                <CardDescription>Customize your preferred review times and frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewPreferencesForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}

