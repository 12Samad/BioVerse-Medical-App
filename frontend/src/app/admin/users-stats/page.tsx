"use client"

import {
    Activity,
    ArrowLeft,
    BookCheck,
    Calendar,
    CheckCircle,
    Clock,
    Flame,
    LineChartIcon,
    Medal,
    PieChartIcon,
    Search,
    Star,
    TrendingUp,
    User,
    Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
    Area,
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipProps,
} from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com/api/user-stats"

// Types for the user stats API response
type UserStats = {
    id: string
    name: string
    email: string
    status: string
    role: string
    avatarUrl: string
    engagement: {
        activityFrequency: number[]
        timeSpent: number[]
        lastActive: string
        totalSessions: number
        averageSessionTime: number
        weeklyGrowth: number
        monthlyActivity: number[]
        completionRate: number
        streakDays: number
    }
    progress: {
        courseCompletion: number
        assignmentScores: number[]
        quizScores: number[]
        totalQuestions: number
        correctAnswers: number
        improvementRate: number
        weakestTopics: string[]
        strongestTopics: string[]
        recentImprovement: number
    }
    subscription: {
        status: string
        plan: string
        renewalDate: string | null
        startDate: string | null
        planLimit: number
        usage: number
        previousPlans: string[]
        lifetimeValue: number
        discountEligible: boolean
        referrals: number
    }
    quests: {
        total: number
        completed: number
        inProgress: number
        overdue: number
        byPriority: {
            low: number
            medium: number
            high: number
            urgent: number
        }
        byCategory: {
            medication: number
            exercise: number
            diet: number
            monitoring: number
            assessment: number
        }
        completionTrend: number[]
    }
}

// Type for user list
type UserType = {
    _id: string
    name: string
    email: string
    isVerified: boolean
    role: string
}

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
                <div className="font-medium">{label}</div>
                <div className="text-sm text-muted-foreground">
                    {payload[0].value} {payload[0].name}
                </div>
            </div>
        )
    }
    return null
}

export default function StatisticsPage() {
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [users, setUsers] = useState<UserType[]>([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [viewingStats, setViewingStats] = useState(false)

    const usersPerPage = 10

    // Fetch all users for admin view
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setUsersLoading(true)
                const response = await fetch(`${API_BASE_URL}/users`)
                const data = await response.json()

                if (data.success && data.data) {
                    setUsers(data.data)
                } else {
                    console.error("Error fetching users:", data.error || "Unknown error")
                }
            } catch (error) {
                console.error("Error fetching users:", error)
            } finally {
                setUsersLoading(false)
            }
        }

        fetchUsers()
    }, [])

    // Fetch user stats when userId changes
    useEffect(() => {
        const fetchUserStats = async () => {
            if (!userId) return

            try {
                setLoading(true)
                const response = await fetch(`${API_BASE_URL}/getUserStats/${userId}/stats`)
                const data = await response.json()

                if (data.success) {
                    setUserStats(data.data)
                    setViewingStats(true)
                } else {
                    console.error("Error fetching user stats:", data.message)
                }
            } catch (error) {
                console.error("Error fetching user stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserStats()
    }, [userId])

    // Filter users based on search query
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Paginate users
    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

    // Generate days of the week for chart labels
    const getDaysOfWeek = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const today = new Date().getDay()
        return Array.from({ length: 7 }, (_, i) => {
            const index = (today - 6 + i + 7) % 7
            return days[index]
        })
    }

    const daysOfWeek = getDaysOfWeek()

    // Format time in minutes to hours and minutes
    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    // Handle view stats button click
    const handleViewStats = (id: string) => {
        setUserId(id)
    }

    // Handle back button click
    const handleBackToUsers = () => {
        setViewingStats(false)
        setUserId(null)
    }

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
    }

    // Prepare data for charts
    const prepareActivityData = () => {
        if (!userStats?.engagement?.activityFrequency)
            return Array(7)
                .fill(0)
                .map((value, index) => ({
                    name: daysOfWeek[index],
                    sessions: value,
                }))

        return userStats.engagement.activityFrequency.map((value, index) => ({
            name: daysOfWeek[index],
            sessions: value,
        }))
    }

    const prepareTimeSpentData = () => {
        if (!userStats?.engagement?.timeSpent)
            return Array(7)
                .fill(0)
                .map((value, index) => ({
                    name: daysOfWeek[index],
                    minutes: value,
                }))

        return userStats.engagement.timeSpent.map((value, index) => ({
            name: daysOfWeek[index],
            minutes: value,
        }))
    }

    const prepareMonthlyActivityData = () => {
        if (!userStats?.engagement?.monthlyActivity)
            return Array(4)
                .fill(0)
                .map((value, index) => ({
                    name: `Week ${index + 1}`,
                    sessions: value,
                }))

        return userStats.engagement.monthlyActivity.map((value, index) => ({
            name: `Week ${index + 1}`,
            sessions: value,
        }))
    }

    const prepareQuizScoresData = () => {
        if (!userStats?.progress?.quizScores) return []

        return userStats.progress.quizScores.map((value, index) => ({
            name: `Quiz ${index + 1}`,
            score: value,
        }))
    }

    const prepareCompletionTrendData = () => {
        if (!userStats?.quests?.completionTrend)
            return Array(4)
                .fill(0)
                .map((value, index) => ({
                    name: `Week ${index + 1}`,
                    completed: value,
                }))

        return userStats.quests.completionTrend.map((value, index) => ({
            name: `Week ${index + 1}`,
            completed: value,
        }))
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {!viewingStats ? (
                // Admin User List View
                <>
                    <div className="flex flex-col space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                        <p className="text-muted-foreground">View and manage all registered users and their statistics.</p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search users..."
                                className="w-full pl-8"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1) // Reset to first page on search
                                }}
                            />
                        </div>

                        <Button className="relative overflow-hidden group" size="sm">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                            <span className="relative flex items-center justify-center">
                                <Users className="mr-2 h-4 w-4" />
                                Export User Data
                            </span>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Users</CardTitle>
                            <CardDescription>Manage users and view their detailed statistics.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {usersLoading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center space-x-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-[250px]" />
                                                <Skeleton className="h-4 w-[200px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {currentUsers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                            No users found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    currentUsers.map((user) => (
                                                        <TableRow key={user._id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center space-x-3">
                                                                    <Avatar>
                                                                        <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={user.name} />
                                                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{user.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={user.isVerified ? "default" : "outline"}>
                                                                    {user.isVerified ? "Verified" : "Unverified"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary">
                                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    onClick={() => handleViewStats(user._id)}
                                                                    className="relative overflow-hidden group"
                                                                    size="sm"
                                                                >
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                    <span className="relative flex items-center justify-center">
                                                                        <LineChartIcon className="mr-2 h-4 w-4" />
                                                                        View Stats
                                                                    </span>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {totalPages > 1 && (
                                        <Pagination className="mt-4">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                                    />
                                                </PaginationItem>

                                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                                    let pageNumber: number

                                                    // Logic to show pages around current page
                                                    if (totalPages <= 5) {
                                                        pageNumber = i + 1
                                                    } else if (currentPage <= 3) {
                                                        pageNumber = i + 1
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNumber = totalPages - 4 + i
                                                    } else {
                                                        pageNumber = currentPage - 2 + i
                                                    }

                                                    // Show ellipsis for large page counts
                                                    if (totalPages > 5) {
                                                        if (i === 0 && currentPage > 3) {
                                                            return (
                                                                <PaginationItem key={i}>
                                                                    <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                                                                </PaginationItem>
                                                            )
                                                        }

                                                        if (i === 1 && currentPage > 3) {
                                                            return (
                                                                <PaginationItem key={i}>
                                                                    <PaginationEllipsis />
                                                                </PaginationItem>
                                                            )
                                                        }

                                                        if (i === 3 && currentPage < totalPages - 2) {
                                                            return (
                                                                <PaginationItem key={i}>
                                                                    <PaginationEllipsis />
                                                                </PaginationItem>
                                                            )
                                                        }

                                                        if (i === 4 && currentPage < totalPages - 2) {
                                                            return (
                                                                <PaginationItem key={i}>
                                                                    <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                                                                        {totalPages}
                                                                    </PaginationLink>
                                                                </PaginationItem>
                                                            )
                                                        }
                                                    }

                                                    return (
                                                        <PaginationItem key={i}>
                                                            <PaginationLink
                                                                isActive={currentPage === pageNumber}
                                                                onClick={() => setCurrentPage(pageNumber)}
                                                            >
                                                                {pageNumber}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    )
                                                })}

                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : (
                // User Statistics View
                <>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">User Statistics</h2>
                            <p className="text-muted-foreground">
                                Detailed analytics and performance metrics for {userStats?.name || "user"}.
                            </p>
                        </div>

                        <Button onClick={handleBackToUsers} variant="outline" className="flex items-center">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className="grid grid-cols-4 md:w-[400px]">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="engagement">Engagement</TabsTrigger>
                            <TabsTrigger value="progress">Progress</TabsTrigger>
                            <TabsTrigger value="quests">Quests</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {/* User Profile Card */}
                                <Card className="md:col-span-2">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">User Profile</CardTitle>
                                        <div className="rounded-full p-2 bg-blue-500/10 text-blue-500">
                                            <User className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        {loading ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <Skeleton className="h-4 w-[200px]" />
                                                <Skeleton className="h-4 w-[150px]" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-4">
                                                <div className="relative h-12 w-12 rounded-full bg-muted">
                                                    <Image
                                                        src={userStats?.avatarUrl || "/placeholder.svg?height=48&width=48"}
                                                        alt="User avatar"
                                                        className="rounded-full"
                                                        layout="fill"
                                                        objectFit="cover"
                                                        width={12}
                                                        height={12}
                                                    />
                                                    <span
                                                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${userStats?.status === "active" ? "bg-green-500" : "bg-gray-400"
                                                            }`}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-medium">{userStats?.name || "User Name"}</p>
                                                    <p className="text-sm text-muted-foreground">{userStats?.email || "user@example.com"}</p>
                                                    <div className="flex items-center mt-1">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                            {userStats?.role || "User"}
                                                        </span>
                                                        {userStats?.subscription?.plan && (
                                                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                                                {userStats.subscription.plan}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Streak Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                                        <div className="rounded-full p-2 bg-orange-500/10 text-orange-500">
                                            <Flame className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">{userStats?.engagement?.streakDays || 0} days</div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
                                    </CardContent>
                                </Card>

                                {/* Completion Rate Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                                        <div className="rounded-full p-2 bg-green-500/10 text-green-500">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">
                                                {Math.round(userStats?.engagement?.completionRate || 0)}%
                                            </div>
                                        )}
                                        <Progress value={userStats?.engagement?.completionRate || 0} className="h-2 mt-2" />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Activity and Time Charts */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Weekly Activity</CardTitle>
                                        <CardDescription>Number of sessions per day</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-[200px] w-full" />
                                        ) : (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <ComposedChart data={prepareActivityData()}>
                                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                    <CartesianGrid vertical={false} />
                                                    <Bar dataKey="sessions" name="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Time Spent</CardTitle>
                                        <CardDescription>Minutes per day</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-[200px] w-full" />
                                        ) : (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <ComposedChart data={prepareTimeSpentData()}>
                                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                    <CartesianGrid vertical={false} />
                                                    <Area
                                                        dataKey="minutes"
                                                        name="minutes"
                                                        fill="hsla(var(--primary), 0.2)"
                                                        stroke="hsl(var(--primary))"
                                                        strokeWidth={2}
                                                    />
                                                    <Line dataKey="minutes" name="minutes" stroke="hsl(var(--primary))" strokeWidth={2} />
                                                    <Tooltip
                                                        content={({ active, payload, label }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
                                                                        <div className="font-medium">{label}</div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {formatTime(payload[0].value as number)}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        }}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <Button className="relative overflow-hidden group" size="lg">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative flex items-center justify-center">
                                        <Activity className="mr-2 h-5 w-5" />
                                        View Detailed Analytics
                                    </span>
                                </Button>

                                <Button className="relative overflow-hidden group" size="lg">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative flex items-center justify-center">
                                        <Calendar className="mr-2 h-5 w-5" />
                                        Schedule Assessment
                                    </span>
                                </Button>

                                <Button className="relative overflow-hidden group" size="lg">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative flex items-center justify-center">
                                        <Medal className="mr-2 h-5 w-5" />
                                        View Achievements
                                    </span>
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Engagement Tab */}
                        <TabsContent value="engagement" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                                        <div className="rounded-full p-2 bg-blue-500/10 text-blue-500">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">{userStats?.engagement?.totalSessions || 0}</div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
                                        <div className="rounded-full p-2 bg-green-500/10 text-green-500">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">
                                                {formatTime(userStats?.engagement?.averageSessionTime || 0)}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Weekly Growth</CardTitle>
                                        <div className="rounded-full p-2 bg-purple-500/10 text-purple-500">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">{userStats?.engagement?.weeklyGrowth || 0}%</div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Last Active</CardTitle>
                                        <div className="rounded-full p-2 bg-yellow-500/10 text-yellow-500">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-lg font-medium">
                                                {userStats?.engagement?.lastActive
                                                    ? new Date(userStats.engagement.lastActive).toLocaleDateString()
                                                    : "N/A"}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Monthly Activity</CardTitle>
                                    <CardDescription>Sessions completed per week</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <Skeleton className="h-[300px] w-full" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <ComposedChart data={prepareMonthlyActivityData()}>
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                <CartesianGrid vertical={false} />
                                                <Bar dataKey="sessions" name="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                <Tooltip content={<CustomTooltip />} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button className="relative overflow-hidden group w-full" size="sm">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <span className="relative flex items-center justify-center">
                                            <LineChartIcon className="mr-2 h-4 w-4" />
                                            View Detailed Engagement Report
                                        </span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Progress Tab */}
                        <TabsContent value="progress" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
                                        <div className="rounded-full p-2 bg-blue-500/10 text-blue-500">
                                            <BookCheck className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <>
                                                <div className="text-2xl font-bold">{userStats?.progress?.courseCompletion || 0}%</div>
                                                <Progress value={userStats?.progress?.courseCompletion || 0} className="h-2 mt-2" />
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Correct Answers</CardTitle>
                                        <div className="rounded-full p-2 bg-green-500/10 text-green-500">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">
                                                {userStats?.progress?.correctAnswers || 0} / {userStats?.progress?.totalQuestions || 0}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {userStats?.progress?.totalQuestions
                                                ? Math.round((userStats.progress.correctAnswers / userStats.progress.totalQuestions) * 100)
                                                : 0}
                                            % accuracy
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
                                        <div className="rounded-full p-2 bg-purple-500/10 text-purple-500">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">{userStats?.progress?.improvementRate || 0}%</div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Recent: {userStats?.progress?.recentImprovement || 0}%
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Quiz Performance</CardTitle>
                                        <div className="rounded-full p-2 bg-yellow-500/10 text-yellow-500">
                                            <Star className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">
                                                {userStats?.progress?.quizScores?.length
                                                    ? Math.round(
                                                        userStats.progress.quizScores.reduce((a, b) => a + b, 0) /
                                                        userStats.progress.quizScores.length,
                                                    )
                                                    : 0}
                                                %
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">Average score</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quiz Scores</CardTitle>
                                        <CardDescription>Performance over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-[200px] w-full" />
                                        ) : (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <ComposedChart data={prepareQuizScoresData()}>
                                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                                    <CartesianGrid vertical={false} />
                                                    <Line dataKey="score" name="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                                                    <Tooltip
                                                        content={({ active, payload, label }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
                                                                        <div className="font-medium">{label}</div>
                                                                        <div className="text-sm text-muted-foreground">Score: {payload[0].value}%</div>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        }}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Strengths & Weaknesses</CardTitle>
                                        <CardDescription>Topic performance analysis</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-[200px] w-full" />
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 flex items-center">
                                                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                                        Strongest Topics
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {userStats?.progress?.strongestTopics?.length ? (
                                                            userStats.progress.strongestTopics.map((topic, i) => (
                                                                <div key={i} className="flex items-center">
                                                                    <span className="text-sm">{topic}</span>
                                                                    <div className="ml-auto flex items-center">
                                                                        <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                                                                        <span className="text-xs text-muted-foreground">Strong</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">No data available</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium mb-2 flex items-center">
                                                        <Activity className="h-4 w-4 mr-1 text-red-500" />
                                                        Areas for Improvement
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {userStats?.progress?.weakestTopics?.length ? (
                                                            userStats.progress.weakestTopics.map((topic, i) => (
                                                                <div key={i} className="flex items-center">
                                                                    <span className="text-sm">{topic}</span>
                                                                    <div className="ml-auto flex items-center">
                                                                        <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                                                                        <span className="text-xs text-muted-foreground">Needs work</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">No data available</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Button className="relative overflow-hidden group w-full" size="lg">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center justify-center">
                                    <PieChartIcon className="mr-2 h-5 w-5" />
                                    Generate Comprehensive Progress Report
                                </span>
                            </Button>
                        </TabsContent>

                        {/* Quests Tab */}
                        <TabsContent value="quests" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Quests</CardTitle>
                                        <div className="rounded-full p-2 bg-blue-500/10 text-blue-500">
                                            <BookCheck className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">{userStats?.quests?.total || 0}</div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                        <div className="rounded-full p-2 bg-green-500/10 text-green-500">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <>
                                                <div className="text-2xl font-bold">{userStats?.quests?.completed || 0}</div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {userStats?.quests?.total
                                                        ? Math.round((userStats.quests.completed / userStats.quests.total) * 100)
                                                        : 0}
                                                    % completion rate
                                                </p>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                                        <div className="rounded-full p-2 bg-yellow-500/10 text-yellow-500">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">{userStats?.quests?.inProgress || 0}</div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                        <div className="rounded-full p-2 bg-red-500/10 text-red-500">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-7 w-20" />
                                        ) : (
                                            <div className="text-2xl font-bold">{userStats?.quests?.overdue || 0}</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quests by Priority</CardTitle>
                                        <CardDescription>Distribution of tasks by importance</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-[200px] w-full" />
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                                                            <span className="text-sm">Urgent</span>
                                                        </div>
                                                        <span className="text-sm font-medium">{userStats?.quests?.byPriority?.urgent || 0}</span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byPriority?.urgent || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-red-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
                                                            <span className="text-sm">High</span>
                                                        </div>
                                                        <span className="text-sm font-medium">{userStats?.quests?.byPriority?.high || 0}</span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byPriority?.high || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-orange-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                                                            <span className="text-sm">Medium</span>
                                                        </div>
                                                        <span className="text-sm font-medium">{userStats?.quests?.byPriority?.medium || 0}</span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byPriority?.medium || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-yellow-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                                                            <span className="text-sm">Low</span>
                                                        </div>
                                                        <span className="text-sm font-medium">{userStats?.quests?.byPriority?.low || 0}</span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byPriority?.low || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quests by Category</CardTitle>
                                        <CardDescription>Distribution of tasks by type</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <Skeleton className="h-[200px] w-full" />
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                                                            <span className="text-sm">Medication</span>
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {userStats?.quests?.byCategory?.medication || 0}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byCategory?.medication || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-purple-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                                                            <span className="text-sm">Exercise</span>
                                                        </div>
                                                        <span className="text-sm font-medium">{userStats?.quests?.byCategory?.exercise || 0}</span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byCategory?.exercise || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-green-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                                                            <span className="text-sm">Diet</span>
                                                        </div>
                                                        <span className="text-sm font-medium">{userStats?.quests?.byCategory?.diet || 0}</span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byCategory?.diet || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-blue-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-pink-500 mr-2"></div>
                                                            <span className="text-sm">Monitoring</span>
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {userStats?.quests?.byCategory?.monitoring || 0}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byCategory?.monitoring || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-pink-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
                                                            <span className="text-sm">Assessment</span>
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {userStats?.quests?.byCategory?.assessment || 0}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={userStats?.quests?.byCategory?.assessment || 0}
                                                        max={userStats?.quests?.total || 1}
                                                        className="h-2 bg-muted bg-orange-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Completion Trend</CardTitle>
                                    <CardDescription>Quest completion over time</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <Skeleton className="h-[200px] w-full" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <ComposedChart data={prepareCompletionTrendData()}>
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                <CartesianGrid vertical={false} />
                                                <Line dataKey="completed" name="completed" stroke="hsl(var(--primary))" strokeWidth={2} />
                                                <Area
                                                    dataKey="completed"
                                                    name="completed"
                                                    fill="hsla(var(--primary), 0.2)"
                                                    stroke="hsl(var(--primary))"
                                                    strokeWidth={2}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button className="relative overflow-hidden group w-full" size="sm">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <span className="relative flex items-center justify-center">
                                            <BookCheck className="mr-2 h-4 w-4" />
                                            View All Quests
                                        </span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}

