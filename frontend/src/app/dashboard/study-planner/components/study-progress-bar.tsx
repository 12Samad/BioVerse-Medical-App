"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { BarChart3, CheckCircle, Clock, Award } from "lucide-react"

interface StudyProgressBarProps {
  weeklyPlans: any[]
  userData: any
}

export const StudyProgressBar: React.FC<StudyProgressBarProps> = ({ weeklyPlans, userData }) => {
  const [progress, setProgress] = useState<number>(0)
  const [completedTasks, setCompletedTasks] = useState<number>(0)
  const [totalTasks, setTotalTasks] = useState<number>(0)
  const [daysCompleted, setDaysCompleted] = useState<number>(0)
  const [totalDays, setTotalDays] = useState<number>(0)

  useEffect(() => {
    calculateProgress()
  }, [])

  const calculateProgress = () => {
    // Get performance data from localStorage
    const storedData = localStorage.getItem("studyPlanPerformance")
    const performanceData = storedData ? JSON.parse(storedData) : { tasks: {}, lastUpdated: Date.now() }

    // Calculate total tasks and completed tasks
    let completed = 0
    let total = 0
    let completedDays = 0
    let totalDaysCount = 0

    // Track days that have at least one task
    const daysWithTasks = new Set<string>()
    const completedDaysSet = new Set<string>()

    // Count tasks from performance data
    if (performanceData && performanceData.tasks) {
      Object.values(performanceData.tasks).forEach((task: any) => {
        total++
        if (task.status === "completed") {
          completed++
        }

        // Track unique days
        const dayKey = `${task.weekNumber}-${task.dayOfWeek}`
        daysWithTasks.add(dayKey)

        // Check if all tasks for this day are completed
        const dayTasks = Object.values(performanceData.tasks).filter(
          (t: any) => t.weekNumber === task.weekNumber && t.dayOfWeek === task.dayOfWeek,
        )

        const allDayTasksCompleted = dayTasks.every((t: any) => t.status === "completed")
        if (allDayTasksCompleted) {
          completedDaysSet.add(dayKey)
        }
      })
    }

    // If no tasks in localStorage yet, count from the study plan
    if (total === 0 && weeklyPlans) {
      weeklyPlans.forEach((week) => {
        if (week.days) {
          week.days.forEach((day: any) => {
            if (day.tasks) {
              total += day.tasks.length

              // Track unique days
              const dayKey = `${week.weekNumber}-${day.dayOfWeek}`
              daysWithTasks.add(dayKey)
            }
          })
        }
      })
    }

    // Calculate days completed
    completedDays = completedDaysSet.size
    totalDaysCount = daysWithTasks.size

    // Calculate progress percentage
    let progressPercentage = 0
    if (total > 0) {
      progressPercentage = Math.round((completed / total) * 100)
    }

    setProgress(progressPercentage)
    setCompletedTasks(completed)
    setTotalTasks(total)
    setDaysCompleted(completedDays)
    setTotalDays(totalDaysCount)
  }

  // Get color based on progress
  const getProgressColor = () => {
    if (progress < 30) return "bg-red-500"
    if (progress < 70) return "bg-amber-500"
    return "bg-green-500"
  }

  // Calculate estimated completion date
  const getEstimatedCompletionDate = () => {
    if (totalDays === 0 || daysCompleted === 0) return "Not available"

    const today = new Date()
    const daysLeft = totalDays - daysCompleted

    // Calculate days per week the user studies
    const daysPerWeek = userData.daysPerWeek || 5

    // Calculate weeks needed to complete remaining days
    const weeksNeeded = daysLeft / daysPerWeek

    // Add that many weeks to today
    const completionDate = new Date(today)
    completionDate.setDate(today.getDate() + weeksNeeded * 7)

    return completionDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center mb-4">
        <BarChart3 className="text-blue-500 mr-2" size={20} />
        <h3 className="font-semibold text-gray-800">Study Plan Progress</h3>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm font-medium text-blue-600">{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-3 ${getProgressColor()} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Tasks Completed</div>
              <div className="font-medium text-blue-700">
                {completedTasks} of {totalTasks}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Clock className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Days Completed</div>
              <div className="font-medium text-blue-700">
                {daysCompleted} of {totalDays}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Award className="text-blue-500 mr-2" size={18} />
            <div>
              <div className="text-sm text-gray-600">Est. Completion</div>
              <div className="font-medium text-blue-700">{getEstimatedCompletionDate()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 italic">
        Progress is calculated based on completed tasks and study days.
      </div>
    </div>
  )
}

