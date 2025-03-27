"use client"

import { Card } from "@/components/ui/card"
import { Info, TrendingUp, Users, Award, Target } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProgressInsightsProps {
  userId: string | null
  score: number
  specialty?: string
  targetExam?: string
  className?: string
}

export default function ProgressInsights({ userId, score, specialty, targetExam, className = "" }: ProgressInsightsProps) {
  // Mock insights data - in a real app, this would come from the backend
  const generateInsights = () => {
    if (!userId) return null
    
    // Generate percentile based on score (mock calculation)
    const percentile = Math.min(Math.floor((score / 1000) * 100) + Math.floor(Math.random() * 15), 99)
    
    // Generate improvement rate (mock data)
    const improvementRate = Math.floor(Math.random() * 30) + 5
    
    // Generate streak consistency (mock data)
    const streakConsistency = Math.floor(Math.random() * 40) + 60
    
    return {
      percentile,
      improvementRate,
      streakConsistency,
      specialty,
      targetExam
    }
  }
  
  const insights = generateInsights()
  
  if (!insights) {
    return null
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-primary" />
          Personal Insights
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="rounded-full p-1 hover:bg-muted cursor-help">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs max-w-[200px]">
                Insights are based on your performance compared to other users with similar goals and specialties.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Card className="p-3 bg-muted/30">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm">
                You&apos;re ahead of <span className="font-medium">{insights.percentile}%</span> of users
                {insights.specialty ? ` in ${insights.specialty}` : ''}
                {insights.targetExam ? ` preparing for ${insights.targetExam}` : ''}.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm">
                Your score has improved by <span className="font-medium text-green-500">{insights.improvementRate}%</span> in the last 30 days.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Award className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm">
                Your study consistency is <span className="font-medium">{insights.streakConsistency}%</span>, better than average.
              </p>
            </div>
          </div>
          
          {insights.targetExam && (
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm">
                  Based on your progress, you&apos;re on track for your <span className="font-medium">{insights.targetExam}</span> preparation.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
