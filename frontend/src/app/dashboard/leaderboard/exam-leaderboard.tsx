"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Crown, Medal, Star, Timer, Trophy, User, Target, BookOpen } from 'lucide-react'
import { useState, useEffect, useCallback } from "react"
import type { LeaderboardEntry } from "./types"
import { Badge } from "@/components/ui/badge"

interface ExamLeaderboardProps {
  loggedInUserId: string | null
  globalLeaderboard: LeaderboardEntry[] // Use the real leaderboard data
}

// List of exams for our mock implementation
const EXAMS = [
  "USMLE Step 1",
  "USMLE Step 2 CK",
  "USMLE Step 3",
  "COMLEX Level 1",
  "COMLEX Level 2",
  "ENARE 2025",
  "MCCQE Part I",
  "MCCQE Part II",
  "PLAB 1",
  "PLAB 2",
  "AMC MCQ",
  "NEET PG"
]

// Deterministically assign an exam based on user ID
const assignExam = (userId: string): string => {
  // Simple hash function to consistently assign the same exam to the same user
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  // Use absolute value and modulo to get an exam index
  const examIndex = Math.abs(hash) % EXAMS.length
  return EXAMS[examIndex]
}

interface ExamUserStats {
  exam: string
  rank: number
  player: LeaderboardEntry
  nearbyPlayers: LeaderboardEntry[]
  totalParticipants: number
  averageScore: number
  topScore: number
}

export default function ExamLeaderboard({ loggedInUserId, globalLeaderboard }: ExamLeaderboardProps) {
  const [examLeaderboard, setExamLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<ExamUserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userExam, setUserExam] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [availableExams, setAvailableExams] = useState<{ exam: string; count: number }[]>([])

  // Process the global leaderboard to add exam information
  const processLeaderboardData = useCallback(() => {
    if (!globalLeaderboard.length) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Enhance the global leaderboard with exam information
      const enhancedLeaderboard = globalLeaderboard.map((entry) => ({
        ...entry,
        targetExam: assignExam(entry.userId),
      }))

      // Get all exams represented in the leaderboard
      const examMap = new Map<string, number>()
      enhancedLeaderboard.forEach((entry) => {
        const exam = entry.targetExam!
        examMap.set(exam, (examMap.get(exam) || 0) + 1)
      })

      // Convert to array and sort by count
      const examsArray = Array.from(examMap.entries())
        .map(([exam, count]) => ({
          exam,
          count,
        }))
        .sort((a, b) => b.count - a.count)

      setAvailableExams(examsArray)

      // Determine user's exam if logged in
      if (loggedInUserId) {
        const assignedUserExam = assignExam(loggedInUserId)
        setUserExam(assignedUserExam)

        // If no exam is selected, use the user's exam
        if (!selectedExam) {
          setSelectedExam(assignedUserExam)
        }
      }

      // Filter and rank by the selected exam
      if (selectedExam) {
        const examUsers = enhancedLeaderboard
          .filter((entry) => entry.targetExam === selectedExam)
          .sort((a, b) => b.score - a.score)

        // Assign exam-specific ranks
        examUsers.forEach((entry, index) => {
          entry.rank = index + 1
        })

        setExamLeaderboard(examUsers)

        // Calculate user stats if logged in
        if (loggedInUserId) {
          const userIndex = examUsers.findIndex((entry) => entry.userId === loggedInUserId)

          if (userIndex >= 0) {
            const userEntry = examUsers[userIndex]

            // Get nearby players (2 above and 2 below)
            const startIndex = Math.max(0, userIndex - 2)
            const endIndex = Math.min(examUsers.length - 1, userIndex + 2)
            const nearbyPlayers = examUsers.slice(startIndex, endIndex + 1)

            // Calculate some stats for the exam
            const totalParticipants = examUsers.length
            const averageScore = Math.round(
              examUsers.reduce((sum, entry) => sum + entry.score, 0) / totalParticipants
            )
            const topScore = examUsers.length > 0 ? examUsers[0].score : 0

            setUserStats({
              exam: selectedExam,
              rank: userIndex + 1,
              player: userEntry,
              nearbyPlayers,
              totalParticipants,
              averageScore,
              topScore
            })
          } else {
            setUserStats(null)
          }
        }
      }
    } catch (error) {
      console.error("Error processing exam leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }, [globalLeaderboard, loggedInUserId, selectedExam])

  useEffect(() => {
    processLeaderboardData()
  }, [processLeaderboardData])

  const handleExamSelect = (exam: string) => {
    setSelectedExam(exam)
  }

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
        <h3 className="text-xl font-bold mb-2">Sign in to view exam rankings</h3>
        <p className="text-muted-foreground max-w-md">
          Exam rankings are available for logged in users. Sign in to see how you rank among others preparing for the same exam.
        </p>
      </div>
    )
  }

  if (globalLeaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold mb-2">No leaderboard data available</h3>
        <p className="text-muted-foreground max-w-md">
          There is no leaderboard data available for exam rankings.
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
            <h3 className="text-xl font-bold">Your Exam Stats</h3>
            <p className="text-sm text-muted-foreground">
              Your ranking among others preparing for{" "}
              {userExam === selectedExam ? userExam : `${selectedExam} (not your exam)`}
            </p>
            {userExam !== selectedExam && userExam && (
              <p className="text-xs text-muted-foreground mt-1">Your exam is {userExam}</p>
            )}
          </div>

          {userStats ? (
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{userStats.player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Rank #{userStats.rank} of {userStats.totalParticipants} for {selectedExam}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold">{userStats.player.score}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Top Score</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-bold">{userStats.topScore}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-background">
                <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold">{userStats.averageScore}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">
                {userExam === selectedExam
                  ? "No data available for your profile in this exam."
                  : `You don't have a ranking for ${selectedExam}.`}
              </p>
            </div>
          )}

          {userStats && userStats.nearbyPlayers && userStats.nearbyPlayers.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-3">Nearby Competitors for {selectedExam}</h4>
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
                {loading ? "Loading nearby competitors..." : "No nearby competitors found for this exam."}
              </p>
            </div>
          )}

          {/* Exam Selection */}
          {availableExams.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Select Exam</h4>
              <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
                {availableExams.map(({ exam, count }) => (
                  <Badge
                    key={exam}
                    variant={selectedExam === exam ? "default" : exam === userExam ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleExamSelect(exam)}
                  >
                    {exam}
                    {exam === userExam && " (yours)"}
                    <span className="ml-1 text-xs opacity-70">({count})</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Exam Leaderboard */}
      <Card className="flex-1 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">{selectedExam} Leaderboard</h2>
            <p className="text-sm text-muted-foreground">Top performers preparing for {selectedExam}</p>
          </div>
        </div>

        <div className="relative">
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
                {examLeaderboard.length > 0 ? (
                  examLeaderboard.map((entry, index) => (
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
                        {loading ? "Loading leaderboard data..." : "No data available for this exam"}
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
