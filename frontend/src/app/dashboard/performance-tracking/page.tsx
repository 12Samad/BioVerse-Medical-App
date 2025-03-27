"use client"

import type React from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TooltipProvider } from "@/components/ui/tooltip"
import axios from "axios"
import { motion } from "framer-motion"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Facebook,
  Info,
  Mail,
  MoreHorizontal,
  Share2,
  Target,
  TrendingUp,
  Twitter,
  XCircle,
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast, Toaster } from "react-hot-toast"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import HistoryTimeline from "./history-timeline"
import NextTaskCTA from "./next-task-cta"
import StreakTracker from "./streak-tracker"
import FlashcardSuggestions from "./flashcard-suggestions"
import ExamAlignment from "./exam-alignment"

// Types
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

interface StatsData {
  totalTestsTaken: number
  totalQuestionsAttempted: number
  totalQuestionsCorrect: number
  totalQuestionsWrong: number
  avgTimePerTest: number
  totalStudyHours: number
  subjectEfficiency: { subject: string; subsection: string; accuracy: number }[]
}

interface ComparativeAnalytics {
  userPerformance: {
    subjectPerformance: {
      name: string
      correct: number
      total: number
      percentage: number
    }[]
    subsectionPerformance: {
      name: string
      subject: string
      correct: number
      total: number
      percentage: number
    }[]
    topicPerformance: {
      name: string
      correct: number
      total: number
      percentage: number
    }[]
    overallPercentile: number
    averageTimePerQuestion: number
    totalTestsTaken: number
  }
  globalPerformance: {
    average: {
      score: number
      percentage: number
      totalTests: number
    }
  }
  improvement: {
    percentage: number
    scoreChange: number
    timeEfficiency: number
  } | null
}

interface TopicMasteryMetrics {
  topics: {
    name: string
    attempts: number
    correct: number
    incorrect: number
    averageTime: number
    totalTime: number
    masteryLevel: string
    masteryScore: number
    lastAttemptDate: string | null
    isQuestPriority?: boolean
  }[]
  systems: {
    name: string
    attempts: number
    correct: number
    incorrect: number
    masteryLevel: string
    masteryScore: number
  }[]
  subtopics: {
    name: string
    parentTopic: string
    attempts: number
    correct: number
    incorrect: number
    masteryLevel: string
    masteryScore: number
  }[]
  weakestTopics: {
    name: string
    masteryScore: number
    masteryLevel: string
    isQuestPriority?: boolean
  }[]
  strongestTopics: {
    name: string
    masteryScore: number
    masteryLevel: string
  }[]
  recommendations: {
    topic: string
    masteryLevel: string
    masteryScore: number
    isQuestPriority: boolean
    recommendation: string
  }[]
  overallMastery: {
    averageScore: number
    topicsStarted: number
    topicsAtExpert: number
    topicsNeedingWork: number
  }
}

// Helper functions
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getMasteryColor = (level: string): string => {
  switch (level) {
    case "Not Started":
      return "bg-gray-200 text-gray-700"
    case "Beginner":
      return "bg-red-100 text-red-700"
    case "Intermediate":
      return "bg-yellow-100 text-yellow-700"
    case "Advanced":
      return "bg-blue-100 text-blue-700"
    case "Expert":
      return "bg-green-100 text-green-700"
    default:
      return "bg-gray-200 text-gray-700"
  }
}

const getMasteryIcon = (level: string) => {
  switch (level) {
    case "Not Started":
      return <AlertTriangle className="h-4 w-4" />
    case "Beginner":
      return <XCircle className="h-4 w-4" />
    case "Intermediate":
      return <Info className="h-4 w-4" />
    case "Advanced":
      return <CheckCircle2 className="h-4 w-4" />
    case "Expert":
      return <Award className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

// Custom components
interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: number | string
  subtitle?: string
  color?: "blue" | "green" | "purple" | "amber" | "red" | "indigo"
}

const StatCard = ({ icon, title, value, subtitle, color = "blue" }: StatCardProps) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
    indigo: "from-indigo-500 to-indigo-600",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl shadow-lg"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-90`}></div>
      <div className="relative p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs mt-1 opacity-80">{subtitle}</p>}
          </div>
          <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
        </div>
      </div>
    </motion.div>
  )
}

interface MasteryBadgeProps {
  level: string
}

const MasteryBadge = ({ level }: MasteryBadgeProps) => {
  return (
    <Badge variant="outline" className={`${getMasteryColor(level)} flex items-center gap-1 px-2 py-1`}>
      {getMasteryIcon(level)}
      <span>{level}</span>
    </Badge>
  )
}

const LoadingCard = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-[200px] w-full" />
      </div>
    </CardContent>
  </Card>
)

const LoadingStatCard = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-16 mt-2" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </CardContent>
  </Card>
)

// Main component
export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [performanceData, setPerformanceData] = useState<TestResult[]>([])
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [comparativeData, setComparativeData] = useState<ComparativeAnalytics | null>(null)
  const [topicMasteryData, setTopicMasteryData] = useState<TopicMasteryMetrics | null>(null)
  const [loading, setLoading] = useState({
    performance: true,
    stats: true,
    comparative: true,
    topicMastery: true,
  })
  const [error, setError] = useState<{
    performance: string | null
    stats: string | null
    comparative: string | null
    topicMastery: string | null
  }>({
    performance: null,
    stats: null,
    comparative: null,
    topicMastery: null,
  })

  const [chartType, setChartType] = useState("bar")
  const [selectedSystem, setSelectedSystem] = useState("all")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareEmail, setShareEmail] = useState("")
  const [shareNote, setShareNote] = useState("")
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  const dashboardRef = useRef<HTMLDivElement>(null)

  // Add state for managing the view mode for tests and questions
  const [viewAllTests, setViewAllTests] = useState(false)
  const [viewAllQuestions, setViewAllQuestions] = useState(false)
  const [selectedTestIndex, setSelectedTestIndex] = useState<number | null>(null)
  const [targetExam] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("Medical_User_Id")

      if (!userId) {
        setLoading({
          performance: false,
          stats: false,
          comparative: false,
          topicMastery: false,
        })
        return
      }

      try {
        // Fetch performance data
        const performanceResponse = await axios.get<TestResult[]>(
          "https://medical-backend-loj4.onrender.com/api/test/performance",
          {
            params: { userId },
          },
        )
        setPerformanceData(performanceResponse.data)
        setLoading((prev) => ({ ...prev, performance: false }))

        // Fetch stats data
        const statsResponse = await axios.get<StatsData>(
          `https://medical-backend-loj4.onrender.com/api/test/user/${userId}/stats`,
        )
        setStatsData(statsResponse.data)
        setLoading((prev) => ({ ...prev, stats: false }))

        // Fetch comparative analytics
        try {
          const comparativeResponse = await axios.get<ComparativeAnalytics>(
            `https://medical-backend-loj4.onrender.com/api/test/comparative/${userId}`,
          )
          setComparativeData(comparativeResponse.data)
        } catch (err) {
          console.error("Error fetching comparative data:", err)
          setError((prev) => ({ ...prev, comparative: "Could not load comparative data" }))
        } finally {
          setLoading((prev) => ({ ...prev, comparative: false }))
        }

        // Fetch topic mastery data
        try {
          const topicMasteryResponse = await axios.get<TopicMasteryMetrics>(
            `https://medical-backend-loj4.onrender.com/api/test/topic-mastery/${userId}`,
          )
          setTopicMasteryData(topicMasteryResponse.data)
        } catch (err) {
          console.error("Error fetching topic mastery data:", err)
          setError((prev) => ({ ...prev, topicMastery: "Could not load topic mastery data" }))
        } finally {
          setLoading((prev) => ({ ...prev, topicMastery: false }))
        }
        setShareUrl("")
      } catch (err) {
        console.error("Error fetching data:", err)
        setError((prev) => ({
          ...prev,
          performance: "Could not load performance data",
          stats: "Could not load stats data",
        }))
        setLoading({
          performance: false,
          stats: false,
          comparative: false,
          topicMastery: false,
        })
      }
    }

    fetchData()
  }, [])

  const generatePDF = async () => {
    if (!dashboardRef.current) return

    setIsGeneratingPDF(true)
    const toastId = toast.loading("Please wait while we prepare your report...")

    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()

      // Add title
      pdf.setFontSize(20)
      pdf.setTextColor(44, 62, 80)
      pdf.text("Analytics Dashboard Report", pageWidth / 2, 20, { align: "center" })

      // Add date
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: "center" })

      // Add user info
      pdf.setFontSize(14)
      pdf.setTextColor(44, 62, 80)
      pdf.text("User Performance Summary", 20, 45)

      // Add stats
      pdf.setFontSize(12)
      pdf.setTextColor(80, 80, 80)
      pdf.text(`Total Tests Taken: ${statsData?.totalTestsTaken || 0}`, 20, 55)
      pdf.text(`Total Questions: ${statsData?.totalQuestionsAttempted || 0}`, 20, 62)
      pdf.text(`Correct Answers: ${statsData?.totalQuestionsCorrect || 0}`, 20, 69)
      pdf.text(`Total Study Hours: ${statsData?.totalStudyHours?.toFixed(1) || 0}`, 20, 76)

      // Add performance data
      if (performanceData.length > 0) {
        pdf.setFontSize(14)
        pdf.setTextColor(44, 62, 80)
        pdf.text("Recent Performance", 20, 90)

        pdf.setFontSize(12)
        pdf.setTextColor(80, 80, 80)

        let yPos = 100
        performanceData.slice(0, 5).forEach((test, index) => {
          pdf.text(`Test ${index + 1}: ${test.percentage}% (${test.score}/${test.questions.length})`, 20, yPos)
          pdf.text(`Date: ${formatDate(test.createdAt)}`, 120, yPos)
          yPos += 7
        })
      }

      // Add mastery data
      if (topicMasteryData) {
        pdf.setFontSize(14)
        pdf.setTextColor(44, 62, 80)
        pdf.text("Topic Mastery", 20, 140)

        pdf.setFontSize(12)
        pdf.setTextColor(80, 80, 80)

        let yPos = 150
        topicMasteryData.strongestTopics.slice(0, 3).forEach((topic, index) => {
          pdf.text(`Strongest Topic ${index + 1}: ${topic.name} (${topic.masteryScore}%)`, 20, yPos)
          yPos += 7
        })

        yPos += 5
        topicMasteryData.weakestTopics.slice(0, 3).forEach((topic, index) => {
          pdf.text(`Weakest Topic ${index + 1}: ${topic.name} (${topic.masteryScore}%)`, 20, yPos)
          yPos += 7
        })
      }

      // Add recommendations
      if (topicMasteryData?.recommendations) {
        pdf.addPage()

        pdf.setFontSize(16)
        pdf.setTextColor(44, 62, 80)
        pdf.text("Study Recommendations", pageWidth / 2, 20, { align: "center" })

        pdf.setFontSize(12)
        pdf.setTextColor(80, 80, 80)

        let yPos = 40
        topicMasteryData.recommendations.slice(0, 5).forEach((rec, index) => {
          pdf.text(`${index + 1}. ${rec.topic} (${rec.masteryLevel})`, 20, yPos)

          // Split recommendation text to fit page width
          const recText = rec.recommendation
          const textWidth = pageWidth - 40 // 20mm margins on each side
          const splitText = pdf.splitTextToSize(recText, textWidth)

          pdf.text(splitText, 25, yPos + 7)
          yPos += 20
        })
      }

      // Add charts
      try {
        // Capture charts as images
        if (dashboardRef.current) {
          const chartElements = dashboardRef.current.querySelectorAll(".recharts-wrapper")

          if (chartElements.length > 0) {
            pdf.addPage()
            pdf.setFontSize(16)
            pdf.setTextColor(44, 62, 80)
            pdf.text("Performance Charts", pageWidth / 2, 20, { align: "center" })

            let yPos = 40

            // Only process up to 2 charts to keep PDF size reasonable
            for (let i = 0; i < Math.min(chartElements.length, 2); i++) {
              const chart = chartElements[i]
              const canvas = await html2canvas(chart as HTMLElement)
              const imgData = canvas.toDataURL("image/png")

              // Calculate dimensions to fit on page
              const imgWidth = Math.min(pageWidth - 40, 160)
              const ratio = canvas.height / canvas.width
              const imgHeight = imgWidth * ratio

              if (yPos + imgHeight > 270) {
                // Check if we need a new page
                pdf.addPage()
                yPos = 20
              }

              pdf.addImage(imgData, "PNG", 20, yPos, imgWidth, imgHeight)
              yPos += imgHeight + 20
            }
          }
        }
      } catch (chartErr) {
        console.error("Error capturing charts:", chartErr)
      }

      // Add footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(10)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 285, { align: "center" })
        pdf.text("Medical Study Analytics Dashboard", 20, 285)
      }

      // Save the PDF
      pdf.save(`medical-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`)

      toast.success("Your analytics report has been downloaded.", { id: toastId })
    } catch (err) {
      console.error("Error generating PDF:", err)
      toast.error("There was a problem creating your report. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Function to handle sharing the report
  const handleShareReport = async (method: "email" | "copy" | "social") => {
    try {
      switch (method) {
        case "email":
          if (!shareEmail) {
            toast.error("Please enter an email address to share the report.")
            return
          }

          // In a real app, you would send this to your backend
          // For demo purposes, we'll just show a success message
          toast.success(`Report has been shared with ${shareEmail}`)
          setShareEmail("")
          setShareNote("")
          setIsShareDialogOpen(false)
          break

        case "copy":
          await navigator.clipboard.writeText(shareUrl)
          toast.success("Report link has been copied to clipboard")
          break

        case "social":
          // This would open a social sharing dialog in a real app
          window.open(
            `https://twitter.com/intent/tweet?text=Check out my medical study analytics report&url=${encodeURIComponent(shareUrl)}`,
            "_blank",
          )
          break
      }
    } catch (err) {
      console.error("Error sharing report:", err)
      toast.error("There was a problem sharing your report. Please try again.")
    }
  }

  // Prepare chart data
  const accuracyChartData = performanceData.map((test, index) => ({
    name: `Test ${index + 1}`,
    accuracy: test.percentage,
    date: formatDate(test.createdAt),
  }))

  const subjectPerformanceData =
    comparativeData?.userPerformance.subjectPerformance.map((subject) => ({
      name: subject.name,
      accuracy: subject.percentage,
      questions: subject.total,
    })) || []

  const topicMasteryChartData =
    topicMasteryData?.topics
      .map((topic) => ({
        name: topic.name,
        score: topic.masteryScore,
        level: topic.masteryLevel,
        attempts: topic.attempts,
      }))
      .filter((topic) => topic.attempts > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) || []

  const systemMasteryData =
    topicMasteryData?.systems.map((system) => ({
      subject: system.name,
      score: system.masteryScore,
      fullMark: 100,
    })) || []

  const filteredTopics =
    selectedSystem === "all"
      ? topicMasteryData?.topics || []
      : (topicMasteryData?.topics || []).filter((topic) =>
          topicMasteryData?.subtopics.some(
            (subtopic) =>
              subtopic.parentTopic === topic.name && subtopic.name.toLowerCase().includes(selectedSystem.toLowerCase()),
          ),
        )

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  // Loading state
  const isLoading = Object.values(loading).some((status) => status)

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <LoadingStatCard key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingCard />
          <LoadingCard />
        </div>

        <LoadingCard />
      </div>
    )
  }

  // Check if there are any errors to display
  const hasErrors = Object.values(error).some((err) => err !== null)

  if (hasErrors && !isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">Error Loading Data</h2>
          <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
            {error.performance && <li>{error.performance}</li>}
            {error.stats && <li>{error.stats}</li>}
            {error.comparative && <li>{error.comparative}</li>}
            {error.topicMastery && <li>{error.topicMastery}</li>}
          </ul>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 bg-background" ref={dashboardRef}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your performance and identify areas for improvement</p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generatePDF} disabled={isGeneratingPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>{isGeneratingPDF ? "Generating..." : "Download PDF"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="mastery"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Brain className="h-4 w-4 mr-2" />
              Topic Mastery
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Zap className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Target className="h-6 w-6 text-white" />}
                title="Total Questions"
                value={statsData?.totalQuestionsAttempted || 0}
                subtitle={`${statsData?.totalQuestionsCorrect || 0} correct / ${statsData?.totalQuestionsWrong || 0} wrong`}
                color="blue"
              />

              <StatCard
                icon={<Clock className="h-6 w-6 text-white" />}
                title="Total Study Hours"
                value={(performanceData.reduce((sum, item) => sum + item.totalTime, 0) / 3600).toFixed(3)}
                subtitle={`Avg ${statsData?.avgTimePerTest.toFixed(1) || 0} min/test`}
                color="green"
              />

              <StatCard
                icon={<TrendingUp className="h-6 w-6 text-white" />}
                title="Progress Rate"
                value={`${
                  performanceData.length > 1
                    ? (performanceData[performanceData.length - 1].percentage - performanceData[0].percentage).toFixed(
                        3,
                      )
                    : "0.0"
                }%`}
                subtitle={`${comparativeData?.userPerformance.overallPercentile || 0}th percentile`}
                color="purple"
              />

              <StatCard
                icon={<BookOpen className="h-6 w-6 text-white" />}
                title="Tests Taken"
                value={statsData?.totalTestsTaken || 0}
                subtitle={`${topicMasteryData?.overallMastery.topicsStarted || 0} topics explored`}
                color="amber"
              />
            </div>

            {/* Streak Tracker Component */}
            <StreakTracker performanceData={performanceData} isLoading={loading.performance} />

            {/* History Timeline Component */}
            <HistoryTimeline performanceData={performanceData} isLoading={loading.performance} />

            {/* Exam Alignment Component */}
            <ExamAlignment
              topicMasteryData={topicMasteryData}
              targetExam={targetExam}
              isLoading={loading.topicMastery}
              className="mb-6"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Performance Trend</CardTitle>
                        <CardDescription>Your accuracy over time</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={chartType === "bar" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartType("bar")}
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={chartType === "line" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setChartType("line")}
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === "bar" ? (
                          <BarChart data={accuracyChartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                              formatter={(value) => [`${value}%`, "Accuracy"]}
                              labelFormatter={(label) => `${label}`}
                            />
                            <Bar
                              dataKey="accuracy"
                              fill="var(--primary)"
                              radius={[4, 4, 0, 0]}
                              animationDuration={1500}
                            >
                              {accuracyChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 10}, 80%, 55%)`} />
                              ))}
                            </Bar>
                          </BarChart>
                        ) : (
                          <LineChart data={accuracyChartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                              formatter={(value) => [`${value}%`, "Accuracy"]}
                              labelFormatter={(label) => `${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="accuracy"
                              stroke="#555"
                              strokeWidth={3}
                              dot={{ r: 6, strokeWidth: 2 }}
                              activeDot={{ r: 8 }}
                              animationDuration={1500}
                            />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 px-6 py-3">
                    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                      <div>
                        Latest:{" "}
                        <span className="font-medium text-foreground">
                          {performanceData.length > 0
                            ? `${performanceData[performanceData.length - 1].percentage}%`
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        Average:{" "}
                        <span className="font-medium text-foreground">
                          {performanceData.length > 0
                            ? `${(performanceData.reduce((sum, item) => sum + item.percentage, 0) / performanceData.length).toFixed(1)}%`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Subject Performance</CardTitle>
                    <CardDescription>Your accuracy by subject area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {subjectPerformanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={subjectPerformanceData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="accuracy"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              animationDuration={1500}
                            >
                              {subjectPerformanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-muted-foreground">No subject data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 px-6 py-3">
                    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                      <div>
                        Subjects: <span className="font-medium text-foreground">{subjectPerformanceData.length}</span>
                      </div>
                      <div>
                        Best Subject:{" "}
                        <span className="font-medium text-foreground">
                          {subjectPerformanceData.length > 0
                            ? subjectPerformanceData.sort((a, b) => b.accuracy - a.accuracy)[0].name
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Tests</CardTitle>
                      <CardDescription>Your most recent test results</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setViewAllTests(!viewAllTests)}>
                      {viewAllTests ? "Show Less" : "View All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {performanceData.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No tests taken yet. Start taking tests to see your results here!
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <Accordion type="single" collapsible className="w-full">
                        {(viewAllTests ? performanceData : performanceData.slice(0, 5)).map((test, index) => (
                          <AccordionItem value={`item-${index}`} key={index} className="border-b">
                            <AccordionTrigger className="py-4 hover:no-underline">
                              <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="text-left">
                                    <p className="font-medium">Test {performanceData.length - index}</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(test.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-medium">{test.percentage}%</p>
                                    <p className="text-sm text-muted-foreground">
                                      Score: {test.score}/{test.questions.length}
                                    </p>
                                  </div>
                                  <div
                                    className={`w-2 h-10 rounded-full ${test.percentage >= 70 ? "bg-green-500" : test.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                                  ></div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="mt-2 bg-muted/30 p-4 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="bg-background p-3 rounded-md">
                                    <p className="text-sm text-muted-foreground">Total Time</p>
                                    <p className="font-medium">{formatTime(test.totalTime)}</p>
                                  </div>
                                  <div className="bg-background p-3 rounded-md">
                                    <p className="text-sm text-muted-foreground">Avg. Time per Question</p>
                                    <p className="font-medium">{formatTime(test.totalTime / test.questions.length)}</p>
                                  </div>
                                  <div className="bg-background p-3 rounded-md">
                                    <p className="text-sm text-muted-foreground">Date Taken</p>
                                    <p className="font-medium">{formatDate(test.createdAt)}</p>
                                  </div>
                                </div>

                                <h3 className="font-semibold mt-4 mb-2">Questions:</h3>
                                <div className="space-y-3">
                                  {(viewAllQuestions && selectedTestIndex === index
                                    ? test.questions
                                    : test.questions.slice(0, 3)
                                  ).map((q, qIndex) => (
                                    <div key={qIndex} className="border-b pb-3">
                                      <p className="font-medium">
                                        Q{qIndex + 1}: {q.questionText}
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                        <div
                                          className={`p-2 rounded-md ${q.userAnswer === q.correctAnswer ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}
                                        >
                                          <p className="text-sm text-muted-foreground">Your Answer</p>
                                          <p
                                            className={`font-medium ${q.userAnswer === q.correctAnswer ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                                          >
                                            {q.userAnswer}
                                          </p>
                                        </div>
                                        <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                                          <p className="text-sm text-muted-foreground">Correct Answer</p>
                                          <p className="font-medium text-blue-700 dark:text-blue-400">
                                            {q.correctAnswer}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        Time Spent: {formatTime(q.timeSpent)}
                                      </p>
                                    </div>
                                  ))}
                                  {test.questions.length > 3 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => {
                                        setSelectedTestIndex(index)
                                        setViewAllQuestions(!viewAllQuestions)
                                      }}
                                    >
                                      {viewAllQuestions && selectedTestIndex === index
                                        ? "Show Less"
                                        : `View all ${test.questions.length} questions`}{" "}
                                      <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <FlashcardSuggestions performanceData={performanceData} isLoading={loading.performance} />
            </motion.div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Award className="h-6 w-6 text-white" />}
                title="Percentile Rank"
                value={`${comparativeData?.userPerformance.overallPercentile || 0}%`}
                subtitle="Compared to all users"
                color="indigo"
              />

              <StatCard
                icon={<Clock className="h-6 w-6 text-white" />}
                title="Avg. Time per Question"
                value={formatTime(comparativeData?.userPerformance.averageTimePerQuestion || 0)}
                subtitle="Global avg: 45s"
                color="green"
              />

              <StatCard
                icon={<TrendingUp className="h-6 w-6 text-white" />}
                title="Improvement"
                value={`${comparativeData?.improvement?.percentage || 0}%`}
                subtitle="Since first test"
                color="blue"
              />

              <StatCard
                icon={<Target className="h-6 w-6 text-white" />}
                title="Accuracy"
                value={`${
                  performanceData.length > 0
                    ? (
                        performanceData.reduce((sum, item) => sum + item.percentage, 0) / performanceData.length
                      ).toFixed(1)
                    : "0"
                }%`}
                subtitle={`Global avg: ${comparativeData?.globalPerformance.average.percentage || 0}%`}
                color="red"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Subject Performance</CardTitle>
                    <CardDescription>Your performance across different subjects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={subjectPerformanceData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                          <Bar dataKey="accuracy" fill="var(--primary)" radius={[0, 4, 4, 0]} animationDuration={1500}>
                            {subjectPerformanceData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.accuracy >= 70 ? "#10b981" : entry.accuracy >= 50 ? "#f59e0b" : "#ef4444"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Time Efficiency</CardTitle>
                    <CardDescription>Time spent vs. accuracy by test</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={performanceData.map((test, index) => ({
                            name: `Test ${index + 1}`,
                            accuracy: test.percentage,
                            time: test.totalTime / 60, // Convert to minutes
                            date: formatDate(test.createdAt),
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="accuracy"
                            name="Accuracy (%)"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="time"
                            name="Time (min)"
                            stroke="#82ca9d"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Subsection Performance</CardTitle>
                  <CardDescription>Detailed performance by subsection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comparativeData?.userPerformance.subsectionPerformance.map((subsection, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-muted/30 p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{subsection.name}</h3>
                            <p className="text-sm text-muted-foreground">{subsection.subject}</p>
                          </div>
                          <Badge
                            variant={
                              subsection.percentage >= 70
                                ? "default"
                                : subsection.percentage >= 50
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {subsection.percentage}%
                          </Badge>
                        </div>
                        <Progress
                          value={subsection.percentage}
                          className={`h-2 ${
                            subsection.percentage >= 70
                              ? "bg-green-500"
                              : subsection.percentage >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>Correct: {subsection.correct}</span>
                          <span>Total: {subsection.total}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Topic Mastery Tab */}
          <TabsContent value="mastery" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Brain className="h-6 w-6 text-white" />}
                title="Overall Mastery"
                value={`${topicMasteryData?.overallMastery.averageScore || 0}%`}
                subtitle="Average across all topics"
                color="indigo"
              />

              <StatCard
                icon={<Award className="h-6 w-6 text-white" />}
                title="Expert Topics"
                value={topicMasteryData?.overallMastery.topicsAtExpert || 0}
                subtitle={`of ${topicMasteryData?.topics.length || 0} total topics`}
                color="green"
              />

              <StatCard
                icon={<AlertTriangle className="h-6 w-6 text-white" />}
                title="Topics Needing Work"
                value={topicMasteryData?.overallMastery.topicsNeedingWork || 0}
                subtitle="Below 50% mastery"
                color="red"
              />

              <StatCard
                icon={<BookOpen className="h-6 w-6 text-white" />}
                title="Topics Started"
                value={topicMasteryData?.overallMastery.topicsStarted || 0}
                subtitle={`${(((topicMasteryData?.overallMastery.topicsStarted || 0) / (topicMasteryData?.topics.length || 1)) * 100).toFixed(0)}% of curriculum`}
                color="blue"
              />
            </div>

            {/* Next Task CTA Component */}
            <NextTaskCTA
              weakestTopics={topicMasteryData?.weakestTopics || []}
              className="mb-6"
              onStartStudy={(topicName) => {
                toast.success(`Starting study session for: ${topicName}`)
                // In a real app, this would navigate to the study page for this topic
              }}
            />

            {/* Exam Alignment Component */}
            <ExamAlignment
              topicMasteryData={topicMasteryData}
              targetExam={targetExam}
              isLoading={loading.topicMastery}
              className="mb-6"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Top Topics by Mastery</CardTitle>
                        <CardDescription>Your strongest subject areas</CardDescription>
                      </div>
                      <Select defaultValue="all" onValueChange={setSelectedSystem}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by system" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Systems</SelectItem>
                          {topicMasteryData?.systems.map((system, index) => (
                            <SelectItem key={index} value={system.name.toLowerCase()}>
                              {system.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topicMasteryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip
                            formatter={(value) => [`${value}`, "Mastery Score"]}
                            labelFormatter={(label) => `Topic: ${label}`}
                          />
                          <Bar dataKey="score" fill="var(--primary)" radius={[4, 4, 0, 0]} animationDuration={1500}>
                            {topicMasteryChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.level === "Expert"
                                    ? "#10b981"
                                    : entry.level === "Advanced"
                                      ? "#3b82f6"
                                      : entry.level === "Intermediate"
                                        ? "#f59e0b"
                                        : entry.level === "Beginner"
                                          ? "#ef4444"
                                          : "#6b7280"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>System Mastery</CardTitle>
                    <CardDescription>Your mastery across body systems</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius={90} data={systemMasteryData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Mastery Score"
                            dataKey="score"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                            animationDuration={1500}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Topic Mastery Details</CardTitle>
                  <CardDescription>Detailed breakdown of your topic mastery</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {filteredTopics
                        .filter((topic) => topic.attempts > 0)
                        .map((topic, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            className="bg-muted/30 p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{topic.name}</h3>
                                  {topic.isQuestPriority && (
                                    <Badge
                                      variant="outline"
                                      className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    >
                                      Quest Priority
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <MasteryBadge level={topic.masteryLevel} />
                                  <span className="text-sm text-muted-foreground">
                                    {topic.attempts} attempts • {formatTime(topic.averageTime)} avg. time
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold">{topic.masteryScore}%</span>
                              </div>
                            </div>
                            <Progress
                              value={topic.masteryScore}
                              className={
                                topic.masteryLevel === "Expert"
                                  ? "bg-green-500"
                                  : topic.masteryLevel === "Advanced"
                                    ? "bg-blue-500"
                                    : topic.masteryLevel === "Intermediate"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                              }
                            />
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>Correct: {topic.correct}</span>
                              <span>Incorrect: {topic.incorrect}</span>
                              <span>
                                Last attempt: {topic.lastAttemptDate ? formatDate(topic.lastAttemptDate) : "N/A"}
                              </span>
                            </div>
                          </motion.div>
                        ))}

                      {filteredTopics.filter((topic) => topic.attempts > 0).length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No topic data available for the selected filter.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-3"
              >
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" />
                      Personalized Study Recommendations
                    </CardTitle>
                    <CardDescription>
                      Based on your performance data, we recommend focusing on these areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topicMasteryData?.recommendations.map((rec, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full 
                              ${
                                rec.masteryLevel === "Expert"
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                  : rec.masteryLevel === "Advanced"
                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                    : rec.masteryLevel === "Intermediate"
                                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {getMasteryIcon(rec.masteryLevel)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{rec.topic}</h3>
                                {rec.isQuestPriority && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs"
                                  >
                                    Quest
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{rec.recommendation}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Current Mastery</span>
                              <span>{rec.masteryScore}%</span>
                            </div>
                            <Progress
                              value={rec.masteryScore}
                              className={`h-2 ${
                                rec.masteryLevel === "Expert"
                                  ? "bg-green-500"
                                  : rec.masteryLevel === "Advanced"
                                    ? "bg-blue-500"
                                    : rec.masteryLevel === "Intermediate"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                              }`}
                            />
                          </div>
                          <Button variant="ghost" size="sm" className="w-full mt-3">
                            Study This Topic
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Add FlashcardSuggestions component here */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-3"
              >
                <FlashcardSuggestions performanceData={performanceData} isLoading={loading.performance} />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 lg:col-span-3">
                <NextTaskCTA
                  weakestTopics={topicMasteryData?.weakestTopics || []}
                  variant="card"
                  onStartStudy={(topicName) => {
                    toast.success(`Starting study session for: ${topicName}`)
                    // In a real app, this would navigate to the study page for this topic
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Your Progress</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        You&apos;ve made significant progress in these areas:
                      </p>
                      <div className="space-y-2">
                        {topicMasteryData?.strongestTopics.slice(0, 2).map((topic, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{topic.name}</span>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Mastery</span>
                                <span>{topic.masteryScore}%</span>
                              </div>
                              <Progress value={topic.masteryScore} className="bg-green-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Improvement Areas
                    </CardTitle>
                    <CardDescription>Topics where you&apos;ve shown the most improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topicMasteryData?.topics
                      .filter((topic) => topic.attempts > 3)
                      .sort((a, b) => b.masteryScore - a.masteryScore)
                      .slice(0, 5)
                      .map((topic, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index }}
                          className="flex items-center justify-between py-3 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">{topic.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {topic.correct} correct of {topic.attempts} attempts
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          >
                            {topic.masteryScore}%
                          </Badge>
                        </motion.div>
                      ))}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Focus Areas
                    </CardTitle>
                    <CardDescription>Topics that need immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topicMasteryData?.weakestTopics
                      .filter((topic) => topic.masteryScore < 50)
                      .map((topic, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index }}
                          className="flex items-center justify-between py-3 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium">{topic.name}</p>
                              <MasteryBadge level={topic.masteryLevel} />
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Study
                          </Button>
                        </motion.div>
                      ))}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="lg:col-span-3"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Recommended Study Plan
                    </CardTitle>
                    <CardDescription>A personalized study plan based on your performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="font-medium text-lg mb-2">This Week&apos;s Focus</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {topicMasteryData?.weakestTopics.slice(0, 3).map((topic, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 * index }}
                              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-muted"
                            >
                              <h4 className="font-medium">{topic.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Focus on building fundamentals and practice questions
                              </p>
                              <div className="mt-3 flex items-center justify-between">
                                <MasteryBadge level={topic.masteryLevel} />
                                <Button size="sm" variant="outline">
                                  Start
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>
                        <div className="space-y-6 pl-10">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="absolute -left-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium">1</span>
                              </div>
                              <h3 className="font-medium">Short-term Goals (1-2 weeks)</h3>
                            </div>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              <li>
                                Focus on your weakest topics: {topicMasteryData?.weakestTopics[0]?.name || "N/A"} and{" "}
                                {topicMasteryData?.weakestTopics[1]?.name || "N/A"}
                              </li>
                              <li>Complete at least 3 practice tests with focused review of incorrect answers</li>
                              <li>Aim to improve your average accuracy by 5%</li>
                            </ul>
                          </div>

                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="absolute -left-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium">2</span>
                              </div>
                              <h3 className="font-medium">Mid-term Goals (1 month)</h3>
                            </div>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              <li>Achieve at least Intermediate mastery in all started topics</li>
                              <li>Improve time efficiency by 15% on question answering</li>
                              <li>Complete all active quests in your curriculum</li>
                            </ul>
                          </div>

                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="absolute -left-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary font-medium">3</span>
                              </div>
                              <h3 className="font-medium">Long-term Goals (3 months)</h3>
                            </div>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                              <li>Achieve Advanced or Expert mastery in at least 50% of topics</li>
                              <li>Reach the 80th percentile in overall performance</li>
                              <li>Complete comprehensive review of all subject areas</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Analytics Report</DialogTitle>
              <DialogDescription>Share your performance report with colleagues or mentors</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="share-link" className="text-right text-sm font-medium col-span-1">
                  Link
                </label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input id="share-link" value={shareUrl} readOnly className="col-span-3" />
                  <Button size="icon" variant="outline" onClick={() => handleShareReport("copy")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right text-sm font-medium col-span-1">
                  Email
                </label>
                <Input
                  id="email"
                  placeholder="colleague@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="note" className="text-right text-sm font-medium col-span-1">
                  Note
                </label>
                <Textarea
                  id="note"
                  placeholder="Add a personal note..."
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="flex justify-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleShareReport("social")}>
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShareReport("social")}>
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShareReport("social")}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => setIsShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleShareReport("email")} type="submit">
                Share Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Toaster position="top-right" />
      </div>
    </TooltipProvider>
  )
}

