// Common types used across leaderboard components

export interface LeaderboardEntry {
    _id: string
    userId: string
    name: string
    score: number
    totalTime: number
    rank?: number
    country?: string
    countryRank?: number
    badges?: Badge[]
    streak?: number
    targetExam?: string
  }
  
  export interface UserStats {
    rank: number
    player: LeaderboardEntry
    nearbyPlayers: LeaderboardEntry[]
  }
  
  export interface SpecialtyUser {
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
    badges?: Badge[]
    streak?: number
  }
  
  export interface SpecialtyRanking {
    specialty: string
    userCount: number
    users: SpecialtyUser[]
  }
  
  export interface SpecialtyRankingResponse {
    totalSpecialties: number
    lastUpdated: string
    rankings: SpecialtyRanking[]
  }
  
  export interface UserSpecialtyStats {
    specialty: string
    rank: number
    successRate: number
    questionsAttempted: number
    correctAnswers: number
    averageTimePerQuestion: number
    bestScore: number
    nearbyUsers: SpecialtyUser[]
  }
  
  // New types for badges and streaks
  export interface Badge {
    id: string
    name: string
    description: string
    icon: string // Icon name from Lucide React
    color: string // Tailwind color class
    earnedAt: string // ISO date string
    category: BadgeCategory
    level?: "bronze" | "silver" | "gold" | "platinum" // Optional level for tiered badges
  }
  
  export type BadgeCategory = "achievement" | "streak" | "score" | "specialty" | "challenge" | "participation"
  
  export interface StreakEntry extends LeaderboardEntry {
    streak: number
    lastActive: string // ISO date string
    longestStreak: number
  }
  
  export interface StreakLeaderboardResponse {
    leaderboard: StreakEntry[]
    lastUpdated: string
  }
  
  export interface UserStreakStats {
    rank: number
    player: StreakEntry
    nearbyPlayers: StreakEntry[]
  }
  