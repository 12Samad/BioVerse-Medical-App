"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import axios from "axios"
import { Edit, MoreHorizontal, Plus, Search, Star, Trash } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

interface Mentor {
    _id: string
    userId: {
        _id: string
        name: string
        email: string
    }
    name: string
    avatar: string
    title: string
    company: string
    bio: string
    expertise: string[]
    rating: number
    totalSessions: number
    reviews: { reviewer: string; comment: string; rating: number }[]
}

export default function MentorsPage() {
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [mentorToDelete, setMentorToDelete] = useState<Mentor | null>(null)

    useEffect(() => {
        fetchMentors()
    }, [])

    const fetchMentors = async () => {
        try {
            const response = await axios.get("https://medical-backend-loj4.onrender.com/api/mentor", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            setMentors(response.data.data)
            setLoading(false)
        } catch (error) {
            console.error("Error fetching mentors:", error)
            toast.error("Failed to load mentors")
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Filter mentors client-side for demo purposes
        // In a real app, you might want to call the API with search params
    }

    const confirmDelete = (mentor: Mentor) => {
        setMentorToDelete(mentor)
        setDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!mentorToDelete) return

        try {
            await axios.delete(`https://medical-backend-loj4.onrender.com/api/mentor/${mentorToDelete._id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })

            toast.success("Mentor deleted successfully")
            setMentors(mentors.filter((mentor) => mentor._id !== mentorToDelete._id))
            setDeleteDialogOpen(false)
            setMentorToDelete(null)
        } catch (error) {
            console.error("Error deleting mentor:", error)
            toast.error("Failed to delete mentor")
        }
    }

    const filteredMentors = mentors.filter(
        (mentor) =>
            mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mentor.company.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Mentors</h1>
                <Link href="/admin/mentor/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Mentor
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="w-full md:w-auto flex gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search mentors..."
                            className="pl-8 w-full md:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
            </div>

            <div className="border rounded-md">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading mentors...</p>
                    </div>
                ) : filteredMentors?.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-muted-foreground">No mentors found</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mentor</TableHead>
                                <TableHead>Expertise</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Sessions</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMentors.map((mentor) => (
                                <TableRow key={mentor._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} />
                                                <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{mentor.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {mentor.title} at {mentor.company}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {mentor.expertise.slice(0, 2).map((skill, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {mentor.expertise?.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{mentor.expertise?.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Star className="h-4 w-4 text-primary fill-primary mr-1" />
                                            <span>{mentor.rating.toFixed(1)}</span>
                                            <span className="text-muted-foreground text-xs ml-1">({mentor.reviews?.length})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{mentor.totalSessions}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {/* <DropdownMenuItem asChild>
                                                    <Link href={`/admin/mentor/${mentor._id}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Link>
                                                </DropdownMenuItem> */}
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/mentor/${mentor._id}/edit`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => confirmDelete(mentor)}
                                                >
                                                    <Trash className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {mentorToDelete?.name}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

