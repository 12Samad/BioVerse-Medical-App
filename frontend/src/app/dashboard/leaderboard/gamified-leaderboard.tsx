"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Crown, Medal, Share2, Star, Timer, Trophy, User, Target } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import SpecialtyFilters from "./specialty-filters"
import CountryLeaderboard from "./country-leaderboard"
import StreakLeaderboard from "./streak-leaderboard"
import ExamLeaderboard from "./exam-leaderboard"
import UserBadges from "./user-badges"
import ProgressInsights from "./progress-insights"
import { generateMockBadges } from "./badge-utils"
import type { Badge, LeaderboardEntry, StreakEntry } from "./types"

interface UserStats {
  rank: number
  player: LeaderboardEntry
  nearbyPlayers: LeaderboardEntry[]
}

interface SpecialtyUser {
  rank: number
  userId: string
  userName: string
  successRate: number
  questionsAttempted: number
  correctAnswers: number
  averageTimePerQuestion: number
  totalTimeSpent: number
  bestTest: {
    testId: string
    score: number
    timeSpent: number
    date: string
  }
}

interface SpecialtyRanking {
  specialty: string
  userCount: number
  users: SpecialtyUser[]
}

interface SpecialtyRankingResponse {
  totalSpecialties: number
  lastUpdated: string
  rankings: SpecialtyRanking[]
}

interface UserSpecialtyStats {
  specialty: string
  rank: number
  successRate: number
  questionsAttempted: number
  correctAnswers: number
  averageTimePerQuestion: number
  bestScore: number
  nearbyUsers: SpecialtyUser[]
}

// Define the valid tab types
type TabType = "weekly" | "monthly" | "all-time" | "specialty" | "country" | "streaks" | "exams"

// Base API URL to ensure all calls go to the same address
const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test"

export default function GamifiedLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<{
    weekly: LeaderboardEntry[]
    monthly: LeaderboardEntry[]
    "all-time": LeaderboardEntry[]
  }>({
    weekly: [],
    monthly: [],
    "all-time": [],
  })

  const [userStatsData, setUserStatsData] = useState<{
    weekly: UserStats | null
    monthly: UserStats | null
    "all-time": UserStats | null
  }>({
    weekly: null,
    monthly: null,
    "all-time": null,
  })

  const [loading, setLoading] = useState<{
    weekly: boolean
    monthly: boolean
    "all-time": boolean
    specialty: boolean
    streaks: boolean
    exams: boolean
  }>({
    weekly: true,
    monthly: true,
    "all-time": true,
    specialty: true,
    streaks: true,
    exams: true,
  })

  const [specialtyRankings, setSpecialtyRankings] = useState<SpecialtyRankingResponse | null>(null)
  const [userSpecialtyStats, setUserSpecialtyStats] = useState<UserSpecialtyStats | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [filteredSpecialtyRankings, setFilteredSpecialtyRankings] = useState<SpecialtyRanking[]>([])

  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("all-time")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [userBadges, setUserBadges] = useState<Badge[]>([])
  const [targetExam, setTargetExam] = useState<string | null>(null)

  const fetchLeaderboardData = useCallback(
    async (timeFrame: "weekly" | "monthly" | "all-time") => {
      try {
        setLoading((prev) => ({ ...prev, [timeFrame]: true }))

        const userId = localStorage.getItem("Medical_User_Id")
        if (userId && !loggedInUserId) {
          setLoggedInUserId(userId)
        }

        // Fetch leaderboard data
        const leaderboardRes = await fetch(`${API_BASE_URL}/leaderboard?timeFrame=${timeFrame}`)

        if (!leaderboardRes.ok) {
          throw new Error(`Failed to fetch leaderboard data: ${leaderboardRes.status}`)
        }

        const leaderboardData = await leaderboardRes.json()

        if (leaderboardData.success) {
          setLeaderboardData((prev) => ({
            ...prev,
            [timeFrame]: leaderboardData.data.leaderboard,
          }))
        }

        // Fetch user stats if user is logged in
        if (userId) {
          const userStatsRes = await fetch(`${API_BASE_URL}/leaderboard/player/${userId}?timeFrame=${timeFrame}`)

          if (userStatsRes.ok) {
            const userStatsData = await userStatsRes.json()

            if (userStatsData.success) {
              setUserStatsData((prev) => ({
                ...prev,
                [timeFrame]: userStatsData.data,
              }))
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching ${timeFrame} data:`, error)
      } finally {
        setLoading((prev) => ({ ...prev, [timeFrame]: false }))
      }
    },
    [loggedInUserId],
  )

  const fetchUserBadges = useCallback(async () => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) return

      // In a real implementation, we would fetch badges from the backend
      // For now, we'll generate mock badges based on the user's score
      const userStats = userStatsData["all-time"]
      if (userStats && userStats.player) {
        const mockBadges = generateMockBadges(userId, userStats.player.score, userSpecialtyStats?.specialty)
        setUserBadges(mockBadges)
      }
    } catch (error) {
      console.error("Error fetching user badges:", error)
    }
  }, [userStatsData, userSpecialtyStats])

  const extractUserSpecialtyStats = useCallback((data: SpecialtyRankingResponse, userId: string) => {
    // Find the user in each specialty
    let userFound = false
    let bestSpecialty: UserSpecialtyStats | null = null

    for (const specialty of data.rankings) {
      const userIndex = specialty.users.findIndex((user) => user.userId === userId)

      if (userIndex >= 0) {
        userFound = true
        const user = specialty.users[userIndex]

        // Get nearby users (2 above and 2 below)
        const startIndex = Math.max(0, userIndex - 2)
        const endIndex = Math.min(specialty.users.length - 1, userIndex + 2)
        const nearbyUsers = specialty.users.slice(startIndex, endIndex + 1)

        const specialtyStats: UserSpecialtyStats = {
          specialty: specialty.specialty,
          rank: user.rank,
          successRate: user.successRate,
          questionsAttempted: user.questionsAttempted,
          correctAnswers: user.correctAnswers,
          averageTimePerQuestion: user.averageTimePerQuestion,
          bestScore: user.bestTest.score,
          nearbyUsers: nearbyUsers,
        }

        // If this is the first specialty found or has a better rank than previous best
        if (!bestSpecialty || user.rank < bestSpecialty.rank) {
          bestSpecialty = specialtyStats
          setSelectedSpecialty(specialty.specialty)
        }
      }
    }

    if (userFound && bestSpecialty) {
      setUserSpecialtyStats(bestSpecialty)
    } else {
      setUserSpecialtyStats(null)
    }
  }, [])

  const fetchSpecialtyRankings = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, specialty: true }))
      const response = await fetch(`${API_BASE_URL}/specialty-ranking`)

      if (!response.ok) {
        throw new Error(`Failed to fetch specialty rankings: ${response.status}`)
      }

      const data = await response.json()
      setSpecialtyRankings(data)

      // Initialize filtered rankings with all specialties
      setFilteredSpecialtyRankings(data.rankings)

      // Extract user's specialty stats if logged in
      const userId = localStorage.getItem("Medical_User_Id")
      if (userId) {
        extractUserSpecialtyStats(data, userId)
      }
    } catch (error) {
      console.error("Error fetching specialty rankings:", error)
    } finally {
      setLoading((prev) => ({ ...prev, specialty: false }))
    }
  }, [extractUserSpecialtyStats])

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      const userId = localStorage.getItem("Medical_User_Id")
      if (userId) {
        setLoggedInUserId(userId)

        // Set a mock target exam based on user ID
        if (userId) {
          const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
          const exams = ["USMLE Step 1", "USMLE Step 2 CK", "ENARE 2025", "MCCQE Part I"]
          setTargetExam(exams[hash % exams.length])
        }
      }

      // Load all-time data first
      await fetchLeaderboardData("all-time")
      setInitialLoadComplete(true)
    }

    loadInitialData()
  }, [fetchLeaderboardData])

  // Fetch badges when user stats are loaded
  useEffect(() => {
    if (userStatsData["all-time"] && loggedInUserId) {
      fetchUserBadges()
    }
  }, [userStatsData, loggedInUserId, fetchUserBadges])

  // Load data for the active tab when it changes
  useEffect(() => {
    if (initialLoadComplete) {
      if (activeTab === "specialty") {
        if (!specialtyRankings) {
          fetchSpecialtyRankings()
        }
      } else if (activeTab !== "country" && activeTab !== "streaks" && activeTab !== "exams") {
        // Only fetch data for weekly, monthly, all-time tabs
        if (leaderboardData[activeTab].length === 0) {
          fetchLeaderboardData(activeTab)
        }
      }
    }
  }, [activeTab, fetchLeaderboardData, fetchSpecialtyRankings, initialLoadComplete, specialtyRankings, leaderboardData])

  // Handle specialty filtering
  useEffect(() => {
    if (specialtyRankings) {
      if (selectedSpecialty === "all" || !selectedSpecialty) {
        setFilteredSpecialtyRankings(specialtyRankings.rankings)
      } else {
        const filtered = specialtyRankings.rankings.filter((ranking) => ranking.specialty === selectedSpecialty)
        setFilteredSpecialtyRankings(filtered)
      }
    }
  }, [selectedSpecialty, specialtyRankings])

  const formatTime = (totalTime: number) => {
    const minutes = Math.floor(totalTime / 60)
    const seconds = totalTime % 60
    return `${minutes}m ${seconds}s`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRowStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-950/50 dark:to-transparent"
      case 2:
        return "bg-gradient-to-r from-gray-300/10 to-transparent dark:from-gray-800/50 dark:to-transparent"
      case 3:
        return "bg-gradient-to-r from-amber-500/10 to-transparent dark:from-amber-950/50 dark:to-transparent"
      default:
        return ""
    }
  }

  const getTimeFrameLabel = () => {
    switch (activeTab) {
      case "weekly":
        return "This Week"
      case "monthly":
        return "This Month"
      case "all-time":
        return "All Time"
      case "specialty":
        return selectedSpecialty ? selectedSpecialty : "By Specialty"
      case "country":
        return "Country Rankings"
      case "streaks":
        return "Streak Rankings"
      case "exams":
        return "Exam Rankings"
      default:
        return "All Time"
    }
  }

  const shareProgress = () => {
    let text = ""

    if (activeTab === "specialty" && userSpecialtyStats) {
      text = `I'm ranked #${userSpecialtyStats.rank} in ${userSpecialtyStats.specialty} with a ${userSpecialtyStats.successRate.toFixed(1)}% success rate in the Medical Quiz! Can you beat my score?`
    } else {
      const currentUserStats =
        activeTab !== "specialty" && activeTab !== "country" && activeTab !== "streaks" && activeTab !== "exams"
          ? userStatsData[activeTab]
          : null
      const rank = currentUserStats?.rank || "N/A"
      const score = currentUserStats?.player?.score || 0
      text = `I'm currently ranked #${rank} with a score of ${score} in the Medical Quiz ${getTimeFrameLabel()} leaderboard! Can you beat my score?`
    }

    const url = window.location.href

    if (navigator.share) {
      navigator
        .share({
          title: "My Medical Quiz Progress",
          text: text,
          url: url,
        })
        .catch((error) => console.log("Error sharing:", error))
    } else {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
      window.open(shareUrl, "_blank")
    }
  }

  // Handle specialty selection
  const handleSpecialtySelect = useCallback(
    (specialty: string) => {
      setSelectedSpecialty(specialty)

      if (specialty === "all") {
        // Reset to show all specialties
        if (specialtyRankings) {
          setFilteredSpecialtyRankings(specialtyRankings.rankings)
        }
        return
      }

      if (specialtyRankings && loggedInUserId) {
        const specialtyData = specialtyRankings.rankings.find((s) => s.specialty === specialty)
        if (specialtyData) {
          const userIndex = specialtyData.users.findIndex((user) => user.userId === loggedInUserId)

          if (userIndex >= 0) {
            const user = specialtyData.users[userIndex]

            // Get nearby users (2 above and 2 below)
            const startIndex = Math.max(0, userIndex - 2)
            const endIndex = Math.min(specialtyData.users.length - 1, userIndex + 2)
            const nearbyUsers = specialtyData.users.slice(startIndex, endIndex + 1)

            setUserSpecialtyStats({
              specialty: specialty,
              rank: user.rank,
              successRate: user.successRate,
              questionsAttempted: user.questionsAttempted,
              correctAnswers: user.correctAnswers,
              averageTimePerQuestion: user.averageTimePerQuestion,
              bestScore: user.bestTest.score,
              nearbyUsers: nearbyUsers,
            })
          } else {
            setUserSpecialtyStats(null)
          }
        }
      }
    },
    [specialtyRankings, loggedInUserId],
  )

  // Get all available specialties for the filter component
  const getAllSpecialties = useCallback(() => {
    if (!specialtyRankings) return []
    return specialtyRankings.rankings.map((ranking) => ranking.specialty)
  }, [specialtyRankings])

  // Get current data based on active tab
  const currentLeaderboard =
    activeTab === "specialty" || activeTab === "country" || activeTab === "streaks" || activeTab === "exams"
      ? []
      : leaderboardData[activeTab] || []

  const currentUserStats =
    activeTab !== "specialty" && activeTab !== "country" && activeTab !== "streaks" && activeTab !== "exams"
      ? userStatsData[activeTab]
      : null

  const isCurrentTabLoading = loading[activeTab as keyof typeof loading] || false

  if (!initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto p-4">
      {/* User Stats Card - Always displayed for certain tabs */}
      {activeTab !== "country" && activeTab !== "streaks" && activeTab !== "exams" && (
        <Card className="w-full md:w-96 p-6 order-first md:order-last">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">Your Stats</h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === "specialty" ? "Your performance by specialty" : "Current ranking and nearby players"}
              </p>
            </div>

            {/* Personal Progress Insights - New component */}
            {loggedInUserId && currentUserStats?.player && (
              <ProgressInsights
                userId={loggedInUserId}
                score={currentUserStats.player.score}
                specialty={activeTab === "specialty" ? selectedSpecialty || undefined : undefined}
                targetExam={targetExam || undefined}
              />
            )}

            {activeTab !== "specialty" ? (
              // Regular leaderboard stats
              <>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{currentUserStats?.player?.name || "Not Available"}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentUserStats ? `Rank #${currentUserStats.rank}` : "Take a test to get ranked!"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-background">
                      <p className="text-sm text-muted-foreground mb-1">Score</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="text-lg font-bold">{currentUserStats?.player?.score || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background">
                      <p className="text-sm text-muted-foreground mb-1">Time</p>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-bold">
                          {currentUserStats?.player?.totalTime
                            ? formatTime(currentUserStats.player.totalTime)
                            : "0m 0s"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {currentUserStats && currentUserStats.nearbyPlayers && currentUserStats.nearbyPlayers.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Nearby Players</h4>
                    <div className="space-y-2">
                      {currentUserStats.nearbyPlayers.map((player) => (
                        <div
                          key={player._id}
                          className={`p-2 rounded-lg ${
                            player.userId === loggedInUserId ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">#{player.rank}</span>
                              <span className="text-sm">{player.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3 text-primary" />
                              <span className="text-sm font-medium">{player.score}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      {isCurrentTabLoading
                        ? "Loading nearby players..."
                        : "Take a test to see how you compare with other players!"}
                    </p>
                  </div>
                )}
              </>
            ) : (
              // Specialty stats
              <>
                {userSpecialtyStats ? (
                  <>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedSpecialty || userSpecialtyStats.specialty}</p>
                          <p className="text-sm text-muted-foreground">Rank #{userSpecialtyStats.rank}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold ${
                                userSpecialtyStats.successRate >= 90
                                  ? "text-green-500"
                                  : userSpecialtyStats.successRate >= 70
                                    ? "text-amber-500"
                                    : "text-red-500"
                              }`}
                            >
                              {userSpecialtyStats.successRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-sm text-muted-foreground mb-1">Best Score</p>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            <span className="text-lg font-bold">{userSpecialtyStats.bestScore}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-sm text-muted-foreground mb-1">Questions</p>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {userSpecialtyStats.correctAnswers}/{userSpecialtyStats.questionsAttempted}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-background">
                          <p className="text-sm text-muted-foreground mb-1">Avg. Time</p>
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg font-bold">{userSpecialtyStats.averageTimePerQuestion}s</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {userSpecialtyStats.nearbyUsers && userSpecialtyStats.nearbyUsers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">Nearby Players</h4>
                        <div className="space-y-2">
                          {userSpecialtyStats.nearbyUsers.map((user) => (
                            <div
                              key={user.userId}
                              className={`p-2 rounded-lg ${
                                user.userId === loggedInUserId
                                  ? "bg-primary/10 dark:bg-primary/20"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">#{user.rank}</span>
                                  <span className="text-sm">{user.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{user.successRate.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">
                      {loading.specialty
                        ? "Loading your specialty stats..."
                        : "No specialty data available for your profile. Take a test to get ranked!"}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* User Badges - Only show when user is logged in and has badges */}
            {loggedInUserId && userBadges.length > 0 && <UserBadges badges={userBadges} className="mt-4" />}

            {/* Target Exam Information */}
            {loggedInUserId && targetExam && (
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Target Exam</h4>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm">{targetExam}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setActiveTab("exams")}>
                    View Rankings
                  </Button>
                </div>
              </div>
            )}

            {/* Social Sharing Buttons */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-medium">Share Your Progress</h4>
              <Button onClick={shareProgress} className="w-full flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4" />
                Share My Progress
              </Button>
              <div className="flex flex-col gap-2 justify-between">
                <button
                  onClick={() => {
                    let text = ""
                    if (activeTab === "specialty" && userSpecialtyStats) {
                      text = `I'm ranked #${userSpecialtyStats.rank} in ${userSpecialtyStats.specialty} with a ${userSpecialtyStats.successRate.toFixed(1)}% success rate in the Medical Quiz!`
                    } else {
                      text = `I scored ${currentUserStats?.player?.score || 0} points on the Medical Quiz!`
                    }
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + " Can you beat my score?")}&url=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }}
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-[#1DA1F2] text-white hover:bg-[#1a91da] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  Twitter
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-[#1877F2] text-white hover:bg-[#166fe5] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  Facebook
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-[#0A66C2] text-white hover:bg-[#0958a7] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Leaderboard */}
      <Card className="flex-1 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Contenders</h2>
            <p className="text-sm text-muted-foreground">See who&apos;s leading the pack</p>
          </div>
        </div>

        <Tabs defaultValue="all-time" value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
          <TabsList className="grid w-full grid-cols-7 mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
            <TabsTrigger value="specialty">Specialty</TabsTrigger>
            <TabsTrigger value="country">Country</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
          </TabsList>

          {/* Specialty Filters - Only show when specialty tab is active */}
          {activeTab === "specialty" && specialtyRankings && (
            <SpecialtyFilters
              specialties={getAllSpecialties()}
              selectedSpecialty={selectedSpecialty}
              onSpecialtySelect={handleSpecialtySelect}
              className="mb-4"
            />
          )}

          {activeTab !== "specialty" && activeTab !== "country" && activeTab !== "streaks" && activeTab !== "exams" && (
            <div className="relative">
              {isCurrentTabLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}

              <ScrollArea className="h-[600px] w-full rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <TableRow>
                      <TableHead className="w-20">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLeaderboard.length > 0 ? (
                      currentLeaderboard.map((entry, index) => (
                        <TableRow
                          key={entry._id}
                          className={`${getRowStyle(index + 1)} ${entry.userId === loggedInUserId ? "border-l-2 border-primary" : ""}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getRankIcon(index + 1)}
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {index < 3 && <Crown className="h-4 w-4 text-primary" />}
                              {entry.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Star className="h-4 w-4 text-primary" />
                              {entry.score}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              {formatTime(entry.totalTime)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <p className="text-muted-foreground">
                            {isCurrentTabLoading
                              ? "Loading leaderboard data..."
                              : "No data available for this time period"}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {activeTab === "specialty" && (
            <div className="relative">
              {loading.specialty && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-md">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              )}

              <ScrollArea className="h-[600px] w-full rounded-md border">
                {specialtyRankings && filteredSpecialtyRankings.length > 0 ? (
                  <div className="space-y-6 p-4">
                    {filteredSpecialtyRankings.map((specialtyData) => (
                      <div key={specialtyData.specialty} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold">{specialtyData.specialty}</h3>
                          <span className="text-sm text-muted-foreground">{specialtyData.userCount} users</span>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Rank</TableHead>
                              <TableHead>Player</TableHead>
                              <TableHead className="text-right">Success Rate</TableHead>
                              <TableHead className="text-right">Questions</TableHead>
                              <TableHead className="text-right">Avg. Time</TableHead>
                              <TableHead className="text-right">Best Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {specialtyData.users.map((user) => (
                              <TableRow
                                key={`${specialtyData.specialty}-${user.userId}`}
                                className={`${user.rank <= 3 ? getRowStyle(user.rank) : ""} ${user.userId === loggedInUserId ? "border-l-2 border-primary" : ""}`}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {getRankIcon(user.rank)}
                                    {user.rank}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {user.rank <= 3 && <Crown className="h-4 w-4 text-primary" />}
                                    {user.userName}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span
                                      className={`font-medium ${user.successRate >= 90 ? "text-green-500" : user.successRate >= 70 ? "text-amber-500" : "text-red-500"}`}
                                    >
                                      {user.successRate.toFixed(1)}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span>
                                      {user.correctAnswers}/{user.questionsAttempted}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.averageTimePerQuestion}s</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Star className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{user.bestTest.score}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground text-right pt-2">
                      Last updated: {specialtyRankings ? new Date(specialtyRankings.lastUpdated).toLocaleString() : ""}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">
                      {loading.specialty ? "Loading specialty rankings..." : "No specialty ranking data available"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {activeTab === "country" && (
            <CountryLeaderboard
              timeFrame="all-time"
              loggedInUserId={loggedInUserId}
              globalLeaderboard={leaderboardData["all-time"]}
            />
          )}

          {activeTab === "streaks" && (
            <StreakLeaderboard
              timeFrame="all-time"
              loggedInUserId={loggedInUserId}
              globalLeaderboard={leaderboardData["all-time"] as unknown as StreakEntry[]}
            />
          )}

          {activeTab === "exams" && (
            <ExamLeaderboard loggedInUserId={loggedInUserId} globalLeaderboard={leaderboardData["all-time"]} />
          )}
        </Tabs>
      </Card>
    </div>
  )
}

