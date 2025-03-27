"use client"

import { AlertTriangle, ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"

interface PriorityIndicatorProps {
  subjectName: string
  weight?: number
  performance?: number
}

const PriorityIndicator = ({ subjectName, weight, performance }: PriorityIndicatorProps) => {
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "normal">("normal")
  const [tooltip, setTooltip] = useState("")
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    // Calculate priority based on weight and performance
    if (weight !== undefined) {
      if (weight >= 25) {
        setPriority("high")
        setTooltip(`High priority topic (${weight}% of exam)`)
      } else if (weight >= 15) {
        setPriority("medium")
        setTooltip(`Medium priority topic (${weight}% of exam)`)
      } else if (performance !== undefined && performance < 60) {
        setPriority("medium")
        setTooltip(`Low performance area (${performance}%)`)
      } else {
        setPriority("normal")
        setTooltip("")
      }
    } else {
      setPriority("normal")
      setTooltip("")
    }
  }, [weight, performance, subjectName])

  if (priority === "normal") return null

  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      {priority === "high" ? (
        <ArrowUp size={16} className="text-red-500" />
      ) : priority === "medium" ? (
        <AlertTriangle size={16} className="text-yellow-500" />
      ) : null}

      {showTooltip && tooltip && (
        <div className="absolute z-10 -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  )
}

export default PriorityIndicator

