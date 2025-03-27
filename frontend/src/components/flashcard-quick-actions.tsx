"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BookmarkIcon, CheckCircle2, Clock, Calendar, XCircle, Zap } from 'lucide-react'
import { useState } from "react"

export interface QuickActionProps {
  onMarkAsKnown: () => void
  onMarkForReview: () => void
  onReviewLater: () => void
  onReviewTomorrow: () => void
  isSubmitting?: boolean
}

export default function FlashcardQuickActions({
  onMarkAsKnown,
  onMarkForReview,
  onReviewLater,
  onReviewTomorrow,
  isSubmitting = false
}: QuickActionProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {expanded ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReviewLater}
                  disabled={isSubmitting}
                  className="border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                  <BookmarkIcon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Review Later</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark for review at the end of today</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReviewTomorrow}
                  disabled={isSubmitting}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Tomorrow</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Schedule for review tomorrow</p>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(false)}
              className="h-8 w-8 text-slate-400"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(true)}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Clock className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Schedule</span>
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkForReview}
              disabled={isSubmitting}
              className="border-red-200 text-red-500 hover:bg-red-50"
            >
              <Zap className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Need Review</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mark as needing more review</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={onMarkAsKnown}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Got It</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mark as known and schedule next review</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
