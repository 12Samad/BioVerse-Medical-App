"use client"

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
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from "axios"
import {
    Award,
    BadgeCheck,
    Ban,
    FileBarChart,
    Mail,
    Medal,
    MoreHorizontal,
    Plus,
    Search,
    Star,
    Trophy,
    UserIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

// Define API response types
interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    errors?: string[]
    count?: number
    pagination?: {
        total: number
        perPage: number
        currentPage: number
        totalPages: number
    }
    hasBadge?: boolean
    badgeDetails?: Record<string, unknown>
}

// Define API error type
type ApiError = {
    response?: {
        data?: {
            error?: string
            message?: string
            errors?: string[]
        }
        status?: number
    }
}

// Define Badge type
interface BadgeType {
    _id: string
    name: string
    description: string
    icon?: string
    representation?: "emoji" | "icon" | "image"
    isActive?: boolean
    createdAt: string // Changed from string | undefined to string
    updatedAt?: string
}

// Define UserBadge type
interface UserBadge {
    _id: string
    userId: string
    badgeId: string | BadgeType
    awardedAt: string
    awardReason?: string
    awardedBy?: "system" | "admin"
    createdAt?: string
    updatedAt?: string
}

// Define UserWithBadges type
interface UserWithBadges {
    userId: string
    _id: string
    name?: string
    username?: string
    email?: string
    profilePicture?: string
    score?: number
    rank?: number
    quizzesTaken?: number
    totalTime?: number
    badges: BadgeType[]
    badgesEarned: number
    recentBadges: BadgeType[]
    createdAt?: string
    updatedAt?: string
}

// Define BadgeAssignmentFormData type
interface BadgeAssignmentFormData {
    userId: string
    badgeId: string
    awardReason?: string
}

// API services
const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api"

// Badge API service
const badgeApi = {
    getAllBadges: async (): Promise<ApiResponse<BadgeType[]>> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/badges`)
            return {
                success: response.data.success || true,
                data: response.data.data || response.data,
            }
        } catch (error: unknown) {
            console.error("Error fetching badges:", error)
            const apiError = error as ApiError
            return {
                success: false,
                error: apiError.response?.data?.error || "Failed to fetch badges",
            }
        }
    },
}

// User API service
const userApi = {
    getAllUsers: async (): Promise<ApiResponse<UserWithBadges[]>> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/user-badges/leaderboard-users`)
            return {
                success: true,
                data: response.data,
            }
        } catch (error: unknown) {
            const apiError = error as ApiError
            return {
                success: false,
                error: apiError.response?.data?.error || "Failed to fetch users",
            }
        }
    },
}

// User Badge API service
const userBadgeApi = {
    getUserBadges: async (userId: string): Promise<ApiResponse<UserBadge[]>> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/user-badges/getUserBadges/user/${userId}`)
            return {
                success: true,
                data: response.data.data,
                count: response.data.count,
            }
        } catch (error: unknown) {
            const apiError = error as ApiError
            return {
                success: false,
                error: apiError.response?.data?.error || "Failed to fetch user badges",
            }
        }
    },

    assignBadge: async (userId: string, badgeId: string, awardReason?: string): Promise<ApiResponse<UserBadge>> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/user-badges/assignBadge`, {
                userId,
                badgeId,
                awardReason,
            })
            return {
                success: true,
                data: response.data.data,
            }
        } catch (error: unknown) {
            const apiError = error as ApiError
            return {
                success: false,
                error: apiError.response?.data?.error || "Failed to assign badge",
            }
        }
    },

    revokeBadge: async (userBadgeId: string): Promise<ApiResponse> => {
        try {
            await axios.delete(`${API_BASE_URL}/user-badges/revokeBadge/user-badges/${userBadgeId}`)
            return {
                success: true,
            }
        } catch (error: unknown) {
            const apiError = error as ApiError
            return {
                success: false,
                error: apiError.response?.data?.error || "Failed to revoke badge",
            }
        }
    },

    checkUserBadge: async (userId: string, badgeId: string): Promise<ApiResponse> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/user-badges/checkUserBadge/${userId}/${badgeId}`)
            return {
                success: true,
                hasBadge: response.data.data.hasBadge,
                badgeDetails: response.data.data.badgeDetails,
            }
        } catch (error: unknown) {
            const apiError = error as ApiError
            return {
                success: false,
                error: apiError.response?.data?.error || "Failed to check badge status",
            }
        }
    },
}

export default function UserBadgeManagement() {
    // State for users and badges
    const [users, setUsers] = useState<UserWithBadges[]>([])
    const [badges, setBadges] = useState<BadgeType[]>([])
    const [userBadges, setUserBadges] = useState<Record<string, UserBadge[]>>({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // State for selected user and dialogs
    const [selectedUser, setSelectedUser] = useState<UserWithBadges | null>(null)
    const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
    const [isAssignBadgeOpen, setIsAssignBadgeOpen] = useState(false)
    const [badgeSearchTerm, setBadgeSearchTerm] = useState("")

    // State for badge assignment form
    const [assignmentForm, setAssignmentForm] = useState<BadgeAssignmentFormData>({
        userId: "",
        badgeId: "",
        awardReason: "",
    })

    // State for form errors
    const [formErrors, setFormErrors] = useState<string[]>([])

    // Fetch users and badges on component mount
    useEffect(() => {
        fetchData()
    }, [])

    // Fetch all necessary data
    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch users
            const usersResponse = await userApi.getAllUsers()
            if (!usersResponse.success) {
                toast.error(usersResponse.error || "Failed to fetch users")
                setLoading(false)
                return
            }

            // Fetch badges
            const badgesResponse = await badgeApi.getAllBadges()
            if (!badgesResponse.success) {
                toast.error(badgesResponse.error || "Failed to fetch badges")
                setLoading(false)
                return
            }

            // Ensure all badges have a createdAt property
            const activeBadges = (badgesResponse.data?.filter((badge) => badge.isActive !== false) || []).map((badge) => ({
                ...badge,
                createdAt: badge.createdAt || new Date().toISOString(), // Ensure createdAt is always present
            }))

            setBadges(activeBadges)

            // Process users and fetch their badges
            const usersData = usersResponse.data || []
            const processedUsers: UserWithBadges[] = []
            const userBadgesMap: Record<string, UserBadge[]> = {}

            // Fetch badges for each user
            for (const user of usersData) {
                try {
                    const userBadgesResponse = await userBadgeApi.getUserBadges(user.userId)

                    // Initialize with empty badges array even if the request fails
                    let userBadgesList: UserBadge[] = []
                    let userBadgeObjects: BadgeType[] = []

                    if (userBadgesResponse.success && userBadgesResponse.data) {
                        userBadgesList = userBadgesResponse.data || []
                        userBadgesMap[user.userId] = userBadgesList

                        // Extract badge objects from user badges
                        userBadgeObjects = userBadgesList
                            .map((ub) => {
                                if (typeof ub.badgeId === "string") {
                                    const foundBadge = activeBadges.find((b) => b._id === ub.badgeId)
                                    return foundBadge
                                } else {
                                    // Ensure badgeId object has createdAt
                                    const badgeObj = ub.badgeId as BadgeType
                                    return {
                                        ...badgeObj,
                                        createdAt: badgeObj.createdAt || new Date().toISOString(),
                                    }
                                }
                            })
                            .filter((badge): badge is BadgeType => badge !== undefined) // Type guard to ensure non-null
                    } else {
                        // If we fail to get badges, still add empty arrays
                        userBadgesMap[user.userId] = []
                    }

                    // Always add the user with whatever badges we found (or empty array)
                    processedUsers.push({
                        ...user,
                        _id: user.userId, // Ensure _id is set to userId for consistency
                        badges: userBadgeObjects,
                        badgesEarned: userBadgeObjects.length,
                        recentBadges: userBadgesList
                            .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime())
                            .slice(0, 3)
                            .map((ub) => {
                                if (typeof ub.badgeId === "string") {
                                    const foundBadge = activeBadges.find((b) => b._id === ub.badgeId)
                                    return foundBadge
                                        ? {
                                            ...foundBadge,
                                            createdAt: foundBadge.createdAt || new Date().toISOString(), // Ensure createdAt exists
                                        }
                                        : undefined
                                } else {
                                    // Ensure badgeId object has createdAt
                                    const badgeObj = ub.badgeId as BadgeType
                                    return {
                                        ...badgeObj,
                                        createdAt: badgeObj.createdAt || new Date().toISOString(),
                                    }
                                }
                            })
                            .filter((badge): badge is BadgeType => badge !== undefined), // Type guard to ensure non-null
                    })
                } catch (error) {
                    console.error(`Error fetching badges for user ${user.userId}:`, error)
                    // Still add the user even if there was an error
                    processedUsers.push({
                        ...user,
                        _id: user.userId,
                        badges: [],
                        badgesEarned: 0,
                        recentBadges: [],
                    })
                }
            }

            // Sort users by score in descending order and add rank
            const sortedUsers = [...processedUsers]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((user, index) => ({
                    ...user,
                    rank: index + 1,
                }))

            setUsers(sortedUsers)
            setUserBadges(userBadgesMap)
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("An error occurred while fetching data")
        } finally {
            setLoading(false)
        }
    }

    // Filter users based on search
    const filteredUsers = users.filter(
        (user) =>
            (user?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (user?.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (user?.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
    )

    // Filter badges based on search
    const filteredBadges = badges.filter((badge) => badge.name.toLowerCase().includes(badgeSearchTerm.toLowerCase()))

    // Format time (seconds) to minutes and seconds
    const formatTime = (totalTime = 0) => {
        const minutes = Math.floor(totalTime / 60)
        const seconds = totalTime % 60
        return `${minutes}m ${seconds}s`
    }

    // Format date to relative time (e.g., "2 hours ago")
    const formatRelativeTime = (dateString: string) => {
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

    // Validate badge assignment form
    const validateAssignmentForm = (data: BadgeAssignmentFormData): string[] => {
        const errors: string[] = []

        if (!data.userId) errors.push("User is required")
        if (!data.badgeId) errors.push("Badge is required")

        return errors
    }

    // Handle opening user details
    const handleViewUserDetails = (user: UserWithBadges): void => {
        setSelectedUser(user)
        setIsUserDetailsOpen(true)
    }

    // Handle opening badge assignment dialog
    const handleOpenAssignBadge = (user: UserWithBadges): void => {
        setSelectedUser(user)
        setAssignmentForm({
            userId: user.userId,
            badgeId: "",
            awardReason: "",
        })
        setFormErrors([])
        setIsAssignBadgeOpen(true)
    }

    // Handle assigning a badge to a user
    const handleAssignBadge = async (badgeId: string): Promise<void> => {
        if (!selectedUser) return

        // Update form data
        const formData: BadgeAssignmentFormData = {
            ...assignmentForm,
            badgeId,
        }

        // Validate form
        const errors = validateAssignmentForm(formData)
        if (errors.length > 0) {
            setFormErrors(errors)
            return
        }

        // Check if user already has this badge
        const userId = selectedUser.userId
        const hasBadgeResponse = await userBadgeApi.checkUserBadge(userId, badgeId)
        if (hasBadgeResponse.success && hasBadgeResponse.hasBadge) {
            toast.error("User already has this badge")
            return
        }

        // Assign badge
        const response = await userBadgeApi.assignBadge(userId, badgeId, formData.awardReason)

        if (response.success) {
            toast.success("Badge assigned successfully")

            // Find the badge object
            const badge = badges.find((b) => b._id === badgeId)

            if (badge) {
                // Update local state
                const updatedUsers = users.map((user) => {
                    if (user.userId === selectedUser.userId) {
                        // Update recent badges (add new badge to front, keep only 3)
                        const updatedRecentBadges = [badge, ...(user.recentBadges || [])].slice(0, 3)

                        return {
                            ...user,
                            badges: [...(user.badges || []), badge],
                            badgesEarned: (user.badgesEarned || 0) + 1,
                            recentBadges: updatedRecentBadges,
                        }
                    }
                    return user
                })

                setUsers(updatedUsers)
                setSelectedUser(updatedUsers.find((u): u is UserWithBadges => u.userId === selectedUser.userId) || null)

                // Update user badges map
                if (response.data) {
                    const updatedUserBadges: Record<string, UserBadge[]> = {
                        ...userBadges,
                        [userId]: [...(userBadges[userId] || []), response.data],
                    }
                    setUserBadges(updatedUserBadges)
                }
            }

            setIsAssignBadgeOpen(false)
        } else {
            toast.error(response.error || "Failed to assign badge")
        }
    }

    // Type guard to check if badgeId is a string or Badge object
    const isBadgeIdString = (badgeId: string | BadgeType): badgeId is string => {
        return typeof badgeId === "string"
    }

    // Type guard to check if badgeId is a Badge object
    const isBadgeObject = (badgeId: string | BadgeType): badgeId is BadgeType => {
        return typeof badgeId === "object" && badgeId !== null && "_id" in badgeId
    }

    // Handle removing a badge from a user
    const handleRevokeBadge = async (badge: BadgeType): Promise<void> => {
        if (!selectedUser) return

        // Find the user badge entry
        const userBadgeEntry = userBadges[selectedUser.userId]?.find((ub) => {
            if (isBadgeIdString(ub.badgeId)) {
                return ub.badgeId === badge._id
            } else if (isBadgeObject(ub.badgeId)) {
                return ub.badgeId._id === badge._id
            }
            return false
        })

        if (!userBadgeEntry) {
            toast.error("Badge assignment not found")
            return
        }

        // Confirm before revoking
        if (
            !window.confirm(
                `Are you sure you want to revoke the "${badge.name}" badge from ${selectedUser.name || selectedUser.username || "this user"}?`,
            )
        ) {
            return
        }

        // Revoke badge
        const response = await userBadgeApi.revokeBadge(userBadgeEntry._id)

        if (response.success) {
            toast.success("Badge revoked successfully")

            // Update local state
            const updatedUsers = users.map((user) => {
                if (user.userId === selectedUser.userId) {
                    // Remove badge from user's badges
                    const updatedBadges = (user.badges || []).filter((b) => b._id !== badge._id)

                    // Update recent badges - remove the revoked badge
                    const updatedRecentBadges = (user.recentBadges || []).filter((b) => b && b._id !== badge._id)

                    return {
                        ...user,
                        badges: updatedBadges,
                        badgesEarned: updatedBadges.length,
                        recentBadges: updatedRecentBadges,
                    }
                }
                return user
            })

            setUsers(updatedUsers)
            setSelectedUser(updatedUsers.find((u) => u.userId === selectedUser.userId) || null)

            // Update user badges map
            const updatedUserBadges = {
                ...userBadges,
                [selectedUser.userId]: (userBadges[selectedUser.userId] || []).filter((ub) => ub._id !== userBadgeEntry._id),
            }
            setUserBadges(updatedUserBadges)
        } else {
            toast.error(response.error || "Failed to revoke badge")
        }
    }

    // Render form errors
    const renderFormErrors = () => {
        if (formErrors.length === 0) return null

        return (
            <div className="bg-destructive/10 p-3 rounded-md mb-4">
                <p className="font-semibold text-destructive mb-1">Please fix the following errors:</p>
                <ul className="list-disc pl-5 text-sm text-destructive">
                    {formErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            </div>
        )
    }

    // Render badge icon
    const renderBadgeIcon = (badge: BadgeType | undefined) => {
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

    // Extract badge name safely from a UserBadge
    const getBadgeName = (userBadge: UserBadge): string => {
        if (isBadgeIdString(userBadge.badgeId)) {
            const foundBadge = badges.find((b) => b._id === userBadge.badgeId)
            return foundBadge?.name || "Unknown Badge"
        } else if (isBadgeObject(userBadge.badgeId)) {
            return userBadge.badgeId.name
        }
        return "Unknown Badge"
    }

    return (
        <>
            <Toaster position="top-right" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Badge Management</h1>
                    <p className="text-muted-foreground">Track user achievements and manage badge assignments.</p>
                </div>

                {/* Search and filters */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>
                            View and manage user progress and achievements. {filteredUsers.length} users found.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No users found. Try adjusting your search.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Badges</TableHead>
                                        <TableHead>Recent Badges</TableHead>
                                        <TableHead>Last Active</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.userId}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        {user?.profilePicture ? (
                                                            <AvatarImage src={user.profilePicture} alt={user.name || user.username || ""} />
                                                        ) : (
                                                            <AvatarFallback>{(user.name || user.username || "U").charAt(0)}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{user.name || user.username}</div>
                                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {user.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                                    {user.rank === 2 && <Medal className="h-4 w-4 text-gray-400" />}
                                                    {user.rank === 3 && <Award className="h-4 w-4 text-amber-600" />}
                                                    <span>#{user.rank}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Star className="h-4 w-4 text-primary" />
                                                    <span>{user.score || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                                    <span>{user.badgesEarned}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {user.recentBadges && user.recentBadges.length > 0 ? (
                                                        <TooltipProvider>
                                                            {user.recentBadges.map((badge, index) => (
                                                                <Tooltip key={index}>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="bg-primary/10 p-1 rounded-full flex items-center justify-center w-8 h-8">
                                                                            {renderBadgeIcon(badge)}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{badge.name}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            ))}
                                                        </TooltipProvider>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No badges</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.updatedAt ? formatRelativeTime(user.updatedAt) : "Never"}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleViewUserDetails(user)}>
                                                            <UserIcon className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenAssignBadge(user)}>
                                                            <Award className="mr-2 h-4 w-4" />
                                                            Assign Badge
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <FileBarChart className="mr-2 h-4 w-4" />
                                                            View Reports
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Contact User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Ban className="mr-2 h-4 w-4" />
                                                            Suspend User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* User details dialog */}
                <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                            <DialogDescription>Detailed information about the user progress and achievements.</DialogDescription>
                        </DialogHeader>

                        {selectedUser && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        {selectedUser?.profilePicture ? (
                                            <AvatarImage
                                                src={selectedUser.profilePicture}
                                                alt={selectedUser.name || selectedUser.username || ""}
                                            />
                                        ) : (
                                            <AvatarFallback className="text-xl">
                                                {(selectedUser.name || selectedUser.username || "U").charAt(0)}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedUser.name || selectedUser.username}</h3>
                                        <p className="text-muted-foreground">{selectedUser.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedUser.rank && (
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <Trophy className="h-3 w-3" />
                                                    Rank #{selectedUser.rank}
                                                </Badge>
                                            )}
                                            {selectedUser.score !== undefined && (
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <Star className="h-3 w-3" />
                                                    {selectedUser.score} points
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="p-4 flex flex-col items-center justify-center">
                                            <div className="text-muted-foreground text-sm mb-1">Quizzes Taken</div>
                                            <div className="text-2xl font-bold">{selectedUser?.quizzesTaken || 0}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 flex flex-col items-center justify-center">
                                            <div className="text-muted-foreground text-sm mb-1">Badges Earned</div>
                                            <div className="text-2xl font-bold">{selectedUser.badgesEarned}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 flex flex-col items-center justify-center">
                                            <div className="text-muted-foreground text-sm mb-1">Total Time</div>
                                            <div className="text-2xl font-bold">{formatTime(selectedUser?.totalTime)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 flex flex-col items-center justify-center">
                                            <div className="text-muted-foreground text-sm mb-1">Last Active</div>
                                            <div className="text-2xl font-bold">
                                                {selectedUser?.updatedAt ? formatRelativeTime(selectedUser.updatedAt) : "Never"}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Tabs defaultValue="badges">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="badges">Badges</TabsTrigger>
                                        <TabsTrigger value="activity">Activity</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="badges" className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-medium">Earned Badges</h4>
                                            <Button size="sm" variant="outline" onClick={() => handleOpenAssignBadge(selectedUser)}>
                                                <Plus className="mr-2 h-3 w-3" />
                                                Assign Badge
                                            </Button>
                                        </div>

                                        <ScrollArea className="h-[200px] rounded-md border p-4">
                                            {!selectedUser.badges || selectedUser.badges.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No badges earned yet. Assign a badge to get started.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {selectedUser.badges.map((badge) => (
                                                        <div
                                                            key={badge._id}
                                                            className="flex items-center justify-between gap-2 p-2 rounded-lg border"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-primary/10 p-2 rounded-full flex items-center justify-center w-10 h-10">
                                                                    {renderBadgeIcon(badge)}
                                                                </div>
                                                                <div className="text-sm font-medium">{badge.name}</div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleRevokeBadge(badge)}
                                                            >
                                                                <Ban className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </TabsContent>
                                    <TabsContent value="activity">
                                        <ScrollArea className="h-[200px] rounded-md border">
                                            <div className="p-4 space-y-4">
                                                {userBadges[selectedUser.userId]?.slice(0, 5).map((userBadge, index) => {
                                                    const badgeName = getBadgeName(userBadge)

                                                    return (
                                                        <div key={index} className="flex items-center gap-4 pb-4 border-b">
                                                            <div className="bg-primary/10 p-2 rounded-full">
                                                                <Award className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm">Earned the &quot;{badgeName}&quot; badge</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatRelativeTime(userBadge.awardedAt)}
                                                                </p>
                                                                {userBadge.awardReason && (
                                                                    <p className="text-xs italic mt-1">{userBadge.awardReason}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}

                                                {(!userBadges[selectedUser.userId] || userBadges[selectedUser.userId].length === 0) && (
                                                    <div className="text-center py-8 text-muted-foreground">No activity recorded yet.</div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Assign badge dialog */}
                <Dialog open={isAssignBadgeOpen} onOpenChange={setIsAssignBadgeOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Assign Badge</DialogTitle>
                            <DialogDescription>
                                Select a badge to assign to {selectedUser?.name || selectedUser?.username || "this user"}.
                            </DialogDescription>
                        </DialogHeader>

                        {renderFormErrors()}

                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search badges..."
                                        className="pl-8"
                                        value={badgeSearchTerm}
                                        onChange={(e) => setBadgeSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="award-reason" className="text-sm font-medium">
                                        Award Reason (Optional)
                                    </label>
                                    <Textarea
                                        id="award-reason"
                                        placeholder="Enter a reason for awarding this badge"
                                        value={assignmentForm.awardReason}
                                        onChange={(e) =>
                                            setAssignmentForm({
                                                ...assignmentForm,
                                                awardReason: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <ScrollArea className="h-[300px] rounded-md border p-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredBadges
                                            .filter((badge) => !selectedUser?.badges?.some((userBadge) => userBadge._id === badge._id))
                                            .map((badge) => (
                                                <Button
                                                    key={badge._id}
                                                    variant="outline"
                                                    className="justify-start h-auto p-3"
                                                    onClick={() => handleAssignBadge(badge._id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-full flex items-center justify-center w-10 h-10">
                                                            {renderBadgeIcon(badge)}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">{badge.name}</div>
                                                            <div className="text-xs text-muted-foreground">{badge.description}</div>
                                                        </div>
                                                    </div>
                                                </Button>
                                            ))}

                                        {filteredBadges.filter(
                                            (badge) => !selectedUser?.badges?.some((userBadge) => userBadge._id === badge._id),
                                        ).length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No badges available to assign. User has earned all available badges.
                                                </div>
                                            )}
                                    </div>
                                </ScrollArea>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAssignBadgeOpen(false)}>
                                        Cancel
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )
}

