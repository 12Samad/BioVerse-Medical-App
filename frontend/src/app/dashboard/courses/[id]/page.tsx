"use client"

import { loadStripe } from "@stripe/stripe-js"
import { ArrowLeft, BarChart, CheckCircle, Clock, Play, ShoppingCart, Users } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { MainNav } from "@/components/main-nav"
// import { UserNav } from "@/components/user-nav"
import { apiClient } from "@/lib/api"
import type { Course } from "@/types"
import Image from "next/image"

// Initialize Stripe
loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function CourseDetailPage() {
    const params = useParams()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [addingToCart, setAddingToCart] = useState(false)

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true)
                const data = await apiClient.get<Course>(`/courses/${params.id}`)
                setCourse(data)
            } catch (error) {
                console.error("Error fetching course:", error)
                toast.error("Failed to load course details")
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchCourse()
        }
    }, [params.id])

    const handleAddToCart = async () => {
        try {
            setAddingToCart(true)
            // Call API to add course to cart
            await apiClient.post("/cart", { courseId: course?._id })
            toast.success("Course added to cart")
        } catch (error) {
            console.log(error)
            toast.error("Failed to add course to cart")
        } finally {
            setAddingToCart(false)
        }
    }

    const handleBuyNow = async () => {
        if (!course) return

        try {
            setAddingToCart(true)

            // Create checkout session
            const session = await apiClient.post<{ sessionId: string; url: string }, { items: { type: string; id: string }[]; successUrl: string; cancelUrl: string }>("/payments/create-checkout-session", {
                items: [{ type: "course", id: course._id }],
                successUrl: `${window.location.origin}/dashboard?success=true`,
                cancelUrl: `${window.location.origin}/courses/${course._id}?canceled=true`,
            })

            // Redirect to checkout
            window.location.href = session.url
        } catch (error) {
            console.log(error)
            toast.error("Failed to process purchase")
            setAddingToCart(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col">
                {/* <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center">
                        <MainNav />
                        <div className="ml-auto flex items-center space-x-4">
                            <UserNav />
                        </div>
                    </div>
                </header> */}
                <main className="flex-1 py-6 md:py-10">
                    <div className="container">
                        <div className="mb-8">
                            <Link
                                href="/dashboard/courses"
                                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Courses
                            </Link>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            <div className="md:col-span-2 space-y-6">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-64 w-full" />
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                            <div>
                                <Skeleton className="h-96 w-full" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex min-h-screen flex-col">
                {/* <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center">
                        <MainNav />
                        <div className="ml-auto flex items-center space-x-4">
                            <UserNav />
                        </div>
                    </div>
                </header> */}
                <main className="flex-1 py-6 md:py-10">
                    <div className="container">
                        <div className="mb-8">
                            <Link
                                href="/dashboard/courses"
                                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Courses
                            </Link>
                        </div>
                        <div className="flex flex-col items-center justify-center py-12">
                            <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
                            <p className="text-muted-foreground mb-6">
                                The course you&apos;re looking for doesn&apos;t exist or has been removed.
                            </p>
                            <Link href="/dashboard/courses">
                                <Button>Browse Courses</Button>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            {/* <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center">
                    <MainNav />
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav />
                    </div>
                </div>
            </header> */}
            <main className="flex-1 py-6 md:py-10">
                <div className="container">
                    <div className="mb-8">
                        <Link
                            href="/dashboard/courses"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Courses
                        </Link>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                                <p className="text-muted-foreground mt-2">{course.description.split(".")[0]}.</p>
                            </div>

                            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
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

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <span>{course.duration}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BarChart className="h-5 w-5 text-muted-foreground" />
                                    <span>{course.level}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                    <span>{course.enrollments.toLocaleString()} students</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">
                                        {course.source}
                                    </Badge>
                                </div>
                            </div>

                            <Tabs defaultValue="overview">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    {/* <TabsTrigger value="curriculum">Curriculum</TabsTrigger> */}
                                    <TabsTrigger value="instructor">Instructor</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="space-y-4 pt-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">About This Course</h3>
                                        <p className="text-muted-foreground">{course.description}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">What You&apos;ll Learn</h3>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {course.objectives?.map((objective, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                                                    <span>{objective}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {course.prerequisites && course.prerequisites.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {course.prerequisites.map((prerequisite, index) => (
                                                    <li key={index}>{prerequisite}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="curriculum" className="space-y-4 pt-4">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Course Content</h3>
                                        <div className="space-y-4">
                                            {course.modules?.map((module, index) => (
                                                <div key={index} className="border rounded-lg overflow-hidden">
                                                    <div className="bg-muted p-4 font-medium">
                                                        {index + 1}. {module.title}
                                                    </div>
                                                    <ul className="divide-y">
                                                        {module.lessons.map((lesson, lessonIndex) => (
                                                            <li key={lessonIndex} className="p-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Play className="h-4 w-4 text-muted-foreground" />
                                                                    <span>{lesson}</span>
                                                                </div>
                                                                <Badge variant="outline">Preview</Badge>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="instructor" className="space-y-4 pt-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
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
                                            <p className="text-muted-foreground">
                                                {course.instructorBio || "Experienced instructor with expertise in this subject area."}
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div>
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle className="text-2xl">${course.price.toFixed(2)}</CardTitle>
                                    <CardDescription>One-time purchase, lifetime access</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button className="w-full gap-2" size="lg">
                                        Purchase Comming Soon
                                    </Button>
                                    <div className="hidden">
                                        <Button className="w-full gap-2" size="lg" onClick={handleBuyNow} disabled={addingToCart}>
                                            {addingToCart ? "Processing..." : "Buy Now"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            size="lg"
                                            onClick={handleAddToCart}
                                            disabled={addingToCart}
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h3 className="font-medium">This course includes:</h3>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                                                <span>{course.duration} of on-demand video</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                                                <span>Access on mobile and desktop</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                                                <span>Certificate of completion</span>
                                            </li>
                                        </ul>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-center">
                                    <Button variant="link" size="sm">
                                        30-Day Money-Back Guarantee
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

