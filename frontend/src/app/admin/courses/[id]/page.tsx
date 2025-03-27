"use client"

import {
    ArrowLeft,
    BarChart,
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit,
    Globe,
    Star,
    Trash,
    Users
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import type { Course } from "@/types"
import Image from "next/image"

export default function ViewCoursePage() {
    const params = useParams()
    const router = useRouter()
    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setIsLoading(true)
                const data = await apiClient.get<Course>(`/courses/${params.id}`)
                setCourse(data)
            } catch (error) {
                console.error("Error fetching course:", error)
                toast.error("Failed to load course details")
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchCourse()
        }
    }, [params.id])

    const handleDeleteCourse = async () => {
        if (!course) return

        try {
            setIsDeleting(true)
            await apiClient.delete(`/courses/${course._id}`)
            toast.success("Course deleted successfully")
            router.push("/admin/courses")
        } catch (error) {
            console.error("Error deleting course:", error)
            toast.error("Failed to delete course")
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p>Loading course details...</p>
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Course Not Found</h2>
                        <p className="text-muted-foreground">The course you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    </div>
                    <Link href="/admin/courses">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Courses
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
                    <p className="text-muted-foreground">View course details</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/courses">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Courses
                        </Button>
                    </Link>
                    <Link href={`/admin/courses/${course._id}/edit`}>
                        <Button variant="default">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Course
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main content - 2/3 width */}
                <div className="md:col-span-2 space-y-6">
                    {/* Course thumbnail */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                                <Image
                                    src={
                                        course.thumbnail || `/placeholder.svg?height=480&width=854&text=${encodeURIComponent(course.title)}`
                                    }
                                    alt={course.title}
                                    width={854}
                                    height={480}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Course description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-line">{course.description}</p>
                        </CardContent>
                    </Card>

                    {/* Course content tabs */}
                    <Tabs defaultValue="objectives">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
                            <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
                            <TabsTrigger value="instructor">Instructor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="objectives" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">What Students Will Learn</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {course.objectives?.map((objective, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{objective}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="prerequisites" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Course Prerequisites</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {course.prerequisites && course.prerequisites.length > 0 ? (
                                        <ul className="space-y-2">
                                            {course.prerequisites.map((prerequisite, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <span>{prerequisite}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground">No prerequisites specified for this course.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="instructor" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Instructor Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start gap-4">
                                        <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                            <Image
                                                src={`/placeholder.svg?height=64&width=64&text=${course.instructor.charAt(0)}`}
                                                alt={course.instructor}
                                                width={64}
                                                height={64}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{course.instructor}</h3>
                                            <p className="text-muted-foreground mt-1">
                                                {course.instructorBio || "No instructor biography provided."}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar - 1/3 width */}
                <div className="space-y-6">
                    {/* Course details card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                    <span>Price</span>
                                </div>
                                <span className="font-medium">${course.price.toFixed(2)}</span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <span>Duration</span>
                                </div>
                                <span className="font-medium">{course.duration}</span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart className="h-5 w-5 text-muted-foreground" />
                                    <span>Level</span>
                                </div>
                                <Badge variant="outline">{course.level}</Badge>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    <span>Category</span>
                                </div>
                                <Badge>{course.category}</Badge>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-muted-foreground" />
                                    <span>Source</span>
                                </div>
                                <Badge variant="outline" className="capitalize">
                                    {course.source}
                                </Badge>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-muted-foreground" />
                                    <span>Featured</span>
                                </div>
                                <Badge variant={course.featured ? "default" : "outline"}>{course.featured ? "Yes" : "No"}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Course stats card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                    <span>Enrollments</span>
                                </div>
                                <span className="font-medium">{course.enrollments.toLocaleString()}</span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-muted-foreground" />
                                    <span>Rating</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-medium mr-1">{course.rating.toFixed(1)}</span>
                                    <div className="flex">
                                        {Array(5)
                                            .fill(0)
                                            .map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i < Math.round(course.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                                                />
                                            ))}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <span>Created</span>
                                </div>
                                <span className="font-medium">{new Date(course.createdAt).toLocaleDateString()}</span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <span>Last Updated</span>
                                </div>
                                <span className="font-medium">{new Date(course.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions card
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href={`/admin/courses/${course._id}/edit`} className="w-full">
                                <Button className="w-full" variant="default">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Course
                                </Button>
                            </Link>

                            <Link href={`/courses/${course._id}`} target="_blank" className="w-full">
                                <Button className="w-full" variant="outline">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Public Page
                                </Button>
                            </Link>

                            <Button className="w-full" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Course
                            </Button>
                        </CardContent>
                    </Card> */}
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Course</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this course? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Category: {course.category} | Instructor: {course.instructor}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteCourse} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete Course"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

