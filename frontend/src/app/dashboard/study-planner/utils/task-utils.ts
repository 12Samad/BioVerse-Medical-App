// Utility function to generate a unique ID for a task
export const generateTaskId = (weekNumber: number, dayOfWeek: string, subject: string, activity: string): string => {
    return `${weekNumber}-${dayOfWeek}-${subject}-${activity.substring(0, 10)}`.replace(/\s+/g, "-").toLowerCase()
  }
  
  