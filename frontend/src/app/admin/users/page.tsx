"use client"

import type React from "react"

import axios from "axios"
import {
    Activity,
    BarChart,
    BookCheck,
    Calendar,
    CheckCircle,
    Clock,
    Edit2,
    Flame,
    Plus,
    Search,
    Star,
    Trash2,
    TrendingUp,
    User,
    UserCheck,
    UserX,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com/api/auth"
const STATS_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com/api/user-stats"

type UserType = {
    _id: string
    name: string
    email: string
    isVerified: boolean
    role: string
}

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

type UserFormData = {
    name: string
    email: string
    password?: string
    role: string
}

const ROLES = ["user", "admin", "moderator"]

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

export default function UsersPage() {
    const [users, setUsers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserType | null>(null)
    const [formData, setFormData] = useState<UserFormData>({
        name: "",
        email: "",
        password: "",
        role: "user",
    })
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [viewingStats, setViewingStats] = useState(false)
    // const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_BASE_URL}/users`)
            setUsers(response.data)
        } catch (error) {
            console.error("Error fetching users:", error)
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to load users: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to load users. Please try again ${(error as Error).message}`)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingUser) {
                // Update user
                const { password } = formData
                if (!password) delete formData.password // Only include password if it's being changed

                await axios.put(`${API_BASE_URL}/users/${editingUser._id}`, formData)
                setUsers((prev) =>
                    prev.map((user) =>
                        user._id === editingUser._id
                            ? { ...user, name: formData.name, email: formData.email, role: formData.role }
                            : user,
                    ),
                )

                toast.success("User updated successfully")
            } else {
                // Create user
                const response = await axios.post(`${API_BASE_URL}/users`, formData)
                setUsers((prev) => [...prev, response.data])
                toast.success("User created successfully")
            }
            setIsDialogOpen(false)
            resetForm()
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(`${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`${(error as Error).message}`)
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return

        try {
            await axios.delete(`${API_BASE_URL}/users/${id}`)
            setUsers((prev) => prev.filter((user) => user._id !== id))
            toast.success("User deleted successfully")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to delete user: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to delete user ${(error as Error).message}`)
            }
        }
    }

    const toggleVerification = async (user: UserType) => {
        try {
            await axios.put(`${API_BASE_URL}/users/${user._id}/verify`, {
                isVerified: !user.isVerified,
            })
            setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isVerified: !u.isVerified } : u)))
            toast.success(`User ${user.isVerified ? "unverified" : "verified"} successfully`)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to update verification status: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to update verification status ${(error as Error).message}`)
            }
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "user",
        })
        setEditingUser(null)
    }

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Load user statistics
    const loadUserStats = async (userId: string) => {
        try {
            setStatsLoading(true)
            // setSelectedUserId(userId)

            const response = await axios.get(`${STATS_API_URL}/getUserStats/${userId}/stats`)
            if (response.data.success) {
                setUserStats(response.data.data)
                setViewingStats(true)
            } else {
                toast.error("Failed to load user statistics")
            }
        } catch (error) {
            console.error("Error loading user statistics:", error)
            toast.error("Failed to load user statistics. Please try again.")
        } finally {
            setStatsLoading(false)
        }
    }

    // Return to user list
    const handleBackToUsers = () => {
        setViewingStats(false)
        setUserStats(null)
        // setSelectedUserId(null)
    }

    // Format time in minutes to hours and minutes
    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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

    if (loading) {
        return (
            <div className="container py-6 space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    return (
        <div className="container py-6 space-y-6">
            <Toaster position="top-right" />

            {!viewingStats ? (
                // User Management View
                <>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">Manage Users</h1>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => {
                                        resetForm()
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
                                    <DialogDescription>
                                        {editingUser ? "Update the user details below." : "Enter the details for the new user below."}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                                placeholder="Enter email"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password {editingUser && "(leave blank to keep unchanged)"}</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                                                placeholder="Enter password"
                                                required={!editingUser}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROLES.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">{editingUser ? "Update" : "Create"}</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        No users found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredUsers.map((user) => (
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
                                                            <Badge
                                                                variant={
                                                                    user.role === "admin"
                                                                        ? "destructive"
                                                                        : user.role === "moderator"
                                                                            ? "outline"
                                                                            : "secondary"
                                                                }
                                                            >
                                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant={user.isVerified ? "default" : "secondary"}
                                                                size="sm"
                                                                onClick={() => toggleVerification(user)}
                                                            >
                                                                {user.isVerified ? (
                                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                                ) : (
                                                                    <UserX className="h-4 w-4 mr-2" />
                                                                )}
                                                                {user.isVerified ? "Verified" : "Unverified"}
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setEditingUser(user)
                                                                        setFormData({
                                                                            name: user.name,
                                                                            email: user.email,
                                                                            password: "",
                                                                            role: user.role,
                                                                        })
                                                                        setIsDialogOpen(true)
                                                                    }}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="outline" size="icon" onClick={() => loadUserStats(user._id)}>
                                                                    <BarChart className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="destructive" size="icon" onClick={() => handleDelete(user._id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
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
                            <User className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </div>

                    {statsLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-[200px] w-full rounded-lg" />
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
                                ))}
                            </div>
                        </div>
                    ) : (
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
                                            <div className="flex items-center space-x-4">
                                                <div className="relative h-12 w-12 rounded-full bg-muted">
                                                    {/* <img
                                                        src={userStats?.avatarUrl || "/placeholder.svg?height=48&width=48"}
                                                        alt="User avatar"
                                                        className="rounded-full"
                                                    /> */}
                                                    <Avatar>
                                                        <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={userStats?.name} />
                                                        <AvatarFallback>{getInitials(userStats?.name || "")}</AvatarFallback>
                                                    </Avatar>
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
                                            <div className="text-2xl font-bold">{userStats?.engagement?.streakDays || 0} days</div>
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
                                            <div className="text-2xl font-bold">
                                                {Math.round(userStats?.engagement?.completionRate || 0)}%
                                            </div>
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
                                            <ResponsiveContainer width="100%" height={200}>
                                                <ComposedChart data={prepareActivityData()}>
                                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                    <CartesianGrid vertical={false} />
                                                    <Bar dataKey="sessions" name="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Time Spent</CardTitle>
                                            <CardDescription>Minutes per day</CardDescription>
                                        </CardHeader>
                                        <CardContent>
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
                                        </CardContent>
                                    </Card>
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
                                            <div className="text-2xl font-bold">{userStats?.engagement?.totalSessions || 0}</div>
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
                                            <div className="text-2xl font-bold">
                                                {formatTime(userStats?.engagement?.averageSessionTime || 0)}
                                            </div>
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
                                            <div className="text-2xl font-bold">{userStats?.engagement?.weeklyGrowth || 0}%</div>
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
                                            <div className="text-lg font-medium">
                                                {userStats?.engagement?.lastActive
                                                    ? new Date(userStats.engagement.lastActive).toLocaleDateString()
                                                    : "N/A"}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Monthly Activity</CardTitle>
                                        <CardDescription>Sessions completed per week</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <ComposedChart data={prepareMonthlyActivityData()}>
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                <CartesianGrid vertical={false} />
                                                <Bar dataKey="sessions" name="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                                <Tooltip content={<CustomTooltip />} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </CardContent>
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
                                            <>
                                                <div className="text-2xl font-bold">{userStats?.progress?.courseCompletion || 0}%</div>
                                                <Progress value={userStats?.progress?.courseCompletion || 0} className="h-2 mt-2" />
                                            </>
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
                                            <div className="text-2xl font-bold">
                                                {userStats?.progress?.correctAnswers || 0} / {userStats?.progress?.totalQuestions || 0}
                                            </div>
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
                                            <div className="text-2xl font-bold">{userStats?.progress?.improvementRate || 0}%</div>
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
                                            <div className="text-2xl font-bold">
                                                {userStats?.progress?.quizScores?.length
                                                    ? Math.round(
                                                        userStats.progress.quizScores.reduce((a, b) => a + b, 0) /
                                                        userStats.progress.quizScores.length,
                                                    )
                                                    : 0}
                                                %
                                            </div>
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
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Strengths & Weaknesses</CardTitle>
                                            <CardDescription>Topic performance analysis</CardDescription>
                                        </CardHeader>
                                        <CardContent>
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
                                        </CardContent>
                                    </Card>
                                </div>
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
                                            <div className="text-2xl font-bold">{userStats?.quests?.total || 0}</div>
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
                                            <>
                                                <div className="text-2xl font-bold">{userStats?.quests?.completed || 0}</div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {userStats?.quests?.total
                                                        ? Math.round((userStats.quests.completed / userStats.quests.total) * 100)
                                                        : 0}
                                                    % completion rate
                                                </p>
                                            </>
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
                                            <div className="text-2xl font-bold">{userStats?.quests?.inProgress || 0}</div>
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
                                            <div className="text-2xl font-bold">{userStats?.quests?.overdue || 0}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Completion Trend</CardTitle>
                                        <CardDescription>Quest completion over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
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
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </>
            )}
        </div>
    )
}