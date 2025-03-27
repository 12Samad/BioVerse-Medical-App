"use client"

import type React from "react"

import type { Badge as BadgeType } from "./types"
import {
  Award,
  BadgeCheck,
  Flame,
  Medal,
  Star,
  Trophy,
  Zap,
  BookOpen,
  Brain,
  Calendar,
  Clock,
  Crown,
  Target,
  Lightbulb,
  Sparkles,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface UserBadgesProps {
  badges: BadgeType[]
  className?: string
}

// Map badge icon names to Lucide React components
const iconMap: Record<string, React.ReactNode> = {
  award: <Award />,
  badge: <BadgeCheck />,
  flame: <Flame />,
  medal: <Medal />,
  star: <Star />,
  trophy: <Trophy />,
  zap: <Zap />,
  book: <BookOpen />,
  brain: <Brain />,
  calendar: <Calendar />,
  clock: <Clock />,
  crown: <Crown />,
  target: <Target />,
  lightbulb: <Lightbulb />,
  sparkles: <Sparkles />,
}

export default function UserBadges({ badges, className = "" }: UserBadgesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter badges by category if a category is selected
  const filteredBadges = selectedCategory ? badges.filter((badge) => badge.category === selectedCategory) : badges

  // Get unique categories from badges
  const categories = Array.from(new Set(badges.map((badge) => badge.category)))

  // Get badge level color
  const getLevelColor = (level?: string) => {
    switch (level) {
      case "bronze":
        return "bg-amber-600"
      case "silver":
        return "bg-gray-400"
      case "gold":
        return "bg-yellow-500"
      case "platinum":
        return "bg-cyan-300"
      default:
        return "bg-primary"
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Badges & Achievements</h3>
        <span className="text-xs text-muted-foreground">{badges.length} earned</span>
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          ))}
        </div>
      )}

      {/* Badges grid */}
      {filteredBadges.length > 0 ? (
        <ScrollArea className="h-[120px]">
          <div className="grid grid-cols-4 gap-2">
            {filteredBadges.map((badge) => (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex flex-col items-center justify-center p-2 rounded-lg ${badge.color} bg-opacity-10 hover:bg-opacity-20 transition-colors cursor-help`}
                    >
                      <div className={`p-1.5 rounded-full ${getLevelColor(badge.level)} text-white`}>
                        <div className="w-5 h-5">{iconMap[badge.icon] || <Award className="w-5 h-5" />}</div>
                      </div>
                      <span className="text-xs mt-1 text-center truncate w-full">{badge.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-medium">{badge.name}</p>
                      <p className="text-xs">{badge.description}</p>
                      {badge.level && <p className="text-xs font-medium capitalize">{badge.level} Level</p>}
                      <p className="text-xs text-muted-foreground">
                        Earned on {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex items-center justify-center h-[120px] bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">No badges earned yet</p>
        </div>
      )}
    </div>
  )
}

