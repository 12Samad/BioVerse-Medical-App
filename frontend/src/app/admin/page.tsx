"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { BarChart2, BookCheck, BookOpen, Layers, School, UserCog, UserPlus, Users } from "lucide-react"
import { useEffect, useState } from "react"

type Stats = {
  totalUsers: number
  totalSubjects: number
  totalQuestions: number
  verifiedUsers: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com/api/test"

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stats`)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const features = [
    {
      name: "Create Questions",
      description: "Easily add new questions with multiple options and correct answers for tests and quizzes.",
      icon: BookOpen,
      href: "/admin/create-test",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      name: "Manage Subjects",
      description: "Organize subjects, subsections, and categories efficiently to structure test content.",
      icon: Layers,
      href: "/admin/manage",
      color: "bg-green-500/10 text-green-500",
    },
    {
      name: "User Management",
      description: "Control user accounts, assign roles, and manage permissions for better access control.",
      icon: UserCog,
      href: "/admin/manage/users",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      name: "Statistics",
      description: "Gain insights with real-time statistics and analytics on tests, users, and performance.",
      icon: BarChart2,
      href: "/admin/statistics",
      color: "bg-yellow-500/10 text-yellow-500",
    },
  ]


  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-blue-500/10 text-blue-500",
      loading: loading,
    },
    {
      title: "Verified Users",
      value: stats?.verifiedUsers || 0,
      icon: UserPlus,
      color: "bg-green-500/10 text-green-500",
      loading: loading,
    },
    {
      title: "Total Subjects",
      value: stats?.totalSubjects || 0,
      icon: School,
      color: "bg-purple-500/10 text-purple-500",
      loading: loading,
    },
    {
      title: "Total Questions",
      value: stats?.totalQuestions || 0,
      icon: BookCheck,
      color: "bg-yellow-500/10 text-yellow-500",
      loading: loading,
    },
  ]




  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature, index) => (
          <motion.div
            key={feature.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card
              className="hover:bg-accent transition-colors cursor-pointer"
              onClick={() => (window.location.href = feature.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`rounded-full p-2 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-lg mt-4">{feature.name}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

    </div>
  )
}

