"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Calendar, Crown, Flame, Medal, Star, Trophy, User } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import type { StreakEntry, UserStreakStats } from "./types"

interface StreakLeaderboardProps {
  timeFrame: "weekly" | "monthly" | "all-time"
  loggedInUserId: string | null
  globalLeaderboard: StreakEntry[] // Use the real leaderboard data with streak info
}

// Helper function to generate mock streak data
const generateMockStreakData = (
  globalLeaderboard: Omit<StreakEntry, "streak" | "lastActive" | "longestStreak">[],
): StreakEntry[] => {
  // Use the global leaderboard as a base, but add streak information
  return globalLeaderboard
    .map((entry, index) => {
      // Generate a streak value that roughly correlates with their rank
      // Higher ranked users tend to have higher streaks
      const baseStreak = Math.max(30 - Math.floor(index / 3), 1)
      const randomFactor = Math.floor(Math.random() * 5) - 2 // -2 to +2
      const streak = Math.max(baseStreak + randomFactor, 1)

      // Generate a longest streak that's at least as high as the current streak
      const longestStreak = Math.max(streak, streak + Math.floor(Math.random() * 10))

      // Generate a last active date (within the last 2 days)
      const lastActive = new Date()
      lastActive.setHours(lastActive.getHours() - Math.floor(Math.random() * 48))

      return {
        ...entry,
        streak,
        longestStreak,
        lastActive: lastActive.toISOString(),
      }
    })
    .sort((a, b) => b.streak - a.streak) // Sort by streak, not by score
}

export default function StreakLeaderboard({  loggedInUserId, globalLeaderboard }: StreakLeaderboardProps) {
  const [streakLeaderboard, setStreakLeaderboard] = useState<StreakEntry[]>([])
  const [userStats, setUserStats] = useState<UserStreakStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Process the global leaderboard to add streak information
  const processLeaderboardData = useCallback(() => {
    if (!globalLeaderboard.length) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Generate mock streak data based on the global leaderboard
      const streakData = generateMockStreakData(globalLeaderboard)
      // Assign ranks based on streak
      streakData.forEach((entry, index) => {
        entry.rank = index + 1
      })

      setStreakLeaderboard(streakData)

      // Calculate user stats if logged in
      if (loggedInUserId) {
        const userIndex = streakData.findIndex((entry) => entry.userId === loggedInUserId)

        if (userIndex >= 0) {
          const userEntry = streakData[userIndex]

          // Get nearby players (2 above and 2 below)
          const startIndex = Math.max(0, userIndex - 2)
          const endIndex = Math.min(streakData.length - 1, userIndex + 2)
          const nearbyPlayers = streakData.slice(startIndex, endIndex + 1)

          setUserStats({
            rank: userIndex + 1,
            player: userEntry,
            nearbyPlayers,
          })
        } else {
          setUserStats(null)
        }
      }
    } catch (error) {
      console.error("Error processing streak leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }, [globalLeaderboard, loggedInUserId])

  useEffect(() => {
    processLeaderboardData()
  }, [processLeaderboardData])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatStreak = (streak: number) => {
    return `${streak} day${streak !== 1 ? "s" : ""}`
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

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-red-500"
    if (streak >= 14) return "text-orange-500"
    if (streak >= 7) return "text-yellow-500"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!loggedInUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold mb-2">Sign in to view streak rankings</h3>
        <p className="text-muted-foreground max-w-md">
          Streak rankings are available for logged in users. Sign in to see how your study streak compares with other
          players.
        </p>
      </div>
    )
  }

  if (globalLeaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <Flame className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold mb-2">No streak data available</h3>
        <p className="text-muted-foreground max-w-md">
          There is no streak data available for the selected time period.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      {/* User Stats Card */}
      <Card className="w-full md:w-96 p-6 order-first md:order-last">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold">Your Streak Stats</h3>
            <p className="text-sm text-muted-foreground">Your current study streak and ranking</p>
          </div>

          {userStats ? (
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Flame className={`h-6 w-6 ${getStreakColor(userStats.player.streak)}`} />
                </div>
                <div>
                  <p className="font-medium">{userStats.player.name}</p>
                  <p className="text-sm text-muted-foreground">Rank #{userStats.rank} in Streaks</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                  <div className="flex items-center gap-2">
                    <Flame className={`h-4 w-4 ${getStreakColor(userStats.player.streak)}`} />
                    <span className={`text-lg font-bold ${getStreakColor(userStats.player.streak)}`}>
                      {formatStreak(userStats.player.streak)}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Longest Streak</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-bold">{formatStreak(userStats.player.longestStreak)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-background">
                <p className="text-sm text-muted-foreground mb-1">Last Active</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(userStats.player.lastActive)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">No streak data available for your profile.</p>
            </div>
          )}

          {userStats && userStats.nearbyPlayers && userStats.nearbyPlayers.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-3">Nearby Players</h4>
              <div className="space-y-2">
                {userStats.nearbyPlayers.map((player) => (
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
                        <Flame className={`h-3 w-3 ${getStreakColor(player.streak)}`} />
                        <span className={`text-sm font-medium ${getStreakColor(player.streak)}`}>{player.streak}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading nearby players..." : "No nearby players found."}
              </p>
            </div>
          )}

          {/* Streak Tips */}
          <div className="p-4 rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Streak Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-start gap-1">
                <Star className="h-3 w-3 mt-0.5 text-primary" />
                <span>Complete at least one quiz daily to maintain your streak</span>
              </li>
              <li className="flex items-start gap-1">
                <Star className="h-3 w-3 mt-0.5 text-primary" />
                <span>Longer streaks earn special badges and rewards</span>
              </li>
              <li className="flex items-start gap-1">
                <Star className="h-3 w-3 mt-0.5 text-primary" />
                <span>You can earn a 1-day streak protection after 7 consecutive days</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Main Streak Leaderboard */}
      <Card className="flex-1 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Streak Leaderboard</h2>
            <p className="text-sm text-muted-foreground">Top users with the longest active study streaks</p>
          </div>
        </div>

        <div className="relative">
          <ScrollArea className="h-[600px] w-full rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Current Streak</TableHead>
                  <TableHead className="text-right">Longest Streak</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streakLeaderboard.length > 0 ? (
                  streakLeaderboard.map((entry, index) => (
                    <TableRow
                      key={entry._id}
                      className={`${getRowStyle(index + 1)} ${
                        entry.userId === loggedInUserId ? "border-l-2 border-primary" : ""
                      }`}
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
                          <Flame className={`h-4 w-4 ${getStreakColor(entry.streak)}`} />
                          <span className={`font-medium ${getStreakColor(entry.streak)}`}>
                            {formatStreak(entry.streak)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{formatStreak(entry.longestStreak)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(entry.lastActive)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {loading ? "Loading streak data..." : "No streak data available"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </Card>
    </div>
  )
}

