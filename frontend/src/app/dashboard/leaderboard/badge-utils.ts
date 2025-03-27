import type { Badge, BadgeCategory } from "./types"

// Helper function to generate mock badges for a user
export function generateMockBadges(userId: string, score: number, specialty?: string): Badge[] {
  const badges: Badge[] = []
  const now = new Date()

  // Generate some achievement badges based on score
  if (score >= 100) {
    badges.push({
      id: `score-100-${userId}`,
      name: "Century",
      description: "Reached 100 points in total score",
      icon: "trophy",
      color: "bg-green-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
      category: "score",
      level: "bronze",
    })
  }

  if (score >= 500) {
    badges.push({
      id: `score-500-${userId}`,
      name: "High Achiever",
      description: "Reached 500 points in total score",
      icon: "trophy",
      color: "bg-green-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
      category: "score",
      level: "silver",
    })
  }

  if (score >= 1000) {
    badges.push({
      id: `score-1000-${userId}`,
      name: "Master",
      description: "Reached 1000 points in total score",
      icon: "trophy",
      color: "bg-green-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      category: "score",
      level: "gold",
    })
  }

  // Generate streak badges
  const streakValue = Math.floor(score / 100) // Mock streak based on score

  if (streakValue >= 3) {
    badges.push({
      id: `streak-3-${userId}`,
      name: "Consistent",
      description: "Maintained a 3-day study streak",
      icon: "flame",
      color: "bg-orange-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      category: "streak",
      level: "bronze",
    })
  }

  if (streakValue >= 7) {
    badges.push({
      id: `streak-7-${userId}`,
      name: "Weekly Warrior",
      description: "Maintained a 7-day study streak",
      icon: "flame",
      color: "bg-orange-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      category: "streak",
      level: "silver",
    })
  }

  if (streakValue >= 30) {
    badges.push({
      id: `streak-30-${userId}`,
      name: "Monthly Master",
      description: "Maintained a 30-day study streak",
      icon: "flame",
      color: "bg-orange-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      category: "streak",
      level: "gold",
    })
  }

  // Generate specialty badges if specialty is provided
  if (specialty) {
    badges.push({
      id: `specialty-${specialty}-${userId}`,
      name: `${specialty} Specialist`,
      description: `Achieved high proficiency in ${specialty}`,
      icon: "star",
      color: "bg-blue-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      category: "specialty",
      level: score > 800 ? "gold" : score > 400 ? "silver" : "bronze",
    })
  }

  // Add some participation badges
  badges.push({
    id: `participation-first-${userId}`,
    name: "First Steps",
    description: "Completed your first quiz",
    icon: "award",
    color: "bg-purple-500",
    earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    category: "participation",
  })

  // Add challenge badges for top users
  if (score > 900) {
    badges.push({
      id: `challenge-expert-${userId}`,
      name: "Expert Challenge",
      description: "Completed the expert-level challenge with flying colors",
      icon: "zap",
      color: "bg-yellow-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      category: "challenge",
      level: "gold",
    })
  }

  // Add achievement badges
  if (score > 300) {
    badges.push({
      id: `achievement-dedicated-${userId}`,
      name: "Dedicated Learner",
      description: "Demonstrated dedication to medical education",
      icon: "book",
      color: "bg-cyan-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      category: "achievement",
    })
  }

  if (score > 700) {
    badges.push({
      id: `achievement-brilliant-${userId}`,
      name: "Brilliant Mind",
      description: "Demonstrated exceptional knowledge and understanding",
      icon: "brain",
      color: "bg-indigo-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      category: "achievement",
      level: "silver",
    })
  }

  // Randomize a bit to make it more realistic
  // Not all users with the same score will have exactly the same badges
  const randomFactor = Math.floor(Math.random() * 10)
  if (randomFactor > 7 && score > 200) {
    badges.push({
      id: `achievement-quick-${userId}`,
      name: "Quick Thinker",
      description: "Completed quizzes with exceptional speed",
      icon: "clock",
      color: "bg-pink-500",
      earnedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 9).toISOString(),
      category: "achievement",
    })
  }

  return badges
}

// Helper function to get badge category display name
export function getBadgeCategoryName(category: BadgeCategory): string {
  switch (category) {
    case "achievement":
      return "Achievement"
    case "streak":
      return "Streak"
    case "score":
      return "Score"
    case "specialty":
      return "Specialty"
    case "challenge":
      return "Challenge"
    case "participation":
      return "Participation"
    default:
      return category
  }
}

