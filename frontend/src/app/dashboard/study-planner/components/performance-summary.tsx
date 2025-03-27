"use client"

import { BarChart3, CheckCircle, HelpCircle, XCircle } from 'lucide-react'
// import { PerformanceData } from '../types/performance-types'

import { PerformanceData } from '../types/performance-types'

interface PerformanceSummaryProps {
  performanceData: PerformanceData
}

export const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({ performanceData }) => {
  // Calculate statistics
  const tasks = Object.values(performanceData.tasks) as Array<{ status: string; subject: string }>
  const totalTasks = tasks.length
  
  if (totalTasks === 0) {
    return null
  }
  
  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const notUnderstoodTasks = tasks.filter(task => task.status === 'not-understood').length
  const skippedTasks = tasks.filter(task => task.status === 'skipped').length
  const incompleteTasks = tasks.filter(task => task.status === 'incomplete').length
  
  const completionRate = Math.round((completedTasks / totalTasks) * 100)
  
  // Group by subject for subject performance
  const subjectPerformance: Record<string, { total: number, completed: number, notUnderstood: number, skipped: number }> = {}
  
  tasks.forEach(task => {
    if (!subjectPerformance[task.subject]) {
      subjectPerformance[task.subject] = { total: 0, completed: 0, notUnderstood: 0, skipped: 0 }
    }
    
    subjectPerformance[task.subject].total++
    
    if (task.status === 'completed') {
      subjectPerformance[task.subject].completed++
    } else if (task.status === 'not-understood') {
      subjectPerformance[task.subject].notUnderstood++
    } else if (task.status === 'skipped') {
      subjectPerformance[task.subject].skipped++
    }
  })
  
  // Sort subjects by completion rate (ascending)
  const sortedSubjects = Object.entries(subjectPerformance)
    .sort(([, a], [, b]) => (a.completed / a.total) - (b.completed / b.total))
    .slice(0, 3) // Show only top 3 subjects that need attention
  
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="text-blue-500 mr-2" size={20} />
        <h3 className="font-semibold text-gray-800">Performance Summary</h3>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-700">{completionRate}%</div>
          <div className="text-sm text-blue-600">Completion</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
        
        <div className="bg-amber-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-amber-700">{notUnderstoodTasks}</div>
          <div className="text-sm text-amber-600">Not Understood</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700">{skippedTasks + incompleteTasks}</div>
          <div className="text-sm text-red-600">Skipped/Incomplete</div>
        </div>
      </div>
      
      {sortedSubjects.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Subjects Needing Attention</h4>
          <div className="space-y-3">
            {sortedSubjects.map(([subject, data]) => {
              const subjectCompletionRate = Math.round((data.completed / data.total) * 100)
              return (
                <div key={subject} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">{subject}</span>
                    <span className="text-sm text-gray-600">{subjectCompletionRate}% complete</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${subjectCompletionRate}%` }}
                    ></div>
                  </div>
                  <div className="flex mt-2 text-xs text-gray-500 space-x-3">
                    <span className="flex items-center">
                      <CheckCircle size={12} className="text-green-500 mr-1" /> {data.completed}
                    </span>
                    <span className="flex items-center">
                      <HelpCircle size={12} className="text-amber-500 mr-1" /> {data.notUnderstood}
                    </span>
                    <span className="flex items-center">
                      <XCircle size={12} className="text-red-500 mr-1" /> {data.skipped}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
