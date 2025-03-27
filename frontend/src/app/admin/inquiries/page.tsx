"use client"

import { AxiosError } from "axios"
import { BarChart, CheckCircle, Clock, Loader2, MessageSquare, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllInquiries, getDashboardStats, updateInquiryStatus } from "@/lib/inquiries-api"
import type { Inquiry, InquiryStatus } from "@/lib/types/InquiryStatus"

export default function AdminDashboardPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        responseRate: 0,
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    // const [categoryFilter, setCategoryFilter] = useState<string>("all")

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const [inquiriesData, statsData] = await Promise.all([getAllInquiries(), getDashboardStats()])
                setInquiries(inquiriesData)
                setFilteredInquiries(inquiriesData)
                setStats(statsData)
            } catch (error: unknown) {
                console.error("Failed to fetch dashboard data:", error)
                if (error instanceof AxiosError && error.response?.data?.message) {
                    if (error instanceof AxiosError && error.response?.data?.message) {
                        toast.error(error.response.data.message || "Failed to load dashboard data")
                    } else {
                        toast.error("Failed to load dashboard data")
                    }
                } else {
                    toast.error("Failed to load dashboard data")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        let filtered = inquiries

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(
                (inquiry) =>
                    inquiry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inquiry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inquiry.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inquiry.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((inquiry) => inquiry.status === statusFilter)
        }

        // Apply category filter
        // if (categoryFilter !== "all") {
        //     filtered = filtered.filter((inquiry) => inquiry.category === categoryFilter)
        // }

        setFilteredInquiries(filtered)
    }, [searchQuery, statusFilter, inquiries])

    const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
        try {
            await updateInquiryStatus(inquiryId, newStatus)

            // Update local state
            setInquiries((prevInquiries) =>
                prevInquiries.map((inquiry) =>
                    inquiry._id === inquiryId || inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry,
                ),
            )

            toast.success(`Status updated to ${newStatus.replace("-", " ")}`)
        } catch (error: unknown) {
            console.error("Failed to update status:", error)
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || "Failed to update status")
            } else {
                toast.error("Failed to update status")
            }
        }
    }

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
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                <div className="container py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
                        <p className="text-muted-foreground mt-1">Manage and respond to student inquiries</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 10)}% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Open Inquiries</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.open}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.open > 0 ? `${Math.round((stats.open / stats.total) * 100)}% of total` : "No open inquiries"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                                <BarChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.inProgress}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.inProgress > 0
                                        ? `${Math.round((stats.inProgress / stats.total) * 100)}% of total`
                                        : "No inquiries in progress"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.responseRate}%</div>
                                <p className="text-xs text-muted-foreground">{stats.resolved} inquiries resolved</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                            <h2 className="text-xl font-semibold">Recent Inquiries</h2>
                            <div className="flex items-center gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px]">
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
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search inquiries..."
                                        className="pl-8 w-[200px] md:w-[300px]"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="all" className="mb-8">
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="open">Open</TabsTrigger>
                                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                            </TabsList>
                            <TabsContent value="all" className="mt-6">
                                <Card>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Title</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8">
                                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                            <p className="mt-2 text-sm text-muted-foreground">Loading inquiries...</p>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : filteredInquiries.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8">
                                                            No inquiries found. Try adjusting your filters.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredInquiries.slice(0, 10).map((inquiry) => (
                                                        <TableRow key={inquiry._id || inquiry.id}>
                                                            <TableCell className="font-medium">#{(inquiry._id || inquiry.id).slice(0, 8)}</TableCell>
                                                            <TableCell>
                                                                <Link
                                                                    href={`/admin/inquiries/${inquiry._id || inquiry.id}`}
                                                                    className="hover:underline"
                                                                >
                                                                    {inquiry.title}
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell>{inquiry.user?.name || "Unknown"}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{inquiry.category}</Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                                                                    {inquiry.status.replace("-", " ")}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
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
                                                                            <Link href={`/admin/inquiries/${inquiry._id || inquiry.id}`}>View Details</Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        {inquiry.status === "open" && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusChange(inquiry._id || inquiry.id, "in-progress")}
                                                                            >
                                                                                Mark as In Progress
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {inquiry.status === "in-progress" && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusChange(inquiry._id || inquiry.id, "resolved")}
                                                                            >
                                                                                Mark as Resolved
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {(inquiry.status === "resolved" || inquiry.status === "closed") && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleStatusChange(inquiry._id || inquiry.id, "open")}
                                                                            >
                                                                                Reopen Inquiry
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
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
                </div>
            </main>
        </div>
    )
}

