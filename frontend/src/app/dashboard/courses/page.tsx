"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

// import { MainNav } from "@/components/main-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
// import { UserNav } from "@/components/user-nav"
import { apiClient } from "@/lib/api"
import type { Course } from "@/types"
import Image from "next/image"

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [levelFilter, setLevelFilter] = useState("all")
    const [priceRange, setPriceRange] = useState([0, 1000])
    const [sourceFilter, setSourceFilter] = useState<string[]>([])

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true)
                const data = await apiClient.get<Course[]>("/courses")
                console.log(data)
                setCourses(data)
                setFilteredCourses(data)
            } catch (error) {
                console.error("Error fetching courses:", error)
                toast.error("Failed to load courses")
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [])

    useEffect(() => {
        let filtered = [...courses]

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (course) =>
                    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    course.description.toLowerCase().includes(searchQuery.toLowerCase()),
            )
        }

        // Apply category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter((course) => course.category === categoryFilter)
        }

        // Apply level filter
        if (levelFilter !== "all") {
            filtered = filtered.filter((course) => course.level === levelFilter)
        }

        // Apply price range filter
        filtered = filtered.filter((course) => course.price >= priceRange[0] && course.price <= priceRange[1])

        // Apply source filter
        if (sourceFilter.length > 0) {
            filtered = filtered.filter((course) => sourceFilter.includes(course.source))
        }

        setFilteredCourses(filtered)
    }, [searchQuery, categoryFilter, levelFilter, priceRange, sourceFilter, courses])

    const categories = ["Development", "Design", "Data Science", "Business", "Marketing"]
    const levels: Array<Course["level"]> = ["Beginner", "Intermediate", "Advanced"]
    const sources: Array<Course["source"]> = ["internal", "udemy", "coursera", "edx"]

    const handleSourceFilterChange = (source: string) => {
        setSourceFilter((prev) => {
            if (prev.includes(source)) {
                return prev.filter((s) => s !== source)
            } else {
                return [...prev, source]
            }
        })
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
                    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
                            <p className="text-muted-foreground">
                                Browse our collection of courses to accelerate your learning journey.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 gap-1">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        <span className="hidden sm:inline">Filters</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="sm:max-w-md">
                                    <SheetHeader>
                                        <SheetTitle>Filter Courses</SheetTitle>
                                        <SheetDescription>Narrow down courses based on your preferences.</SheetDescription>
                                    </SheetHeader>
                                    <div className="grid gap-6 py-6">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium">Category</h3>
                                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Categories</SelectItem>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category} value={category}>
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium">Level</h3>
                                            <Select value={levelFilter} onValueChange={setLevelFilter}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Levels</SelectItem>
                                                    {levels.map((level) => (
                                                        <SelectItem key={level} value={level}>
                                                            {level}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-medium">Price Range</h3>
                                            <Slider
                                                defaultValue={[0, 1000]}
                                                max={1000}
                                                step={10}
                                                value={priceRange}
                                                onValueChange={setPriceRange}
                                            />
                                            <div className="flex items-center justify-between">
                                                <span>${priceRange[0]}</span>
                                                <span>${priceRange[1]}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium">Source</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                {sources.map((source) => (
                                                    <div key={source} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`source-${source}`}
                                                            checked={sourceFilter.includes(source)}
                                                            onCheckedChange={() => handleSourceFilterChange(source)}
                                                        />
                                                        <Label htmlFor={`source-${source}`} className="capitalize">
                                                            {source}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setCategoryFilter("all")
                                                setLevelFilter("all")
                                                setPriceRange([0, 1000])
                                                setSourceFilter([])
                                            }}
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search courses..."
                                    className="w-full pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {loading ? (
                            Array(8)
                                .fill(0)
                                .map((_, i) => (
                                    <Card key={i} className="overflow-hidden">
                                        <CardHeader className="p-0">
                                            <Skeleton className="h-48 w-full rounded-none" />
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <Skeleton className="h-4 w-1/2 mb-2" />
                                            <Skeleton className="h-6 w-full mb-4" />
                                            <Skeleton className="h-4 w-full mb-2" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </CardContent>
                                        <CardFooter className="flex justify-between p-6 pt-0">
                                            <Skeleton className="h-4 w-1/4" />
                                            <Skeleton className="h-10 w-24" />
                                        </CardFooter>
                                    </Card>
                                ))
                        ) : filteredCourses.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-12">
                                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                                <p className="text-muted-foreground text-center mb-6">
                                    Try adjusting your filters or search query to find what you&apos;re looking for.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchQuery("")
                                        setCategoryFilter("all")
                                        setLevelFilter("all")
                                        setPriceRange([0, 1000])
                                        setSourceFilter([])
                                    }}
                                >
                                    Reset All Filters
                                </Button>
                            </div>
                        ) : (
                            filteredCourses.map((course) => (
                                <Card key={course._id} className="overflow-hidden flex flex-col">
                                    <CardHeader className="p-0">
                                        {typeof course.thumbnail === 'string' && course.thumbnail.startsWith('http') ? (
                                            <Image
                                                src={course.thumbnail}
                                                alt={course.title}
                                                width={384}
                                                height={192}
                                                className="h-48 w-full object-cover"
                                                onError={(e) => {
                                                    // Fall back to placeholder if image fails to load
                                                    e.currentTarget.src = "/placeholder.svg";
                                                }}
                                            />
                                        ) : (
                                            <div className="h-48 w-full bg-muted flex items-center justify-center">
                                                <span className="text-muted-foreground">No image available</span>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-6 flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge>{course.category}</Badge>
                                            <Badge variant="outline">{course.level}</Badge>
                                        </div>
                                        <CardTitle className="mb-2 line-clamp-1">{course.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 mb-2">{course.description}</CardDescription>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <span>Instructor: {course.instructor}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between p-6 pt-0 mt-auto">
                                        <div className="font-bold">${course.price.toFixed(2)}</div>
                                        <Link href={`/dashboard/courses/${course._id}`}>
                                            <Button size="sm">View Course</Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}