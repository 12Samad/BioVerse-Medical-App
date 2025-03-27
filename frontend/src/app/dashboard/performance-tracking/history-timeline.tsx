"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { CheckCircle2, Info, XCircle } from "lucide-react"
import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

interface TestResult {
  userId: string
  questions: {
    questionId: string
    questionText: string
    userAnswer: string
    correctAnswer: string
    timeSpent: number
  }[]
  score: number
  totalTime: number
  percentage: number
  createdAt: string
}

interface HistoryTimelineProps {
  performanceData: TestResult[]
  isLoading?: boolean
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export default function HistoryTimeline({ performanceData, isLoading = false }: HistoryTimelineProps) {
  const [chartType, setChartType] = useState<"line" | "bar" | "area" | "composed">("composed")
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week">("all")

  // Process data for the chart
  const processChartData = () => {
    if (!performanceData || performanceData.length === 0) {
      return []
    }

    // Sort data by date
    const sortedData = [...performanceData].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    // Filter data based on selected time range
    const now = new Date()
    const filteredData = sortedData.filter((item) => {
      const itemDate = new Date(item.createdAt)
      if (timeRange === "week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return itemDate >= oneWeekAgo
      } else if (timeRange === "month") {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return itemDate >= oneMonthAgo
      }
      return true
    })

    // Transform data for the chart
    return filteredData.map((test, index) => {
      const correctAnswers = test.questions.filter((q) => q.userAnswer === q.correctAnswer).length
      const incorrectAnswers = test.questions.length - correctAnswers

      return {
        name: formatDate(test.createdAt),
        date: test.createdAt,
        testNumber: index + 1,
        score: test.percentage,
        correct: correctAnswers,
        incorrect: incorrectAnswers,
        total: test.questions.length,
      }
    })
  }

  const chartData = processChartData()

  // Calculate some statistics
  const totalCorrect = chartData.reduce((sum, item) => sum + item.correct, 0)
  const totalIncorrect = chartData.reduce((sum, item) => sum + item.incorrect, 0)
  const averageScore =
    chartData.length > 0 ? chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length : 0

  // Custom tooltip for the chart
  interface CustomTooltipProps {
    active?: boolean
    payload?: { payload: { testNumber: number; correct: number; incorrect: number; score: number } }[]
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-md shadow-md p-3 text-sm">
          <p className="font-medium">{`Test ${data.testNumber} (${label})`}</p>
          <p className="text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-3 w-3" /> Correct: {data.correct}
          </p>
          <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Incorrect: {data.incorrect}
          </p>
          <p className="font-medium mt-1">Score: {data.score}%</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>History Timeline</CardTitle>
          <CardDescription>Loading test history data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                History Timeline
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        This chart shows your test history over time, including correct and incorrect answers. Use the
                        brush at the bottom to zoom into specific time periods.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>Track your performance over time</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={timeRange} onValueChange={(value: "all" | "month" | "week") => setTimeRange(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar" | "area" | "composed")} className="w-[240px]">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="composed">Combined</TabsTrigger>
                  <TabsTrigger value="line">Line</TabsTrigger>
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                  <TabsTrigger value="area">Area</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No test history data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, "dataMax + 5"]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      name="Score (%)"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="correct"
                      name="Correct Answers"
                      stroke="#4ade80"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="incorrect"
                      name="Incorrect Answers"
                      stroke="#f87171"
                      strokeWidth={2}
                    />
                    <Brush dataKey="name" height={30} stroke="#8884d8" />
                  </LineChart>
                ) : chartType === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="correct" name="Correct Answers" stackId="a" fill="#4ade80" />
                    <Bar dataKey="incorrect" name="Incorrect Answers" stackId="a" fill="#f87171" />
                    <Brush dataKey="name" height={30} stroke="#8884d8" />
                  </BarChart>
                ) : chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Score (%)"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="correct"
                      name="Correct Answers"
                      stroke="#4ade80"
                      fill="#4ade80"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="incorrect"
                      name="Incorrect Answers"
                      stroke="#f87171"
                      fill="#f87171"
                      fillOpacity={0.3}
                    />
                    <Brush dataKey="name" height={30} stroke="#8884d8" />
                  </AreaChart>
                ) : (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, "dataMax + 5"]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="right" dataKey="correct" name="Correct Answers" fill="#4ade80" />
                    <Bar yAxisId="right" dataKey="incorrect" name="Incorrect Answers" fill="#f87171" />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      name="Score (%)"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                    <Brush dataKey="name" height={30} stroke="#8884d8" />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Correct</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalCorrect}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Incorrect</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{totalIncorrect}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-xl font-bold text-primary">{averageScore.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

