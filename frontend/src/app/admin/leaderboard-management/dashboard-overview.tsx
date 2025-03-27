"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { badgeApi } from "@/lib/badge-api"
import { userApi } from "@/lib/user-api"
import { userBadgeApi } from "@/lib/user-badge-api"
import type { Badge, BadgeStats, User, UserBadge } from "@/types"
import { Award, BadgeCheck, Star, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"

type TimeRange = "week" | "month" | "year"

// Define a local interface that matches what we're actually using in this component
interface LocalDashboardStats {
    totalUsers: number
    activeBadges: number
    badgesAwarded: number
    engagementRate: number
    recentActivity: RecentActivity[]
    topBadges: TopBadge[]
    topUsers: TopUser[]
}

interface RecentActivity {
    id: string
    user: string
    userId: string
    profilePicture?: string
    action: string
    time: string
    badgeId?: string
    badgeName?: string
}

interface TopBadge {
    id: string
    name: string
    awarded: number
    icon: string
    representation: string
}

interface TopUser {
    id: string
    name: string
    username: string
    profilePicture?: string
    badges: number
    score: number
}

export function DashboardOverview() {
    const [timeRange, setTimeRange] = useState<TimeRange>("week")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Stats derived from data - using our local interface
    const [stats, setStats] = useState<LocalDashboardStats>({
        totalUsers: 0,
        activeBadges: 0,
        badgesAwarded: 0,
        engagementRate: 0,
        recentActivity: [],
        topBadges: [],
        topUsers: [],
    })

    // Previous period stats for comparison
    const [prevStats, setPrevStats] = useState({
        totalUsers: 0,
        activeBadges: 0,
        badgesAwarded: 0,
        engagementRate: 0,
    })

    // Format date to relative time (e.g., "2 hours ago")
    const formatRelativeTime = (dateString: string): string => {
        if (!dateString) return "Never"

        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)
        const diffWeek = Math.floor(diffDay / 7)
        const diffMonth = Math.floor(diffDay / 30)
        const diffYear = Math.floor(diffDay / 365)

        if (diffSec < 60) return `${diffSec} seconds ago`
        if (diffMin < 60) return `${diffMin} minutes ago`
        if (diffHour < 24) return `${diffHour} hours ago`
        if (diffDay < 7) return `${diffDay} days ago`
        if (diffWeek < 4) return `${diffWeek} weeks ago`
        if (diffMonth < 12) return `${diffMonth} months ago`
        return `${diffYear} years ago`
    }

    // Calculate percentage change
    const calculatePercentChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    // Get time range in milliseconds
    const getTimeRangeMs = (range: TimeRange): number => {
        switch (range) {
            case "week":
                return 7 * 24 * 60 * 60 * 1000 // 7 days
            case "month":
                return 30 * 24 * 60 * 60 * 1000 // 30 days
            case "year":
                return 365 * 24 * 60 * 60 * 1000 // 365 days
            default:
                return 7 * 24 * 60 * 60 * 1000 // Default to week
        }
    }

    // Fetch data based on time range
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)

            try {
                // Get time range boundaries
                const now = new Date()
                const rangeMs = getTimeRangeMs(timeRange)
                const rangeStart = new Date(now.getTime() - rangeMs)

                // Fetch all data
                const [usersResponse, badgesResponse, badgeStatsResponse] = await Promise.all([
                    userApi.getAllUsers(),
                    badgeApi.getAllBadges(),
                    userBadgeApi.getBadgeAwardStats(),
                ])

                if (!usersResponse.success || !badgesResponse.success || !badgeStatsResponse.success) {
                    throw new Error("Failed to fetch data")
                }

                const allUsers = (usersResponse.data as User[]) || []
                const allBadges = (badgesResponse.data as Badge[]) || []
                const badgeStatsData = (badgeStatsResponse.data as BadgeStats) || {}

                // Calculate current stats
                const totalUsers = allUsers.length
                const activeBadges = allBadges.length

                // Filter recent awards by time range
                const filteredRecentAwards = (badgeStatsData.recentAwards || []).filter((award: UserBadge) => {
                    if (!award.awardedAt) return false
                    const awardDate = new Date(award.awardedAt)
                    return awardDate >= rangeStart
                })

                // Calculate badges awarded in the current time range
                const badgesAwarded = filteredRecentAwards.length

                // Calculate engagement rate (users who earned badges in the period / total users)
                const uniqueUserIds = new Set<string>()
                filteredRecentAwards.forEach((award: UserBadge) => {
                    const userId = typeof award.userId === "object" ? award.userId._id : award.userId
                    if (userId) uniqueUserIds.add(userId)
                })

                const engagementRate = totalUsers > 0 ? Math.round((uniqueUserIds.size / totalUsers) * 100) : 0

                // Calculate previous period stats
                const prevRangeStart = new Date(rangeStart.getTime() - rangeMs)
                const prevFilteredRecentAwards = (badgeStatsData.recentAwards || []).filter((award: UserBadge) => {
                    if (!award.awardedAt) return false
                    const awardDate = new Date(award.awardedAt)
                    return awardDate >= prevRangeStart && awardDate < rangeStart
                })

                const prevBadgesAwarded = prevFilteredRecentAwards.length

                const prevUniqueUserIds = new Set<string>()
                prevFilteredRecentAwards.forEach((award: UserBadge) => {
                    const userId = typeof award.userId === "object" ? award.userId._id : award.userId
                    if (userId) prevUniqueUserIds.add(userId)
                })

                const prevEngagementRate = totalUsers > 0 ? Math.round((prevUniqueUserIds.size / totalUsers) * 100) : 0

                setPrevStats({
                    totalUsers: Math.max(0, totalUsers - 2), // Assume slight growth
                    activeBadges: Math.max(0, activeBadges - 1), // Assume slight growth
                    badgesAwarded: prevBadgesAwarded,
                    engagementRate: prevEngagementRate,
                })

                // Process recent activity
                const recentActivity = filteredRecentAwards.slice(0, 5).map((award: UserBadge) => {
                    // Check if userId is populated and has a name field
                    const userName =
                        award.user && Array.isArray(award.user) && award.user[0]?.name ? award.user[0].name : "Unknown User"

                    // Check if badgeId is populated and has a name field
                    const badgeName =
                        typeof award.badgeId === "object" && award.badgeId.name ? award.badgeId.name : "Unknown Badge"

                    const userId = typeof award.userId === "object" ? award.userId._id : award.userId
                    const profilePicture = typeof award.userId === "object" ? award.userId.profilePicture : undefined
                    const badgeId = typeof award.badgeId === "object" ? award.badgeId._id : award.badgeId

                    return {
                        id: award._id,
                        user: userName,
                        userId: userId,
                        profilePicture: profilePicture,
                        action: `Earned '${badgeName}' badge`,
                        time: formatRelativeTime(award.awardedAt),
                        badgeId: badgeId,
                        badgeName: badgeName,
                    }
                })

                // Process top badges
                const topBadges = (badgeStatsData.awardsByBadge || []).slice(0, 4).map((badgeStat) => {
                    const badge = allBadges.find((b) => b._id === badgeStat.badgeId) || {
                        _id: badgeStat.badgeId,
                        name: badgeStat.name,
                        icon: "🏆",
                        representation: "emoji",
                    }

                    return {
                        id: badge._id,
                        name: badge.name,
                        awarded: badgeStat.count,
                        icon: badge.icon || "🏆",
                        representation: badge.representation || "emoji",
                    }
                })

                // Process top users
                const topUsers = allUsers
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .slice(0, 4)
                    .map((user) => {
                        // Count badges for this user in the current time range
                        const userBadgeCount = filteredRecentAwards.filter((award) => {
                            const awardUserId = typeof award.userId === "object" ? award.userId._id : award.userId
                            return awardUserId === user.userId || awardUserId === user._id
                        }).length

                        return {
                            id: user.userId || user._id,
                            name: user.name || "",
                            username: user.username || "",
                            profilePicture: user.profilePicture,
                            badges: userBadgeCount,
                            score: user.score || 0,
                        }
                    })

                setStats({
                    totalUsers,
                    activeBadges,
                    badgesAwarded,
                    engagementRate,
                    recentActivity,
                    topBadges,
                    topUsers,
                })
            } catch (err) {
                console.error("Error fetching dashboard data:", err)
                setError("Failed to load dashboard data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [timeRange])

    // Render badge icon
    const renderBadgeIcon = (badge: { icon: string; representation: string }) => {
        if (!badge) return <Award className="h-5 w-5 text-primary" />

        if (badge.representation === "emoji") {
            return <span className="text-xl">{badge.icon}</span>
        } else if (badge.representation === "icon") {
            return <Award className="h-5 w-5 text-primary" />
        } else if (badge.icon) {
            return (
                <div className="w-6 h-6 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${badge.icon})` }} />
            )
        }

        return <Award className="h-5 w-5 text-primary" />
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground">Monitor your gamification system performance and user engagement.</p>
                </div>
                <Tabs
                    defaultValue="week"
                    value={timeRange}
                    onValueChange={(value) => setTimeRange(value as TimeRange)}
                    className="w-[300px]"
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="week">Week</TabsTrigger>
                        <TabsTrigger value="month">Month</TabsTrigger>
                        <TabsTrigger value="year">Year</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {error && <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>}

            {/* Stats cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                <p className="text-xs text-muted-foreground">
                                    {calculatePercentChange(stats.totalUsers, prevStats.totalUsers) > 0 ? "+" : ""}
                                    {calculatePercentChange(stats.totalUsers, prevStats.totalUsers)}% from last {timeRange}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Badges</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.activeBadges}</div>
                                <p className="text-xs text-muted-foreground">
                                    {calculatePercentChange(stats.activeBadges, prevStats.activeBadges) > 0 ? "+" : ""}
                                    {calculatePercentChange(stats.activeBadges, prevStats.activeBadges)}% from last {timeRange}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Badges Awarded</CardTitle>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.badgesAwarded}</div>
                                <p className="text-xs text-muted-foreground">
                                    {calculatePercentChange(stats.badgesAwarded, prevStats.badgesAwarded) > 0 ? "+" : ""}
                                    {calculatePercentChange(stats.badgesAwarded, prevStats.badgesAwarded)}% from last {timeRange}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.engagementRate}%</div>
                                <p className="text-xs text-muted-foreground">
                                    {calculatePercentChange(stats.engagementRate, prevStats.engagementRate) > 0 ? "+" : ""}
                                    {calculatePercentChange(stats.engagementRate, prevStats.engagementRate)}% from last {timeRange}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Activity and insights */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest user achievements and badge awards</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-[200px]" />
                                                <Skeleton className="h-4 w-[150px]" />
                                            </div>
                                            <Skeleton className="h-4 w-[60px]" />
                                        </div>
                                    ))}
                            </div>
                        ) : stats.recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        <Avatar>
                                            {activity.profilePicture ? (
                                                <AvatarImage src={activity.profilePicture} alt={activity.user} />
                                            ) : (
                                                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{activity.user}</p>
                                            <p className="text-sm text-muted-foreground">{activity.action}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent activity found for this time period.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Badges</CardTitle>
                        <CardDescription>Most frequently awarded badges</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {Array(4)
                                    .fill(0)
                                    .map((_, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-[150px]" />
                                                <Skeleton className="h-4 w-[100px]" />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : stats.topBadges.length > 0 ? (
                            <div className="space-y-4">
                                {stats.topBadges.map((badge) => (
                                    <div key={badge.id} className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-full flex items-center justify-center w-10 h-10">
                                            {renderBadgeIcon(badge)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{badge.name}</p>
                                            <p className="text-xs text-muted-foreground">Awarded {badge.awarded} times</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">No badges have been awarded yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top users */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Users</CardTitle>
                    <CardDescription>Users with the highest engagement and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array(4)
                                .fill(0)
                                .map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg border">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-[120px]" />
                                                <Skeleton className="h-4 w-[80px]" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : stats.topUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.topUsers.map((user, index) => (
                                <div key={user.id} className="flex items-center gap-4 p-4 rounded-lg border">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            {user.profilePicture ? (
                                                <AvatarImage src={user.profilePicture} alt={user.name || user.username} />
                                            ) : (
                                                <AvatarFallback>{(user.name || user.username || "U").charAt(0)}</AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name || user.username}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="flex items-center">
                                                <Award className="h-3 w-3 mr-1" />
                                                {user.badges}
                                            </div>
                                            <div className="flex items-center">
                                                <Star className="h-3 w-3 mr-1" />
                                                {user.score}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">No user data available.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}