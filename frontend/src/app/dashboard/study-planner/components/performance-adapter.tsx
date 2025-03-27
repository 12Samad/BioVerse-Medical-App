"use client"

import { useEffect, useState } from 'react'
// import { AlertCircle, CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import { PerformanceAdapterProps, PerformanceData, TaskPerformance } from '../types/performance-types'

// import { PerformanceAdapterProps } from '../types/performance-types'

// Generate a unique ID for a task
const generateTaskId = (weekNumber: number, dayOfWeek: string, subject: string, activity: string): string => {
  return `${weekNumber}-${dayOfWeek}-${subject}-${activity.substring(0, 10)}`.replace(/\s+/g, '-').toLowerCase()
}

export const PerformanceAdapter: React.FC<PerformanceAdapterProps> = ({ 
  studyPlan, 
  userData, 
  onPlanUpdate 
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    tasks: {},
    lastUpdated: Date.now()
  })
  const [needsReplanning, setNeedsReplanning] = useState<boolean>(false)

  // Load performance data from localStorage on component mount
  useEffect(() => {
    const storedData = localStorage.getItem('studyPlanPerformance')
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        setPerformanceData(parsedData)
        
        // Check if there are any incomplete or not-understood tasks
        const hasIssues = Object.values(parsedData.tasks).some(
          (task: TaskPerformance) => ['incomplete', 'not-understood', 'skipped'].includes(task.status)
        )
        setNeedsReplanning(hasIssues)
      } catch (error) {
        console.error('Error parsing performance data:', error)
      }
    }
  }, [])

  // Save performance data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('studyPlanPerformance', JSON.stringify(performanceData))
  }, [performanceData])

  // Handle task status changes
  const handleTaskStatusChange = (taskId: string, status: TaskPerformance['status']) => {
    setPerformanceData(prev => {
      const task = prev.tasks[taskId]
      const updatedTasks = {
        ...prev.tasks,
        [taskId]: {
          ...task,
          status,
          timestamp: Date.now()
        }
      }
      
      return {
        ...prev,
        tasks: updatedTasks,
        lastUpdated: Date.now()
      }
    })
    
    // If a task is marked as not-understood or incomplete, we need to replan
    if (status === 'not-understood' || status === 'incomplete' || status === 'skipped') {
      setNeedsReplanning(true)
    }
  }

  // Initialize task tracking for a new week
  const initializeWeekTracking = (weekNumber: number) => {
    if (!studyPlan?.plan?.weeklyPlans) return
    
    const week = studyPlan.plan.weeklyPlans.find((w: any) => w.weekNumber === weekNumber)
    if (!week || !week.days) return
    
    const newTasks: Record<string, TaskPerformance> = {}
    
    week.days.forEach((day: any) => {
      day.tasks.forEach((task: any) => {
        const taskId = generateTaskId(weekNumber, day.dayOfWeek, task.subject, task.activity)
        
        // Only initialize if the task doesn't already exist in performance data
        if (!performanceData.tasks[taskId]) {
          newTasks[taskId] = {
            taskId,
            subject: task.subject,
            activity: task.activity,
            weekNumber,
            dayOfWeek: day.dayOfWeek,
            status: 'incomplete',
            timestamp: Date.now()
          }
        }
      })
    })
    
    if (Object.keys(newTasks).length > 0) {
      setPerformanceData(prev => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          ...newTasks
        },
        lastUpdated: Date.now()
      }))
    }
  }

  // Get the current status of a task
  const getTaskStatus = (weekNumber: number, dayOfWeek: string, subject: string, activity: string): TaskPerformance['status'] => {
    const taskId = generateTaskId(weekNumber, dayOfWeek, subject, activity)
    return performanceData.tasks[taskId]?.status || 'incomplete'
  }

  // Apply intelligent replanning to redistribute tasks
  const applyReplanning = () => {
    if (!studyPlan?.plan?.weeklyPlans || studyPlan.plan.weeklyPlans.length === 0) return
    
    // Create a deep copy of the study plan to modify
    const updatedPlan = JSON.parse(JSON.stringify(studyPlan))
    
    // Collect all tasks that need to be redistributed
    const tasksToRedistribute: TaskPerformance[] = Object.values(performanceData.tasks)
      .filter((task: TaskPerformance) => 
        task.status === 'not-understood' || task.status === 'incomplete' || task.status === 'skipped'
      )
      .sort((a, b) => a.weekNumber - b.weekNumber) // Sort by week number to prioritize earlier content
    
    if (tasksToRedistribute.length === 0) {
      setNeedsReplanning(false)
      return
    }
    
    // Find the current week (assuming the user is on the earliest incomplete week)
    const currentWeekNumber = Math.min(
      ...Object.values(performanceData.tasks)
        .filter(task => task.status !== 'completed')
        .map(task => task.weekNumber)
    )
    
    // Get all future weeks
    const futureWeeks = updatedPlan.plan.weeklyPlans
      .filter((week: any) => week.weekNumber > currentWeekNumber)
      .sort((a: any, b: any) => a.weekNumber - b.weekNumber)
    
    if (futureWeeks.length === 0) {
      // If no future weeks, add a new week
      const lastWeek = updatedPlan.plan.weeklyPlans[updatedPlan.plan.weeklyPlans.length - 1]
      const newWeek = {
        weekNumber: lastWeek.weekNumber + 1,
        theme: "Review and Reinforcement",
        focusAreas: tasksToRedistribute.map(task => task.subject).filter((v, i, a) => a.indexOf(v) === i),
        weeklyGoals: tasksToRedistribute.map(task => ({
          subject: task.subject,
          description: `Review and master concepts from ${task.subject} that were challenging`
        })),
        days: []
      }
      
      // Create days for the new week
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      const daysNeeded = Math.min(userData.daysPerWeek || 5, 7)
      
      for (let i = 0; i < daysNeeded; i++) {
        newWeek.days.push({
          dayOfWeek: daysOfWeek[i],
          tasks: []
        })
      }
      
      updatedPlan.plan.weeklyPlans.push(newWeek)
      futureWeeks.push(newWeek)
    }
    
    // Redistribute tasks across future weeks
    tasksToRedistribute.forEach((task, index) => {
      // Determine which future week to add this task to
      const targetWeekIndex = index % futureWeeks.length
      const targetWeek = futureWeeks[targetWeekIndex]
      
      // Find the day with the fewest tasks
      const targetDay = targetWeek.days.reduce((minDay, currentDay) => 
        (currentDay.tasks.length < minDay.tasks.length) ? currentDay : minDay, 
        targetWeek.days[0]
      )
      
      // Create a new task for the target day
      const newTask = {
        subject: task.subject,
        duration: 30, // Default duration
        activity: `Review: ${task.activity}`,
        isReview: true // Mark as a review task
      }
      
      // Add the task to the target day
      targetDay.tasks.push(newTask)
      
      // Update the focus areas for the week if needed
      if (!targetWeek.focusAreas.includes(task.subject)) {
        targetWeek.focusAreas.push(task.subject)
      }
    })
    
    // Update the study plan
    onPlanUpdate(updatedPlan)
    
    // Reset the replanning flag
    setNeedsReplanning(false)
    
    // Update localStorage with the new plan
    localStorage.setItem('studyPlan', JSON.stringify(updatedPlan))
    
    // Reset the status of redistributed tasks to incomplete
    const updatedTasks = { ...performanceData.tasks }
    tasksToRedistribute.forEach(task => {
      updatedTasks[task.taskId] = {
        ...task,
        status: 'completed', // Mark original as completed since we've redistributed it
        timestamp: Date.now()
      }
    })
    
    setPerformanceData(prev => ({
      ...prev,
      tasks: updatedTasks,
      lastUpdated: Date.now()
    }))
  }

  return {
    initializeWeekTracking,
    handleTaskStatusChange,
    getTaskStatus,
    needsReplanning,
    applyReplanning
  }
}

// Export a hook version for easier use in components
export const usePerformanceAdapter = (studyPlan: any, userData: any, onPlanUpdate: (plan: any) => void) => {
  return PerformanceAdapter({ studyPlan, userData, onPlanUpdate })
}
