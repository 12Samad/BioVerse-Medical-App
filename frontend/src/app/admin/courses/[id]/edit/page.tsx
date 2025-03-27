"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { ArrowLeft, Loader2, Plus, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast, Toaster } from "react-hot-toast"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Course } from "@/types"
import Image from "next/image"

const formSchema = z.object({
    title: z.string().min(5, {
        message: "Title must be at least 5 characters.",
    }),
    description: z.string().min(20, {
        message: "Description must be at least 20 characters.",
    }),
    category: z.string({
        required_error: "Please select a category.",
    }),
    instructor: z.string().min(2, {
        message: "Instructor name is required.",
    }),
    instructorBio: z.string().optional(),
    price: z.coerce.number().min(0, {
        message: "Price must be a positive number.",
    }),
    duration: z.string().min(2, {
        message: "Duration is required (e.g., '8 weeks').",
    }),
    level: z.string({
        required_error: "Please select a level.",
    }),
    featured: z.boolean().default(false),
    source: z.string({
        required_error: "Please select a source.",
    }),
    thumbnail: z.any().optional(),
    objectives: z.array(z.string()).min(1, {
        message: "Add at least one learning objective.",
    }),
    prerequisites: z.array(z.string()).optional(),
})

export default function EditCoursePage() {
    const params = useParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newObjective, setNewObjective] = useState("")
    const [newPrerequisite, setNewPrerequisite] = useState("")
    const [course, setCourse] = useState<Course | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            instructor: "",
            instructorBio: "",
            price: 0,
            duration: "",
            featured: false,
            objectives: [],
            prerequisites: [],
        },
    })

    const { watch, setValue, reset } = form
    const objectives = watch("objectives") || []
    const prerequisites = watch("prerequisites") || []

    // Fetch course data
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setIsLoading(true)

                // Get the auth token from localStorage
                const token = localStorage.getItem("token")
                if (!token) {
                    toast.error("Authentication token not found. Please log in again.")
                    router.push("/login")
                    return
                }

                const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/courses/${params.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (response.data.success) {
                    const data = response.data.data
                    setCourse(data)

                    // Reset form with course data
                    reset({
                        title: data.title,
                        description: data.description,
                        category: data.category,
                        instructor: data.instructor,
                        instructorBio: data.instructorBio || "",
                        price: data.price,
                        duration: data.duration,
                        level: data.level,
                        featured: data.featured,
                        source: data.source,
                        objectives: data.objectives || [],
                        prerequisites: data.prerequisites || [],
                    })
                } else {
                    throw new Error(response.data.error || "Failed to load course")
                }
            } catch (error) {
                console.error("Error fetching course:", error)
                toast.error("Failed to load course details")
                router.push("/admin/courses")
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchCourse()
        }
    }, [params.id, reset, router])

    const addObjective = () => {
        if (newObjective.trim()) {
            setValue("objectives", [...objectives, newObjective.trim()])
            setNewObjective("")
        }
    }

    const removeObjective = (index: number) => {
        setValue(
            "objectives",
            objectives.filter((_, i) => i !== index),
        )
    }

    const addPrerequisite = () => {
        if (newPrerequisite.trim()) {
            setValue("prerequisites", [...prerequisites, newPrerequisite.trim()])
            setNewPrerequisite("")
        }
    }

    const removePrerequisite = (index: number) => {
        setValue(
            "prerequisites",
            prerequisites.filter((_, i) => i !== index),
        )
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!course) return

        try {
            setIsSubmitting(true)

            // Get the auth token from localStorage
            const token = localStorage.getItem("token")
            if (!token) {
                toast.error("Authentication token not found. Please log in again.")
                router.push("/login")
                return
            }

            // Create a regular object for JSON submission
            const updateData: Record<string, string | number | boolean | string[]> = {}

            // Add all form fields to the object except thumbnail
            Object.entries(values).forEach(([key, value]) => {
                if (key !== "thumbnail") {
                    updateData[key] = value
                }
            })

            console.log("Update data prepared:", updateData)

            // Handle file upload if there is a new thumbnail
            if (values.thumbnail && values.thumbnail.length > 0) {
                const file = values.thumbnail[0]
                console.log("Preparing to upload file:", file.name, file.type, file.size)

                // Create FormData for the file upload
                const formData = new FormData()
                formData.append("thumbnail", file)

                // Add all other fields to FormData
                Object.entries(updateData).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        // Handle arrays by stringifying them
                        formData.append(key, JSON.stringify(value))
                    } else {
                        formData.append(key, String(value))
                    }
                })

                console.log("Sending update with new thumbnail...")

                // Send the update with the new file
                const response = await axios.put(`https://medical-backend-loj4.onrender.com/api/courses/${course._id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // Don't set Content-Type when using FormData - axios will set it with the boundary
                    },
                    timeout: 30000,
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
                        console.log(`Upload progress: ${percentCompleted}%`)
                    },
                })

                if (response.data.success) {
                    toast.success("Course updated successfully")
                    router.push("/admin/courses")
                } else {
                    throw new Error(response.data.error || "Failed to update course")
                }
            } else {
                // If no new file, use regular JSON for the update
                console.log("Sending update without changing thumbnail...")

                const response = await axios.put(`https://medical-backend-loj4.onrender.com/api/courses/${course._id}`, updateData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 30000,
                })

                if (response.data.success) {
                    toast.success("Course updated successfully")
                    router.push("/admin/courses")
                } else {
                    throw new Error(response.data.error || "Failed to update course")
                }
            }
        } catch (error) {
            console.error("Error updating course:", error)

            // Enhanced error handling with specific error messages
            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status
                const errorMessage = error.response?.data?.error || error.message

                console.error(`API Error (${statusCode}):`, errorMessage)

                if (statusCode === 401) {
                    toast.error("Your session has expired. Please log in again.")
                    router.push("/login")
                } else if (statusCode === 413) {
                    toast.error("The file you're uploading is too large.")
                } else if (statusCode === 400) {
                    toast.error(`Validation error: ${errorMessage}`)
                } else if (statusCode === 500) {
                    toast.error("Server error. Please try again later.")
                } else {
                    toast.error(`Error: ${errorMessage}`)
                }
            } else {
                toast.error("Failed to update course")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading course details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Course</h2>
                    <p className="text-muted-foreground">Update course information</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/courses">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Courses
                        </Button>
                    </Link>
                </div>
            </div>

            <Separator />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Course title" {...field} />
                                        </FormControl>
                                        <FormDescription>The title of your course.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Course description" className="min-h-[120px]" {...field} />
                                        </FormControl>
                                        <FormDescription>Detailed description of what the course covers.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Development">Development</SelectItem>
                                                    <SelectItem value="Design">Design</SelectItem>
                                                    <SelectItem value="Data Science">Data Science</SelectItem>
                                                    <SelectItem value="Business">Business</SelectItem>
                                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Level</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select level" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., 8 weeks" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="internal">Internal</SelectItem>
                                                <SelectItem value="udemy">Udemy</SelectItem>
                                                <SelectItem value="coursera">Coursera</SelectItem>
                                                <SelectItem value="edx">edX</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Where the course is hosted.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="featured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Featured Course</FormLabel>
                                            <FormDescription>This course will be displayed on the homepage.</FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="instructor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instructor</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Instructor name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="instructorBio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instructor Bio</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Instructor biography" className="min-h-[80px]" {...field} />
                                        </FormControl>
                                        <FormDescription>Brief biography of the instructor.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="thumbnail"
                                render={({ field: { onChange, ...field } }) => (
                                    <FormItem>
                                        <FormLabel>Thumbnail</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                {course?.thumbnail && (
                                                    <div className="relative w-full h-40 rounded-md overflow-hidden">
                                                        <Image
                                                            src={course.thumbnail || "/placeholder.svg"}
                                                            alt={course.title}
                                                            layout="fill"
                                                            objectFit="cover"
                                                        />
                                                        <p className="text-xs text-muted-foreground mt-1">Current thumbnail</p>
                                                    </div>
                                                )}
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const files = e.target.files
                                                        if (files?.length) {
                                                            onChange(files)
                                                            console.log("File selected:", files[0].name)
                                                        }
                                                    }}
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>Upload a new thumbnail image to replace the current one.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Card>
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="objectives"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Learning Objectives</FormLabel>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input
                                                        placeholder="Add a learning objective"
                                                        value={newObjective}
                                                        onChange={(e) => setNewObjective(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault()
                                                                addObjective()
                                                            }
                                                        }}
                                                    />
                                                    <Button type="button" onClick={addObjective} size="sm">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {objectives.map((objective, index) => (
                                                        <Badge key={index} variant="secondary" className="gap-1">
                                                            {objective}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 p-0 hover:bg-transparent"
                                                                onClick={() => removeObjective(index)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                                <span className="sr-only">Remove</span>
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <FormDescription className="mt-2">What students will learn from this course.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <FormField
                                        control={form.control}
                                        name="prerequisites"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Prerequisites (Optional)</FormLabel>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input
                                                        placeholder="Add a prerequisite"
                                                        value={newPrerequisite}
                                                        onChange={(e) => setNewPrerequisite(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault()
                                                                addPrerequisite()
                                                            }
                                                        }}
                                                    />
                                                    <Button type="button" onClick={addPrerequisite} size="sm">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {prerequisites.map((prerequisite, index) => (
                                                        <Badge key={index} variant="outline" className="gap-1">
                                                            {prerequisite}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 p-0 hover:bg-transparent"
                                                                onClick={() => removePrerequisite(index)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                                <span className="sr-only">Remove</span>
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <FormDescription className="mt-2">
                                                    Knowledge or skills required before taking this course.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin/courses")}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Form>
            <Toaster position="top-right" />
        </div>
    )
}

