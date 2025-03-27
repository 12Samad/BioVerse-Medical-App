"use client"

import { Filter, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserInquiries } from "@/lib/inquiries-api"
import type { Inquiry, InquiryStatus } from "@/lib/types/InquiryStatus"

export default function InquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                setIsLoading(true)
                const data = await getUserInquiries()
                setInquiries(data)
                setFilteredInquiries(data)
            } catch (error: unknown) {
                console.error("Failed to fetch inquiries:", error)
                if (error instanceof Error) {
                    toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to load inquiries")
                } else {
                    toast.error("Failed to load inquiries")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchInquiries()
    }, [])

    useEffect(() => {
        let filtered = inquiries

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (inquiry) =>
                    inquiry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inquiry.description.toLowerCase().includes(searchQuery.toLowerCase()),
            )
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((inquiry) => inquiry.status === statusFilter)
        }

        // Apply category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter((inquiry) => inquiry.category === categoryFilter)
        }

        setFilteredInquiries(filtered)
    }, [searchQuery, statusFilter, categoryFilter, inquiries])

    const getStatusBadgeVariant = (status: InquiryStatus) => {
        switch (status) {
            case "open":
                return "default"
            case "in-progress":
                return "secondary"
            case "resolved":
                return "destructive"
            case "closed":
                return "outline"
            default:
                return "default"
        }
    }

    return (
        <div className="w-full py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Inquiries</h1>
                    <p className="text-muted-foreground mt-1">View and manage all your submitted inquiries</p>
                </div>
                <Link href="/dashboard/inquiries/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Inquiry
                    </Button>
                </Link>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-[1fr_200px_200px]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search inquiries..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="all" className="mb-8">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="open">Open</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                    {isLoading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array(6)
                                .fill(0)
                                .map((_, i) => (
                                    <Card key={i}>
                                        <CardHeader className="pb-2">
                                            <Skeleton className="h-5 w-1/2 mb-1" />
                                            <Skeleton className="h-4 w-1/4" />
                                        </CardHeader>
                                        <CardContent>
                                            <Skeleton className="h-4 w-full mb-2" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </CardContent>
                                        <CardFooter>
                                            <Skeleton className="h-8 w-full" />
                                        </CardFooter>
                                    </Card>
                                ))}
                        </div>
                    ) : filteredInquiries.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium">No inquiries found</h3>
                            <p className="text-muted-foreground mt-1">Try adjusting your filters or create a new inquiry.</p>
                            <Link href="/dashboard/inquiries/new" className="mt-4 inline-block">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Inquiry
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredInquiries.map((inquiry) => (
                                <Link href={`/dashboard/inquiries/${inquiry._id || inquiry.id}`} key={inquiry._id || inquiry.id}>
                                    <Card className="h-full transition-all hover:border-primary hover:shadow-sm">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{inquiry.title}</CardTitle>
                                                <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                                                    {inquiry.status.replace("-", " ")}
                                                </Badge>
                                            </div>
                                            <CardDescription>{new Date(inquiry.createdAt).toLocaleDateString()}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="line-clamp-2 text-sm text-muted-foreground">{inquiry.description}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <div className="flex justify-between items-center w-full">
                                                <Badge variant="outline">{inquiry.category}</Badge>
                                                {inquiry.responseCount > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {inquiry.responseCount} response{inquiry.responseCount > 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="open" className="mt-6">
                    {/* Similar content as "all" but filtered for open inquiries */}
                </TabsContent>
                <TabsContent value="in-progress" className="mt-6">
                    {/* Similar content as "all" but filtered for in-progress inquiries */}
                </TabsContent>
                <TabsContent value="resolved" className="mt-6">
                    {/* Similar content as "all" but filtered for resolved inquiries */}
                </TabsContent>
            </Tabs>
        </div>
    )
}

