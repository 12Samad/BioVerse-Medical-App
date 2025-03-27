"use client"


import { ArrowLeft, Loader2, Paperclip } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Separator } from "@/components/ui/separator"
// import { Textarea } from "@/components/ui/textarea"
import { getInquiryById, updateInquiryStatus } from "@/lib/inquiries-api"
import type { Inquiry, InquiryStatus } from "@/lib/types/InquiryStatus"

export default function InquiryDetailPage() {
    const { id } = useParams()
    const [inquiry, setInquiry] = useState<Inquiry>()
    const [isLoading, setIsLoading] = useState(true)
    // const [response, setResponse] = useState("")
    // const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    useEffect(() => {
        const fetchInquiry = async () => {
            try {
                setIsLoading(true)
                const data = await getInquiryById(id as string)
                setInquiry(data)
            } catch (error: unknown) {
                console.error("Failed to fetch inquiry:", error)
                if (error instanceof Error) {
                    const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to load inquiry details";
                    toast.error(errorMessage)
                } else {
                    toast.error("Failed to load inquiry details")
                }
            } finally {
                setIsLoading(false)
            }
        }
        if (id) {
            fetchInquiry()
        }
    }, [id])

    // const handleSubmitResponse = async (e: React.FormEvent) => {
    //     e.preventDefault()
    //     if (!response.trim()) return

    //     setIsSubmitting(true)
    //     try {
    //         const newResponse = await addInquiryResponse(id as string, response)
    //         if (inquiry) {
    //             setInquiry({
    //                 ...inquiry,
    //                 responses: [...(inquiry.responses || []), newResponse],
    //             })
    //         }
    //         setResponse("")
    //         toast.success("Response added successfully")
    //     } catch (error: unknown) {
    //         console.error("Failed to add response:", error)
    //         if (error instanceof Error) {
    //             toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to add response")
    //         } else {
    //             toast.error("Failed to add response")
    //         }
    //     } finally {
    //         setIsSubmitting(false)
    //     }
    // }

    const handleStatusChange = async (newStatus: InquiryStatus) => {
        setIsUpdatingStatus(true)
        try {
            await updateInquiryStatus(id as string, newStatus)
            if (inquiry) {
                setInquiry({
                    ...inquiry,
                    status: newStatus,
                    id: inquiry.id || "", // Ensure id is always defined
                    _id: inquiry._id || "", // Ensure _id is always defined
                })
            }
            toast.success(`Status updated to ${newStatus.replace("-", " ")}`)
        } catch (error: unknown) {
            console.error("Failed to update status:", error)
            if (error instanceof Error) {
                toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update status")
            } else {
                toast.error("Failed to update status")
            }
        } finally {
            setIsUpdatingStatus(false)
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

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl py-10">
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (!inquiry) {
        return (
            <div className="container mx-auto max-w-4xl py-10">
                <div className="mb-8">
                    <Link href="/inquiries" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to inquiries
                    </Link>
                </div>
                <Card>
                    <CardContent className="py-12 text-center">
                        <h2 className="text-xl font-semibold mb-2">Inquiry not found</h2>
                        <p className="text-muted-foreground mb-6">
                            The inquiry you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
                        </p>
                        <Link href="/inquiries">
                            <Button>View All Inquiries</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full py-10">
            <div className="mb-8">
                <Link href="/inquiries" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to inquiries
                </Link>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl">{inquiry.title}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant={getStatusBadgeVariant(inquiry.status)}>{inquiry.status.replace("-", " ")}</Badge>
                                <Badge variant="outline">{inquiry.category}</Badge>
                                <span className="text-sm text-muted-foreground">
                                    Submitted on {new Date(inquiry.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdatingStatus}
                            onClick={() =>
                                handleStatusChange(inquiry.status === "open" || inquiry.status === "in-progress" ? "resolved" : "open")
                            }
                        >
                            {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {inquiry.status === "open" || inquiry.status === "in-progress" ? "Mark as Resolved" : "Reopen Inquiry"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={inquiry.user?.avatar || "/placeholder-user.jpg"} alt={inquiry.user?.name} />
                                <AvatarFallback>{inquiry.user?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">{inquiry.user?.name || "You"}</div>
                                    <div className="text-sm text-muted-foreground">{new Date(inquiry.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{inquiry.description}</div>
                                {inquiry.attachments && inquiry.attachments.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {inquiry.attachments.map((attachment, index) => (
                                                <a
                                                    href={`https://medical-backend-loj4.onrender.com/uploads/${attachment.filename}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    key={index}
                                                >
                                                    <Button variant="outline" size="sm" className="h-8">
                                                        <Paperclip className="mr-2 h-3.5 w-3.5" />
                                                        {attachment.filename}
                                                    </Button>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {inquiry.responses && inquiry.responses.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Responses</h3>
                    <div className="space-y-6">
                        {inquiry.responses.map((response, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={response.user?.avatar || "/placeholder-user.jpg"} alt={response.user?.name} />
                                    <AvatarFallback>{response.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium flex items-center gap-2">
                                            {response.user?.name}
                                            {response.user?.role === "admin" && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Admin
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{new Date(response.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">{response.content}</div>
                                    {response.attachments && response.attachments.length > 0 && (
                                        <div className="mt-2">
                                            <div className="flex flex-wrap gap-2">
                                                {response.attachments.map((attachment, idx) => (
                                                    <a
                                                        href={`https://medical-backend-loj4.onrender.com/uploads/${attachment.filename}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        key={idx}
                                                    >
                                                        <Button variant="outline" size="sm" className="h-8">
                                                            <Paperclip className="mr-2 h-3.5 w-3.5" />
                                                            {attachment.originalName || attachment.filename}
                                                        </Button>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* <div className="mb-4">
                <Separator className="my-6" />
                <h3 className="text-lg font-medium mb-4">Add Response</h3>
                <form onSubmit={handleSubmitResponse}>
                    <Textarea
                        placeholder="Type your response here..."
                        className="min-h-[120px] mb-4"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        disabled={isSubmitting || inquiry.status === "closed"}
                    />
                    <div className="flex justify-between items-center">
                        <Button type="button" variant="outline" className="gap-2">
                            <Paperclip className="h-4 w-4" />
                            Attach File
                        </Button>
                        <Button
                            type="submit"
                            className="gap-2"
                            disabled={isSubmitting || !response.trim() || inquiry.status === "closed"}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send Response
                        </Button>
                    </div>
                </form>
            </div> */}
        </div>
    )
}

