"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar, Clock } from "lucide-react"
// Remove the date-fns import
// import { formatDistanceToNow } from "date-fns"

// Add a simple date formatting function
const formatDate = (date: Date): string => {
  const now = new Date()
  const diffTime = Math.abs(date.getTime() - now.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return date > now ? "Tomorrow" : "Yesterday"
  } else if (diffDays < 7) {
    return date > now ? `In ${diffDays} days` : `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

interface FlashcardReviewStatusProps {
  nextReviewDate: Date | null
  lastReviewedDate: Date | null
  reviewStage: number
}

export default function FlashcardReviewStatus({
  nextReviewDate,
  lastReviewedDate,
  reviewStage,
}: FlashcardReviewStatusProps) {
  // If no next review date is set, return nothing
  if (!nextReviewDate) return null

  const now = new Date()
  const isReviewDue = nextReviewDate <= now

  // Then replace the formatDistanceToNow calls with formatDate
  // const formattedNextReview = formatDistanceToNow(nextReviewDate, { addSuffix: true })
  const formattedNextReview = formatDate(nextReviewDate)

  // const formattedLastReviewed = lastReviewedDate
  //   ? formatDistanceToNow(lastReviewedDate, { addSuffix: true })
  //   : "Never"
  const formattedLastReviewed = lastReviewedDate ? formatDate(lastReviewedDate) : "Never"

  // Get the stage name based on the review stage
  const getStageName = (stage: number) => {
    switch (stage) {
      case 0:
        return "New"
      case 1:
        return "First Review"
      case 2:
        return "Second Review"
      case 3:
        return "Third Review"
      case 4:
        return "Final Review"
      case 5:
        return "Mastered"
      default:
        return "Unknown"
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge
              variant={isReviewDue ? "destructive" : "outline"}
              className={`flex items-center gap-1 ${isReviewDue ? "animate-pulse" : ""}`}
            >
              <Clock className="h-3 w-3" />
              <span>{isReviewDue ? "Review Due" : formattedNextReview}</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{getStageName(reviewStage)}</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p>
              <strong>Last reviewed:</strong> {formattedLastReviewed}
            </p>
            <p>
              <strong>Next review:</strong> {formattedNextReview}
            </p>
            <p>
              <strong>Review stage:</strong> {getStageName(reviewStage)} ({reviewStage}/5)
            </p>
            <p className="text-muted-foreground pt-1 text-[10px]">Based on Ebbinghaus forgetting curve</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

