"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import axios from "axios"
import { Filter, Search, Star } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

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
    }>
    reviews: Array<{
        userId: string
        comment: string
        rating: number
    }>
    availability?: Array<{
        date: string
        slots: string[]
    }>
}

export default function MentorsPage() {
    const searchParams = useSearchParams()
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([])
    const [loading, setLoading] = useState(true)

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
    const [expertiseFilter, setExpertiseFilter] = useState<string[]>([])
    const [ratingFilter, setRatingFilter] = useState<number>(0)
    const [priceRange, setPriceRange] = useState([0, 500])
    const [availabilityFilter, setAvailabilityFilter] = useState("")

    // Available expertise areas (will be populated from mentors data)
    const [expertiseOptions, setExpertiseOptions] = useState<string[]>([])


    useEffect(() => {
        fetchMentors()
    }, [])

    const fetchMentors = async () => {
        try {
            setLoading(true)
            const response = await axios.get("https://medical-backend-loj4.onrender.com/api/mentor")
            const mentorsData = response.data.data

            // Only show active mentors to users
            const activeMentors = mentorsData.filter((mentor: Mentor) => mentor.isActive)

            setMentors(activeMentors)
            setFilteredMentors(activeMentors)

            // Extract unique expertise areas for filter options
            const allExpertise = activeMentors.flatMap((mentor: Mentor) => mentor.expertise)
            const uniqueExpertise = [...new Set(allExpertise)]
            setExpertiseOptions(uniqueExpertise as string[])

            setLoading(false)
        } catch (error) {
            console.error("Error fetching mentors:", error)
            toast.error("Failed to load mentors")
            setLoading(false)
        }
    }

    // Apply filters whenever filter states change
    useEffect(() => {
        let filtered = [...mentors]

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (mentor) =>
                    mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    mentor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    mentor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    mentor.expertise.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())),
            )
        }

        // Expertise filter
        if (expertiseFilter.length > 0) {
            filtered = filtered.filter((mentor) => expertiseFilter.some((skill) => mentor.expertise.includes(skill)))
        }

        // Rating filter
        if (ratingFilter > 0) {
            filtered = filtered.filter((mentor) => mentor.rating >= ratingFilter)
        }

        // Availability filter
        if (availabilityFilter) {
            const today = new Date()
            const selectedDate = new Date(availabilityFilter)

            filtered = filtered.filter((mentor) =>
                mentor.availability?.some((avail) => {
                    const availDate = new Date(avail.date)
                    return (
                        availDate >= today &&
                        availDate.getDate() === selectedDate.getDate() &&
                        availDate.getMonth() === selectedDate.getMonth() &&
                        availDate.getFullYear() === selectedDate.getFullYear() &&
                        avail.slots.length > 0
                    )
                }),
            )
        }

        setFilteredMentors(filtered)
    }, [searchQuery, expertiseFilter, ratingFilter, availabilityFilter, mentors])

    const handleExpertiseFilterChange = (expertise: string) => {
        setExpertiseFilter((prev) => {
            if (prev.includes(expertise)) {
                return prev.filter((item) => item !== expertise)
            } else {
                return [...prev, expertise]
            }
        })
    }

    const resetFilters = () => {
        setSearchQuery("")
        setExpertiseFilter([])
        setRatingFilter(0)
        setPriceRange([0, 500])
        setAvailabilityFilter("")
        console.log(priceRange)
    }

    return (
        <div className="">
            <div className="">
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Find Your Mentor</h1>
                        <p className="text-muted-foreground mt-1">
                            Connect with industry experts who can help you grow professionally
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile filters */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="md:hidden">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                                <SheetHeader>
                                    <SheetTitle>Filter Mentors</SheetTitle>
                                    <SheetDescription>Narrow down mentors based on your preferences</SheetDescription>
                                </SheetHeader>
                                <div className="py-4 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium">Expertise</h3>
                                        <div className="space-y-2">
                                            {expertiseOptions.slice(0, 10).map((expertise) => (
                                                <div key={expertise} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`mobile-expertise-${expertise}`}
                                                        checked={expertiseFilter.includes(expertise)}
                                                        onCheckedChange={() => handleExpertiseFilterChange(expertise)}
                                                    />
                                                    <Label htmlFor={`mobile-expertise-${expertise}`}>{expertise}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium">Minimum Rating</h3>
                                        <div className="flex items-center space-x-2">
                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                <Button
                                                    key={rating}
                                                    variant={ratingFilter === rating ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setRatingFilter(rating === ratingFilter ? 0 : rating)}
                                                    className="w-9 h-9 p-0"
                                                >
                                                    {rating}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium">Availability</h3>
                                        <Input
                                            type="date"
                                            value={availabilityFilter}
                                            onChange={(e) => setAvailabilityFilter(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                        />
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button variant="outline" onClick={resetFilters}>
                                            Reset Filters
                                        </Button>
                                        <SheetClose asChild>
                                            <Button>Apply Filters</Button>
                                        </SheetClose>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Search input */}
                        <div className="relative flex-1 md:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search mentors..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Desktop filters sidebar */}
                    <div className="hidden md:block space-y-6">
                        <div>
                            <h3 className="font-medium mb-3">Expertise</h3>
                            <div className="space-y-2">
                                {expertiseOptions.slice(0, 10).map((expertise) => (
                                    <div key={expertise} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`expertise-${expertise}`}
                                            checked={expertiseFilter.includes(expertise)}
                                            onCheckedChange={() => handleExpertiseFilterChange(expertise)}
                                        />
                                        <Label htmlFor={`expertise-${expertise}`}>{expertise}</Label>
                                    </div>
                                ))}
                            </div>
                            {expertiseOptions.length > 10 && (
                                <Button variant="link" className="p-0 h-auto mt-1">
                                    Show more
                                </Button>
                            )}
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-medium mb-3">Minimum Rating</h3>
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <Button
                                        key={rating}
                                        variant={ratingFilter === rating ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setRatingFilter(rating === ratingFilter ? 0 : rating)}
                                        className="w-9 h-9 p-0"
                                    >
                                        {rating}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-medium mb-3">Availability</h3>
                            <Input
                                type="date"
                                value={availabilityFilter}
                                onChange={(e) => setAvailabilityFilter(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                            />
                        </div>

                        <Button variant="outline" onClick={resetFilters} className="w-full">
                            Reset Filters
                        </Button>
                    </div>

                    {/* Mentors grid */}
                    <div className="md:col-span-3">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-4">
                                                <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                                                <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                                                <div className="h-6 w-14 bg-muted animate-pulse rounded-full" />
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <div className="h-9 w-full bg-muted animate-pulse rounded" />
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredMentors.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-xl font-medium mb-2">No mentors found</h3>
                                <p className="text-muted-foreground mb-6">Try adjusting your filters or search for something else</p>
                                <Button onClick={resetFilters}>Reset All Filters</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredMentors.map((mentor) => (
                                    <Card key={mentor._id} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center space-x-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={mentor.avatar || "/placeholder.svg"} alt={mentor.name} />
                                                    <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-lg">{mentor.name}</CardTitle>
                                                    <CardDescription className="flex items-center">
                                                        {mentor.title} at {mentor.company}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center mb-2">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-4 w-4 ${star <= mentor.rating ? "text-primary fill-primary" : "text-muted-foreground"}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm ml-2">
                                                    {mentor.rating.toFixed(1)} ({mentor.reviews.length} reviews)
                                                </span>
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{mentor.bio}</p>

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {mentor.expertise.slice(0, 3).map((skill) => (
                                                    <Badge key={skill} variant="secondary" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {mentor.expertise.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{mentor.expertise.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Link href={`/dashboard/mentor/${mentor._id}`} className="w-full">
                                                <Button className="w-full">View Profile</Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

