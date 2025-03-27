"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Star, XCircle } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReviewControlsProps {
  onMarkKnown: () => Promise<void>
  onMarkUnknown: () => Promise<void>
  onMarkForLater: (priority: "low" | "medium" | "high") => Promise<void>
  onMarkMastered: () => Promise<void>
  isProcessing: boolean
}

export default function ReviewControls({
  onMarkKnown,
  onMarkUnknown,
  onMarkForLater,
  onMarkMastered,
  isProcessing,
}: ReviewControlsProps) {
  const [showPriorityOptions, setShowPriorityOptions] = useState(false)

  return (
    <div className="w-full space-y-3">
      {showPriorityOptions ? (
        <div className="grid grid-cols-3 gap-2 w-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => {
                    onMarkForLater("low")
                    setShowPriorityOptions(false)
                  }}
                  className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Low
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Review in 3 days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => {
                    onMarkForLater("medium")
                    setShowPriorityOptions(false)
                  }}
                  className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Medium
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Review tomorrow</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => {
                    onMarkForLater("high")
                    setShowPriorityOptions(false)
                  }}
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  High
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Review today</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            className="col-span-3 text-slate-500"
            onClick={() => setShowPriorityOptions(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => setShowPriorityOptions(true)}
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <Clock className="h-5 w-5 mr-2" />
              Review Later
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isProcessing}
                    onClick={onMarkUnknown}
                    className="border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Difficult
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Mark as difficult and review again soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={isProcessing}
              onClick={onMarkKnown}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Got It
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={isProcessing}
                    onClick={onMarkMastered}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    <Star className="h-5 w-5 mr-2" />
                    Mastered
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Mark as fully mastered (won&apos;t show in regular reviews)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  )
}

