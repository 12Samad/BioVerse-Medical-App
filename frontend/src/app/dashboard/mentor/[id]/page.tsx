"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { Briefcase, Building, CalendarIcon, ChevronLeft, Star } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

// Update the Mentor interface to match the updated schema
interface Mentor {
    _id: string
    name: string
    email?: string
    avatar: string
    title: string
    company: string
    bio: string
    expertise: string[]
    rating: number
    totalSessions: number
    isActive: boolean
    mentorships: Array<{
        title: string
        description: string
        createdAt?: string
    }>
    reviews: Array<{
        userId: string
        comment: string
        rating: number
        createdAt?: string
    }>
    availability?: Array<{
        date: string
        slots: string[]
    }>
}

interface Mentorship {
    _id: string
    title: string
    description: string
    price: number
    duration: string
    category: string
    topics: string[]
    mentor: Mentor
}

export default function MentorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [mentor, setMentor] = useState<Mentor | null>(null)
    const [mentorships, setMentorships] = useState<Mentorship[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

    // Using useCallback to memoize the fetchMentor function
    const fetchMentor = useCallback(async (mentorId: string) => {
        try {
            setLoading(true)
            const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/mentor/${mentorId}`)
            const mentorData = response.data.data

            // Check if mentor is active
            if (!mentorData.isActive) {
                toast.error("This mentor is currently not available")
                router.push("/dashboard/mentor")
                return
            }

            setMentor(mentorData)

            // Use the mentorships directly from the mentor object
            setMentorships(mentorData.mentorships || [])

            setLoading(false)
        } catch (error) {
            console.error("Error fetching mentor:", error)
            toast.error("Failed to load mentor details")
            setLoading(false)
        }
    }, [router]) // Add router to the dependency array since it's used inside the callback

    useEffect(() => {
        if (params.id) {
            fetchMentor(params.id as string)
        }
    }, [params.id, fetchMentor]) // Added fetchMentor to the dependency array

    // Update available slots when date is selected
    useEffect(() => {
        if (!selectedDate || !mentor?.availability) return

        const formattedDate = selectedDate.toISOString().split("T")[0]
        const availabilityForDate = mentor.availability.find((a) => a.date === formattedDate)

        if (availabilityForDate) {
            setAvailableSlots(availabilityForDate.slots)
        } else {
            setAvailableSlots([])
        }

        setSelectedSlot(null)
    }, [selectedDate, mentor])

    const handleBookSession = useCallback((mentorId: string, mentorshipIndex: number) => {
        if (!selectedDate || !selectedSlot) {
            toast.error("Please select a date and time slot")
            return
        }

        setSelectedDate(undefined)

        // Navigate to booking page with selected mentor, mentorship index, date and time
        router.push(
            `/booking?mentor=${mentorId}&mentorship=${mentorshipIndex}&date=${selectedDate.toISOString().split("T")[0]}&time=${selectedSlot}`,
        )
    }, [router, selectedDate, selectedSlot]) // Add dependencies used inside the callback

    console.log(mentorships)
    if (loading) {
        return (
            <div className="container py-8">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    if (!mentor) {
        return (
            <div className="container py-8">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-2">Mentor Not Found</h2>
                    <p className="text-muted-foreground mb-6">The mentor you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                    <Link href="/dashboard/mentor">
                        <Button>Browse Mentors</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container py-8">
            <Link
                href="/dashboard/mentor"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Mentors
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Mentor Profile Sidebar */}
                <div className="md:col-span-1">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-4">
                                    <AvatarImage src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} />
                                    <AvatarFallback className="text-2xl">{mentor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-bold">{mentor.name}</h2>
                                <p className="text-muted-foreground mb-2">{mentor.title}</p>

                                <div className="flex items-center gap-1 mb-4">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-4 w-4 ${star <= mentor.rating ? "text-primary fill-primary" : "text-muted-foreground"}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm">
                                        {mentor.rating.toFixed(1)} ({mentor.reviews.length})
                                    </span>
                                </div>

                                <div className="w-full space-y-3 mt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        <span>{mentor.company}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <span>{mentor.totalSessions} sessions completed</span>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="w-full">
                                    <h3 className="text-sm font-medium mb-2 text-left">Expertise</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {mentor.expertise.map((skill, index) => (
                                            <Badge key={index} variant="secondary">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="about">
                        <TabsList className="mb-4">
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="mentorships">Mentorships</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                            <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        </TabsList>

                        <TabsContent value="about">
                            <Card>
                                <CardHeader>
                                    <CardTitle>About {mentor.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-line">{mentor.bio}</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="mentorships">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Available Mentorships</CardTitle>
                                    <CardDescription>Choose a mentorship program to book a session</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {mentor.mentorships.length === 0 ? (
                                        <p className="text-muted-foreground">No mentorships available from this mentor yet.</p>
                                    ) : (
                                        <div className="space-y-6">
                                            {mentor.mentorships.map((mentorship, index) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-medium text-lg">{mentorship.title}</h3>
                                                        </div>
                                                    </div>

                                                    <p className="text-muted-foreground mb-4">{mentorship.description}</p>

                                                    <Button
                                                        onClick={() => handleBookSession(mentor._id, index)}
                                                        disabled={!selectedDate || !selectedSlot}
                                                    >
                                                        Book This Mentorship
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="reviews">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reviews</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {mentor.reviews.length === 0 ? (
                                        <p className="text-muted-foreground">No reviews yet for this mentor.</p>
                                    ) : (
                                        <div className="space-y-6">
                                            {mentor.reviews.map((review, index) => (
                                                <div key={index} className="border-b pb-4 last:border-0">
                                                    <div className="flex items-start">
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-3">
                                                            {review.userId.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium">{review.userId}</h4>
                                                                {review.createdAt && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center my-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star
                                                                        key={star}
                                                                        className={`h-4 w-4 ${star <= review.rating ? "text-primary fill-primary" : "text-muted-foreground"}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <p className="text-muted-foreground mt-2">{review.comment}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="schedule">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Book a Session</CardTitle>
                                    <CardDescription>Select a date and time slot to book a session with {mentor.name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* <div>
                                            <h3 className="text-sm font-medium mb-2">Select a Date</h3>
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                disabled={(date) => {
                                                    // Disable dates that don't have availability
                                                    if (!mentor.availability) return true

                                                    const formattedDate = date.toISOString().split("T")[0]
                                                    return !mentor.availability.some((a) => a.date === formattedDate)
                                                }}
                                                className="rounded-md border"
                                            />
                                        </div> */}

                                        <div>
                                            <h3 className="text-sm font-medium mb-2">Available Time Slots</h3>
                                            {!selectedDate ? (
                                                <p className="text-muted-foreground">Please select a date first</p>
                                            ) : availableSlots.length === 0 ? (
                                                <p className="text-muted-foreground">No available slots for this date</p>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {availableSlots.map((slot) => (
                                                        <Button
                                                            key={slot}
                                                            variant={selectedSlot === slot ? "default" : "outline"}
                                                            className="justify-start"
                                                            onClick={() => setSelectedSlot(slot)}
                                                        >
                                                            {slot}
                                                        </Button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-6">
                                                <h3 className="text-sm font-medium mb-2">Selected Time</h3>
                                                {selectedSlot ? (
                                                    <div className="flex items-center p-3 border rounded-md">
                                                        <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                                                        <span>
                                                            {selectedDate?.toLocaleDateString()} at {selectedSlot}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-muted-foreground">No time slot selected</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            After selecting a date and time, choose a mentorship program from the &quot;Mentorships&quot; tab to
                                            complete your booking.
                                        </p>
                                        <Button
                                            onClick={() => (document.querySelector('[data-value="mentorships"]') as HTMLElement)?.click()}
                                            disabled={!selectedDate || !selectedSlot}
                                        >
                                            View Available Mentorships
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}