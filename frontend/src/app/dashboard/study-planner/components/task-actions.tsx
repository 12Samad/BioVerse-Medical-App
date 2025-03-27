"use client"

import type React from "react"

import { CheckCircle, XCircle, HelpCircle } from "lucide-react"
import type { TaskActionProps } from "../types/performance-types"

export const TaskActions: React.FC<TaskActionProps> = ({
  taskId,
//   subject,
//   activity,
//   weekNumber,
//   dayOfWeek,
  onStatusChange,
  currentStatus,
}) => {
  return (
    <div className="flex items-center space-x-2 mt-2">
      <button
        onClick={() => onStatusChange(taskId, "completed")}
        className={`p-1.5 rounded-full transition-colors ${
          currentStatus === "completed"
            ? "bg-green-100 text-green-600"
            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
        }`}
        title="Mark as completed"
      >
        <CheckCircle size={16} />
      </button>

      <button
        onClick={() => onStatusChange(taskId, "not-understood")}
        className={`p-1.5 rounded-full transition-colors ${
          currentStatus === "not-understood"
            ? "bg-amber-100 text-amber-600"
            : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
        }`}
        title="Mark as not understood"
      >
        <HelpCircle size={16} />
      </button>

      <button
        onClick={() => onStatusChange(taskId, "skipped")}
        className={`p-1.5 rounded-full transition-colors ${
          currentStatus === "skipped" ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
        }`}
        title="Mark as skipped"
      >
        <XCircle size={16} />
      </button>
    </div>
  )
}

