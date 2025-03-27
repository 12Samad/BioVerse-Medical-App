// Determine if a mock exam should be placed on this day
export const shouldPlaceMockExam = (weekNumber: number, dayOfWeek: string, daysInWeek: string[]): boolean => {
    // Place on weekends if they are part of the study plan
    if ((dayOfWeek === "Saturday" || dayOfWeek === "Sunday") && daysInWeek.includes(dayOfWeek)) {
      return true
    }
  
    // Place after 4+ days of study in a week
    const dayIndex = daysInWeek.indexOf(dayOfWeek)
    if (dayIndex >= 3 && dayIndex === daysInWeek.length - 1) {
      return true
    }
  
    // For weeks that are multiples of 3, add an exam on the last day
    if (weekNumber % 3 === 0 && dayIndex === daysInWeek.length - 1) {
      return true
    }
  
    return false
  }
  
  // Get a unique exam number based on week and day
  export const getExamNumber = (weekNumber: number): number => {
    return weekNumber
  }
  
  