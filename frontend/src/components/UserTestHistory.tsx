"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, Clock, BarChart3, Brain, AlertCircle, BookOpen, RefreshCw } from "lucide-react"
import axios from "axios"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

type TestResult = {
  _id: string
  userId: string
  score: number
  totalTime: number
  percentage: number
  date: string
  isAIGenerated?: boolean
  aiTopic?: string
  isRecommendedTest?: boolean
  questions: {
    questionId: string
    questionText: string
    correctAnswer: string
    userAnswer: string
    timeSpent: number
    subject?: string
    subsection?: string
  }[]
}

interface UserTestHistoryProps {
  limit?: number  // Optional prop to limit the number of tests shown
}

const UserTestHistory: React.FC<UserTestHistoryProps> = ({ limit = 5 }) => {
  const [testHistory, setTestHistory] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  
  // Calculate if we should limit the displayed tests
  const displayedTests = limit > 0 ? testHistory.slice(0, limit) : testHistory

  // Function to fetch test history
  const fetchTestHistory = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    
    setError(null)
    
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      
      if (!userId) {
        setError("User ID not found. Please log in again.")
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      
      // Use the new sorted endpoint we created
      const response = await axios.get(
        `http://localhost:5000/api/test/user-tests-sorted/${userId}?t=${timestamp}`,
        { headers: { 'Cache-Control': 'no-cache' } }
      )
      
      if (response.data && Array.isArray(response.data)) {
        // No need to sort here since backend is already sorting
        setTestHistory(response.data)
        setLastRefreshed(new Date())
      } else {
        setTestHistory([])
      }
    } catch (err) {
      console.error("Error fetching test history:", err)
      setError("Failed to load test history. Please try again later.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  // Fetch on initial mount
  useEffect(() => {
    fetchTestHistory()
  }, [])
  
  // Handle manual refresh
  const handleRefresh = () => {
    fetchTestHistory(false)
  }
  
  // Function to get color based on score percentage
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-red-600"
  }
  
  // Function to render loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={`skeleton-${index}`} className="mb-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    ))
  }
  
  // Function to get test type badge
  const getTestTypeBadge = (test: TestResult) => {
    if (test.isAIGenerated) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 flex items-center">
          <Brain size={14} className="mr-1" />
          AI Generated
        </Badge>
      )
    }
    
    if (test.isRecommendedTest) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 flex items-center">
          <CheckCircle size={14} className="mr-1" />
          Recommended
        </Badge>
      )
    }
    
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200 flex items-center">
        <BookOpen size={14} className="mr-1" />
        Standard
      </Badge>
    )
  }
  
  // Function to get test topics string
  const getTopicsString = (test: TestResult) => {
    if (test.isAIGenerated && test.aiTopic) {
      return test.aiTopic
    }
    
    // Get unique topics from questions
    const topics = new Set<string>()
    if (test.questions && Array.isArray(test.questions)) {
      test.questions.forEach(q => {
        if (q.subsection) topics.add(q.subsection)
        else if (q.subject) topics.add(q.subject)
      })
    }
    
    return Array.from(topics).slice(0, 3).join(", ") + 
      (topics.size > 3 ? ` and ${topics.size - 3} more` : "")
  }
  
  // Helper function to format date without parseISO
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString; // Return original string if parsing fails
    }
  }

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-xl">
            <BarChart3 className="mr-2" size={20} />
            Recent Tests
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Your recent test performance
          {!isLoading && !isRefreshing && (
            <span className="text-xs text-gray-400 block mt-1">
              Last updated: {format(lastRefreshed, "h:mm a")}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          renderSkeletons()
        ) : error ? (
          <div className="text-center py-6 text-red-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : testHistory.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <BookOpen className="mx-auto h-8 w-8 mb-2" />
            <p>No test history found. Complete a test to see your results here.</p>
          </div>
        ) : (
          <div className={`space-y-4 ${isRefreshing ? 'opacity-60' : ''}`}>
            {displayedTests.map((test) => (
              <Card key={test._id || Math.random().toString()} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {formatDate(test.date)}
                      </span>
                    </div>
                    {getTestTypeBadge(test)}
                  </div>
                  <CardTitle className="text-base">
                    {test.isAIGenerated ? `${test.aiTopic} Test` : 
                     test.isRecommendedTest ? "Recommended Test" : 
                     "Standard Test"}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className={`text-xl font-bold ${getScoreColor(test.percentage)}`}>
                        {test.percentage.toFixed(1)}%
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({test.score}/{test.questions?.length || 0})
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {Math.floor(test.totalTime / 60)}m {test.totalTime % 60}s
                    </div>
                  </div>
                  
                  <Progress 
                    value={test.percentage} 
                    className="h-2 mb-3" 
                  />
                  
                  <div className="text-xs text-gray-600 truncate">
                    Topics: {getTopicsString(test)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UserTestHistory