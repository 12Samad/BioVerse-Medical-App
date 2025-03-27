"use client"

import { Edit, Eye, MoreHorizontal, PlusCircle, Search, SlidersHorizontal, Trash } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

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
import { api } from "@/lib/api"
import { Course } from "@/types"

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
    const [deleteInProgress, setDeleteInProgress] = useState(false)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true)
                const response = await api.get("/courses")
                console.log(response.data.data)
                setCourses(Array.isArray(response.data.data) ? response.data.data : [])
                setLoading(false)
            } catch (error) {
                console.error("Error fetching courses:", error)
                toast.error("Failed to load courses")
            }
        }

        fetchCourses()
    }, [])

    const filteredCourses = courses?.filter(
        (course) =>
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.category.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const handleDeleteCourse = async () => {
        if (!courseToDelete) return

        try {
            setDeleteInProgress(true)
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Update local state
            setCourses((prevCourses) => prevCourses.filter((course) => course._id !== courseToDelete._id))

            toast.success("Course deleted successfully")
            setDeleteDialogOpen(false)
        } catch (error) {
            console.error("Error deleting course:", error)
            toast.error("Failed to delete course")
        } finally {
            setDeleteInProgress(false)
        }
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
                <div className="flex items-center gap-2">
                    <Link href="/admin/courses/create">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Course
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search courses..."
                        className="pl-8 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">Filter</span>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Featured</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Loading courses...
                                </TableCell>
                            </TableRow>
                        ) : filteredCourses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No courses found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCourses.map((course) => (
                                <TableRow key={course._id}>
                                    <TableCell className="font-medium">{course.title}</TableCell>
                                    <TableCell>{course.category}</TableCell>
                                    <TableCell>{course.instructor}</TableCell>
                                    <TableCell>${course.price.toFixed(2)}</TableCell>
                                    <TableCell>{course.level}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {course.source}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {course.featured ? <Badge>Featured</Badge> : <Badge variant="outline">No</Badge>}
                                    </TableCell>
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
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/courses/${course._id}`} className="cursor-pointer">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        <span>View</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/courses/${course._id}/edit`} className="cursor-pointer">
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        setCourseToDelete(course)
                                                        setDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Course</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this course? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {courseToDelete && (
                        <div className="py-4">
                            <h3 className="font-medium">{courseToDelete.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Category: {courseToDelete.category} | Instructor: {courseToDelete.instructor}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteCourse} disabled={deleteInProgress}>
                            {deleteInProgress ? "Deleting..." : "Delete Course"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

