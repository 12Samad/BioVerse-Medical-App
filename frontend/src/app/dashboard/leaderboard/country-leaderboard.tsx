"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Award, Crown, Globe, Medal, Star, Timer, Trophy, User } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

interface LeaderboardEntry {
  _id: string
  userId: string
  name: string
  score: number
  totalTime: number
  rank?: number
  country?: string // Added for our hybrid approach
  countryRank?: number // Added for our hybrid approach
}

interface CountryUserStats {
  country: string
  rank: number
  player: LeaderboardEntry
  nearbyPlayers: LeaderboardEntry[]
}

interface CountryLeaderboardProps {
  timeFrame: "weekly" | "monthly" | "all-time"
  loggedInUserId: string | null
  globalLeaderboard: LeaderboardEntry[] // Use the real leaderboard data
}

// List of countries for our hybrid approach
const COUNTRIES = ["USA", "UK", "Canada", "India", "Germany", "France", "Australia", "Japan", "Brazil", "Pakistan"]

// Deterministically assign a country based on user ID
const assignCountry = (userId: string): string => {
  // Simple hash function to consistently assign the same country to the same user
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  // Use absolute value and modulo to get a country index
  const countryIndex = Math.abs(hash) % COUNTRIES.length
  return COUNTRIES[countryIndex]
}

export default function CountryLeaderboard({ loggedInUserId, globalLeaderboard }: CountryLeaderboardProps) {
  const [countryLeaderboard, setCountryLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<CountryUserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCountry, setUserCountry] = useState<string | null>(null)
  const [availableCountries, setAvailableCountries] = useState<{ country: string; count: number }[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  // Process the global leaderboard to add country information
  const processLeaderboardData = useCallback(() => {
    if (!globalLeaderboard.length) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Note: timeFrame is not used in this hybrid implementation, but would be used
      // in a real backend implementation to filter data by time period

      // Enhance the global leaderboard with country information
      const enhancedLeaderboard = globalLeaderboard.map((entry) => ({
        ...entry,
        country: assignCountry(entry.userId),
      }))

      // Get all countries represented in the leaderboard
      const countryMap = new Map<string, number>()
      enhancedLeaderboard.forEach((entry) => {
        const country = entry.country!
        countryMap.set(country, (countryMap.get(country) || 0) + 1)
      })

      // Convert to array and sort by count
      const countriesArray = Array.from(countryMap.entries())
        .map(([country, count]) => ({
          country,
          count,
        }))
        .sort((a, b) => b.count - a.count)

      setAvailableCountries(countriesArray)

      // Determine user's country if logged in
      if (loggedInUserId) {
        const assignedUserCountry = assignCountry(loggedInUserId)
        setUserCountry(assignedUserCountry)

        // If no country is selected, use the user's country
        if (!selectedCountry) {
          setSelectedCountry(assignedUserCountry)
        }
      }

      // Filter and rank by the selected country
      if (selectedCountry) {
        const countryUsers = enhancedLeaderboard
          .filter((entry) => entry.country === selectedCountry)
          .sort((a, b) => b.score - a.score)

        // Assign country-specific ranks
        countryUsers.forEach((entry, index) => {
          entry.countryRank = index + 1
        })

        setCountryLeaderboard(countryUsers)

        // Calculate user stats if logged in
        if (loggedInUserId) {
          const userIndex = countryUsers.findIndex((entry) => entry.userId === loggedInUserId)

          if (userIndex >= 0) {
            const userEntry = countryUsers[userIndex]

            // Get nearby players (2 above and 2 below)
            const startIndex = Math.max(0, userIndex - 2)
            const endIndex = Math.min(countryUsers.length - 1, userIndex + 2)
            const nearbyPlayers = countryUsers.slice(startIndex, endIndex + 1)

            setUserStats({
              country: selectedCountry,
              rank: userIndex + 1,
              player: userEntry,
              nearbyPlayers,
            })
          } else {
            setUserStats(null)
          }
        }
      }
    } catch (error) {
      console.error("Error processing country leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }, [globalLeaderboard, loggedInUserId, selectedCountry])

  useEffect(() => {
    processLeaderboardData()
  }, [processLeaderboardData])

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country)
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
        <h3 className="text-xl font-bold mb-2">Sign in to view country rankings</h3>
        <p className="text-muted-foreground max-w-md">
          Country rankings are available for logged in users. Sign in to see how you rank among players in your country.
        </p>
      </div>
    )
  }

  if (globalLeaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold mb-2">No leaderboard data available</h3>
        <p className="text-muted-foreground max-w-md">
          There is no leaderboard data available for the selected time period.
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
            <h3 className="text-xl font-bold">Your Country Stats</h3>
            <p className="text-sm text-muted-foreground">
              Your ranking among players in{" "}
              {userCountry === selectedCountry ? userCountry : `${selectedCountry} (not your country)`}
            </p>
            {userCountry !== selectedCountry && userCountry && (
              <p className="text-xs text-muted-foreground mt-1">Your country is {userCountry}</p>
            )}
          </div>

          {userStats ? (
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{userStats.player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Rank #{userStats.rank} in {selectedCountry}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Score</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold">{userStats.player.score}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm text-muted-foreground mb-1">Time</p>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold">{formatTime(userStats.player.totalTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">
                {userCountry === selectedCountry
                  ? "No data available for your profile in your country."
                  : `You don't have a ranking in ${selectedCountry}.`}
              </p>
            </div>
          )}

          {userStats && userStats.nearbyPlayers && userStats.nearbyPlayers.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-3">Nearby Players in {selectedCountry}</h4>
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
                        <span className="text-sm font-medium">#{player.countryRank}</span>
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
                {loading ? "Loading nearby players..." : "No nearby players found in this country."}
              </p>
            </div>
          )}

          {/* Country Selection */}
          {availableCountries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Select Country</h4>
              <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
                {availableCountries.map(({ country, count }) => (
                  <button
                    key={country}
                    onClick={() => handleCountrySelect(country)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                      selectedCountry === country
                        ? "bg-primary text-primary-foreground"
                        : country === userCountry
                          ? "bg-primary/20 hover:bg-primary/30"
                          : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {country}
                    {country === userCountry && " (yours)"}
                    <span className="ml-1 text-xs opacity-70">({count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Country Leaderboard */}
      <Card className="flex-1 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">{selectedCountry} Leaderboard</h2>
            <p className="text-sm text-muted-foreground">Top performers in {selectedCountry}</p>
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
                {countryLeaderboard.length > 0 ? (
                  countryLeaderboard.map((entry, index) => (
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
                        {loading ? "Loading leaderboard data..." : "No data available for this country"}
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

