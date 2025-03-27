"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { badgeApi } from "@/lib/badge-api"
import type { Badge as BadgeType } from "@/types/badge"
import { Award, Edit, Eye, EyeOff, FileCode, Filter, ImageIcon, Plus, Search, Smile, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

// Badge representation options
const representationOptions = [
    { value: "emoji", label: "Emoji", icon: <Smile className="h-4 w-4" /> },
    { value: "icon", label: "Icon", icon: <FileCode className="h-4 w-4" /> },
    { value: "image", label: "Image", icon: <ImageIcon className="h-4 w-4" /> },
]

// Badge type options
const badgeTypeOptions = [
    { value: "achievement", label: "Achievement" },
    { value: "rank", label: "Rank" },
    { value: "improvement", label: "Improvement" },
    { value: "special", label: "Special" },
]

// Common emojis for badges
const commonEmojis = ["🏆", "⭐", "🥇", "🥈", "🥉", "🎯", "🎓", "🧠", "👑", "🌟", "💯", "🔥", "⚡", "🚀", "🌈", "🦸‍♂️"]

export function BadgeManagement() {
    const [badges, setBadges] = useState<BadgeType[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [filterStatus, setFilterStatus] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [currentBadge, setCurrentBadge] = useState<BadgeType | null>(null)
    const [newBadge, setNewBadge] = useState<Omit<BadgeType, "_id">>({
        name: "",
        description: "",
        type: "achievement",
        representation: "emoji",
        icon: "🏆",
        isActive: true,
        criteria: "",
    })
    const [formErrors, setFormErrors] = useState<string[]>([])

    // Fetch badges on component mount
    useEffect(() => {
        fetchBadges()
        setFilterStatus(true)
    }, [])

    // Fetch all badges
    const fetchBadges = async () => {
        try {
            setLoading(true)
            const response = await badgeApi.getAllBadges()
            console.log(response.data);
            if (response.success) {
                if (response.data) {
                    setBadges(response.data)
                }
            } else {
                toast.error(response.error || "Failed to fetch badges")
            }
        } catch (error) {
            console.error("Error fetching badges:", error)
            toast.error("An error occurred while fetching badges")
        } finally {
            setLoading(false)
        }
    }

    // Filter badges based on search and filters
    const filteredBadges = badges.filter((badge) => {
        const matchesSearch =
            badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            badge.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === "all" || badge.type === filterType
        const matchesStatus = filterStatus === true || badge.isActive === filterStatus

        return matchesSearch && matchesType && matchesStatus
    })

    // Validate badge data
    const validateBadgeData = (data: Omit<BadgeType, "_id">) => {
        const errors: string[] = []

        if (!data.name.trim()) errors.push("Badge name is required")
        else if (data.name.length > 50) errors.push("Badge name cannot exceed 50 characters")

        if (!data.description.trim()) errors.push("Description is required")
        else if (data.description.length > 200) errors.push("Description cannot exceed 200 characters")

        if (!data.criteria.trim()) errors.push("Earning criteria is required")

        if (!data.icon.trim()) errors.push("Badge icon is required")

        return errors
    }

    // Handle creating a new badge
    const handleCreateBadge = async () => {
        // Validate form data
        const errors = validateBadgeData(newBadge)
        if (errors.length > 0) {
            setFormErrors(errors)
            return
        }
        try {
            const response = await badgeApi.createBadge(newBadge)

            if (response.success) {
                if (response.data) {
                    setBadges([...badges, response.data])
                }
                setIsCreateDialogOpen(false)
                toast.success(`Badge "${newBadge.name}" created successfully`)
                resetNewBadgeForm()
                await fetchBadges()
            } else {
                toast.error(response.error || "Failed to create badge")
            }
        } catch (error) {
            console.error("Error creating badge:", error)
            toast.error("An error occurred while creating the badge")
        }
    }

    // Reset new badge form
    const resetNewBadgeForm = () => {
        setNewBadge({
            name: "",
            description: "",
            type: "achievement",
            representation: "emoji",
            icon: "🏆",
            isActive: true,
            criteria: "",
        })
        setFormErrors([])
    }

    // Handle editing a badge
    const handleEditBadge = (badge: BadgeType) => {
        setCurrentBadge(badge)
        setIsEditDialogOpen(true)
    }

    // Handle updating a badge
    const handleUpdateBadge = async () => {
        if (!currentBadge) return

        // Validate form data
        const errors = validateBadgeData(currentBadge)
        if (errors.length > 0) {
            setFormErrors(errors)
            return
        }

        try {
            const response = await badgeApi.updateBadge(currentBadge._id, currentBadge)
            if (response.success) {
                setBadges(badges.map((badge) => (badge._id === currentBadge._id && response.data ? response.data : badge)))
                setIsEditDialogOpen(false)
                toast.success(`Badge "${currentBadge.name}" updated successfully`)
                setFormErrors([])
            } else {
                if (response.errors) {
                    setFormErrors(response.errors)
                } else {
                    toast.error(response.error || "Failed to update badge")
                }
            }
        } catch (error) {
            console.error("Error updating badge:", error)
            toast.error("An error occurred while updating the badge")
        }
    }

    // Handle deleting a badge
    const handleDeleteBadge = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this badge?")) return

        try {
            const response = await badgeApi.deleteBadge(id)
            if (response.success) {
                setBadges(badges.filter((badge) => badge._id !== id))
                toast.success("Badge deleted successfully")
            } else {
                toast.error(response.error || "Failed to delete badge")
            }
        } catch (error) {
            console.error("Error deleting badge:", error)
            toast.error("An error occurred while deleting the badge")
        }
    }

    // Handle toggling badge status
    const handleToggleStatus = async (id: string, currentStatus: true | false) => {
        const newStatus = currentStatus === true ? false : true
        try {
            const response = await badgeApi.updateBadge(id, { isActive: newStatus })
            if (response.success) {
                setBadges(badges.map((badge) => (badge._id === id ? { ...badge, isActive: newStatus } : badge)))
                toast.success(`Badge ${newStatus === true ? "activated" : "deactivated"} successfully`)
            } else {
                toast.error(response.error || "Failed to update badge status")
            }
        } catch (error) {
            console.error("Error updating badge status:", error)
            toast.error("An error occurred while updating the badge status")
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

    return (
        <>
            <Toaster position="top-right" />

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Badge Management</h1>
                        <p className="text-muted-foreground">Create, edit, and manage badges for your gamification system.</p>
                    </div>
                    <Dialog
                        open={isCreateDialogOpen}
                        onOpenChange={(open) => {
                            setIsCreateDialogOpen(open)
                            if (!open) setFormErrors([])
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Badge
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Create New Badge</DialogTitle>
                                <DialogDescription>
                                    Design a new badge for your gamification system. Fill out the details below.
                                </DialogDescription>
                            </DialogHeader>

                            {renderFormErrors()}

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="badge-name">Badge Name*</Label>
                                        <Input
                                            id="badge-name"
                                            placeholder="e.g., First Quiz"
                                            value={newBadge.name}
                                            onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="badge-type">Badge Type*</Label>
                                        <Select
                                            value={newBadge.type}
                                            onValueChange={(value: "achievement" | "rank" | "improvement" | "special") =>
                                                setNewBadge({ ...newBadge, type: value })
                                            }
                                        >
                                            <SelectTrigger id="badge-type">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {badgeTypeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="badge-description">Description*</Label>
                                    <Textarea
                                        id="badge-description"
                                        placeholder="Describe what this badge represents and how to earn it"
                                        value={newBadge.description}
                                        onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="badge-criteria">Earning Criteria*</Label>
                                    <Textarea
                                        id="badge-criteria"
                                        placeholder="Specific conditions required to earn this badge"
                                        value={newBadge.criteria}
                                        onChange={(e) => setNewBadge({ ...newBadge, criteria: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label>Representation*</Label>
                                        <div className="flex gap-2">
                                            {representationOptions.map((option) => (
                                                <Button
                                                    key={option.value}
                                                    type="button"
                                                    variant={newBadge.representation === option.value ? "default" : "outline"}
                                                    className="flex-1"
                                                    onClick={() =>
                                                        setNewBadge({
                                                            ...newBadge,
                                                            representation: option.value as "emoji" | "icon" | "image",
                                                        })
                                                    }
                                                >
                                                    {option.icon}
                                                    <span className="ml-2">{option.label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Badge Icon/Image*</Label>
                                        {newBadge.representation === "emoji" && (
                                            <div className="grid grid-cols-8 gap-2">
                                                {commonEmojis.map((emoji) => (
                                                    <Button
                                                        key={emoji}
                                                        type="button"
                                                        variant={newBadge.icon === emoji ? "default" : "outline"}
                                                        className="h-10 w-10 p-0"
                                                        onClick={() => setNewBadge({ ...newBadge, icon: emoji })}
                                                    >
                                                        <span className="text-lg">{emoji}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        )}

                                        {newBadge.representation === "icon" && (
                                            <Select value={newBadge.icon} onValueChange={(value) => setNewBadge({ ...newBadge, icon: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select icon" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="award">Award</SelectItem>
                                                    <SelectItem value="star">Star</SelectItem>
                                                    <SelectItem value="trophy">Trophy</SelectItem>
                                                    <SelectItem value="medal">Medal</SelectItem>
                                                    <SelectItem value="crown">Crown</SelectItem>
                                                    <SelectItem value="timer">Timer</SelectItem>
                                                    <SelectItem value="target">Target</SelectItem>
                                                    <SelectItem value="brain">Brain</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {newBadge.representation === "image" && (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Image URL or path"
                                                    value={newBadge.icon}
                                                    onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                                                />
                                                <Button type="button" variant="outline" size="icon">
                                                    <ImageIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="badge-status"
                                        checked={newBadge.isActive === true}
                                        onCheckedChange={(checked) => setNewBadge({ ...newBadge, isActive: checked ? true : false })}
                                    />
                                    <Label htmlFor="badge-status">{newBadge.isActive === true ? true : false}</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateDialogOpen(false)
                                        setFormErrors([])
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateBadge}>Create Badge</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Badge Dialog */}
                    {currentBadge && (
                        <Dialog
                            open={isEditDialogOpen}
                            onOpenChange={(open) => {
                                setIsEditDialogOpen(open)
                                if (!open) setFormErrors([])
                            }}
                        >
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Edit Badge</DialogTitle>
                                    <DialogDescription>Update the details of this badge.</DialogDescription>
                                </DialogHeader>

                                {renderFormErrors()}

                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-badge-name">Badge Name*</Label>
                                            <Input
                                                id="edit-badge-name"
                                                placeholder="e.g., First Quiz"
                                                value={currentBadge.name}
                                                onChange={(e) => setCurrentBadge({ ...currentBadge, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-badge-type">Badge Type*</Label>
                                            <Select
                                                value={currentBadge.type}
                                                onValueChange={(value: "achievement" | "rank" | "improvement" | "special") =>
                                                    setCurrentBadge({ ...currentBadge, type: value })
                                                }
                                            >
                                                <SelectTrigger id="edit-badge-type">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {badgeTypeOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-badge-description">Description*</Label>
                                        <Textarea
                                            id="edit-badge-description"
                                            placeholder="Describe what this badge represents and how to earn it"
                                            value={currentBadge.description}
                                            onChange={(e) => setCurrentBadge({ ...currentBadge, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-badge-criteria">Earning Criteria*</Label>
                                        <Textarea
                                            id="edit-badge-criteria"
                                            placeholder="Specific conditions required to earn this badge"
                                            value={currentBadge.criteria}
                                            onChange={(e) => setCurrentBadge({ ...currentBadge, criteria: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label>Representation*</Label>
                                            <div className="flex gap-2">
                                                {representationOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        type="button"
                                                        variant={currentBadge.representation === option.value ? "default" : "outline"}
                                                        className="flex-1"
                                                        onClick={() =>
                                                            setCurrentBadge({
                                                                ...currentBadge,
                                                                representation: option.value as "emoji" | "icon" | "image",
                                                            })
                                                        }
                                                    >
                                                        {option.icon}
                                                        <span className="ml-2">{option.label}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Badge Icon/Image*</Label>
                                            {currentBadge.representation === "emoji" && (
                                                <div className="grid grid-cols-8 gap-2">
                                                    {commonEmojis.map((emoji) => (
                                                        <Button
                                                            key={emoji}
                                                            type="button"
                                                            variant={currentBadge.icon === emoji ? "default" : "outline"}
                                                            className="h-10 w-10 p-0"
                                                            onClick={() => setCurrentBadge({ ...currentBadge, icon: emoji })}
                                                        >
                                                            <span className="text-lg">{emoji}</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}

                                            {currentBadge.representation === "icon" && (
                                                <Select
                                                    value={currentBadge.icon}
                                                    onValueChange={(value) => setCurrentBadge({ ...currentBadge, icon: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select icon" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="award">Award</SelectItem>
                                                        <SelectItem value="star">Star</SelectItem>
                                                        <SelectItem value="trophy">Trophy</SelectItem>
                                                        <SelectItem value="medal">Medal</SelectItem>
                                                        <SelectItem value="crown">Crown</SelectItem>
                                                        <SelectItem value="timer">Timer</SelectItem>
                                                        <SelectItem value="target">Target</SelectItem>
                                                        <SelectItem value="brain">Brain</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            {currentBadge.representation === "image" && (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Image URL or path"
                                                        value={currentBadge.icon}
                                                        onChange={(e) => setCurrentBadge({ ...currentBadge, icon: e.target.value })}
                                                    />
                                                    <Button type="button" variant="outline" size="icon">
                                                        <ImageIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="edit-badge-status"
                                            checked={currentBadge.isActive === true}
                                            onCheckedChange={(checked) =>
                                                setCurrentBadge({ ...currentBadge, isActive: checked ? true : false })
                                            }
                                        />
                                        <Label htmlFor="edit-badge-status">{currentBadge.isActive === true ? true : false}</Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditDialogOpen(false)
                                            setFormErrors([])
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdateBadge}>Update Badge</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Filters and search */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search badges..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[160px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {badgeTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select> */}
                    </div>
                </div>

                {/* Badges table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Badges</CardTitle>
                        <CardDescription>Manage your gamification badges. {filteredBadges.length} badges found.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredBadges.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No badges found. Create your first badge to get started.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Badge</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Criteria</TableHead>
                                        <TableHead>Awarded</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBadges.map((badge) => (
                                        <TableRow key={badge._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 p-2 rounded-full flex items-center justify-center w-10 h-10">
                                                        {badge.representation === "emoji" ? (
                                                            <span className="text-xl">{badge.icon}</span>
                                                        ) : badge.representation === "icon" ? (
                                                            <Award className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <div
                                                                className="w-6 h-6 rounded-full bg-cover bg-center"
                                                                style={{ backgroundImage: `url(${badge.icon})` }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{badge.name}</div>
                                                        <div className="text-xs text-muted-foreground">{badge.description}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {badge.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate" title={badge.criteria}>
                                                    {badge.criteria}
                                                </div>
                                            </TableCell>
                                            <TableCell>{badge.awarded || 0}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${badge.isActive === true ? "bg-green-500" : "bg-gray-300"}`}
                                                    ></div>
                                                    <span className="capitalize">{badge?.isActive == true ? "Active" : "In Active"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggleStatus(badge._id, badge.isActive)}
                                                        title={badge.isActive === true ? "Deactivate badge" : "Activate badge"}
                                                    >
                                                        {badge.isActive === true ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Edit badge" onClick={() => handleEditBadge(badge)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteBadge(badge._id)}
                                                        title="Delete badge"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}