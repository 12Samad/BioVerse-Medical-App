// Types for tracking performance and completion status
export interface TaskPerformance {
    taskId: string
    subject: string
    activity: string
    weekNumber: number
    dayOfWeek: string
    status: "completed" | "incomplete" | "not-understood" | "skipped"
    timestamp: number
  }
  
  export interface PerformanceData {
    userId?: string
    tasks: Record<string, TaskPerformance>
    lastUpdated: number
  }
  
  // Types for the performance adapter component
  export interface PerformanceAdapterProps {
    studyPlan: any // Using any here to match the existing code structure
    userData: any
    onPlanUpdate: (updatedPlan: any) => void
  }
  
  // Types for the task action buttons
  export interface TaskActionProps {
    taskId: string
    subject: string
    activity: string
    weekNumber: number
    dayOfWeek: string
    onStatusChange: (taskId: string, status: TaskPerformance["status"]) => void
    currentStatus: TaskPerformance["status"]
  }
  
  