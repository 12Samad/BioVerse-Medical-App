"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, Clock } from 'lucide-react'

interface ReviewScheduleBadgeProps {
  nextReviewDate: Date | null
  reviewStage: number
}

export default function ReviewScheduleBadge({ nextReviewDate, reviewStage }: ReviewScheduleBadgeProps) {
  if (!nextReviewDate) return null

  const now = new Date()
  const isOverdue = nextReviewDate < now
  const isToday = nextReviewDate.toDateString() === now.toDateString()
  const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === nextReviewDate.toDateString()
  
  const formatDate = (date: Date) => {
    if (isToday) return "Today"
    if (isTomorrow) return "Tomorrow"
    
    // Format as "Jan 15" or "Jan 15, 2024" if not current year
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    }
    
    if (date.getFullYear() !== new Date().getFullYear()) {
      options.year = 'numeric'
    }
    
    return date.toLocaleDateString('en-US', options)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`
              flex items-center gap-1 
              ${isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 
                isToday ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                'bg-blue-50 text-blue-600 border-blue-200'}
            `}
          >
            {isOverdue ? (
              <Clock className="h-3 w-3" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span>
              {isOverdue ? 'Overdue' : `Review: ${formatDate(nextReviewDate)}`}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isOverdue 
              ? `Overdue for review (Stage ${reviewStage})` 
              : `Scheduled for review on ${nextReviewDate.toLocaleDateString()} (Stage ${reviewStage})`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
