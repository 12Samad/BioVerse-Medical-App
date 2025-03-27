"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { ArrowLeft, Plus, Star, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

// interface Mentor {
//     _id: string
//     userId: {
//         _id: string
//         name: string
//         email: string
//     }
//     name: string
//     avatar: string
//     title: string
//     company: string
//     bio: string
//     expertise: string[]
// }

export default function EditMentorPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    // Update the formData state to include all schema fields from the updated model
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        title: "",
        company: "",
        bio: "",
        avatar: "",
        expertise: [] as string[],
        newExpertise: "",
        rating: 0,
        totalSessions: 0,
        reviews: [] as Array<{
            userId: string
            comment: string
            rating: number
            createdAt?: string
        }>,
        availability: [] as { date: string; slots: string[] }[],
        newAvailabilityDate: "",
        newAvailabilitySlot: "",
        isActive: true,
        mentorships: [] as { title: string; description: string }[],
        newMentorshipTitle: "",
        newMentorshipDescription: "",
    })

    // Update the useEffect to populate all fields from the fetched mentor
    useEffect(() => {
        const fetchMentor = async () => {
            try {
                const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/mentor/${params.id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })

                const mentor = response.data.data
                setFormData({
                    name: mentor.name || "",
                    email: mentor.email || "",
                    title: mentor.title || "",
                    company: mentor.company || "",
                    bio: mentor.bio || "",
                    avatar: mentor.avatar || "",
                    expertise: mentor.expertise || [],
                    newExpertise: "",
                    rating: mentor.rating || 0,
                    totalSessions: mentor.totalSessions || 0,
                    reviews: mentor.reviews || [],
                    availability: mentor.availability || [],
                    newAvailabilityDate: "",
                    newAvailabilitySlot: "",
                    isActive: mentor.isActive !== undefined ? mentor.isActive : true,
                    mentorships: mentor.mentorships || [],
                    newMentorshipTitle: "",
                    newMentorshipDescription: "",
                })

                setLoading(false)
            } catch (error) {
                console.error("Error fetching mentor:", error)
                toast.error("Failed to load mentor details")
                router.push("/admin/mentor")
            }
        }

        if (params.id) {
            fetchMentor()
        }
    }, [params.id, router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleAddExpertise = () => {
        if (formData.newExpertise.trim() && !formData.expertise.includes(formData.newExpertise.trim())) {
            setFormData((prev) => ({
                ...prev,
                expertise: [...prev.expertise, prev.newExpertise.trim()],
                newExpertise: "",
            }))
        }
    }

    const handleRemoveExpertise = (skill: string) => {
        setFormData((prev) => ({
            ...prev,
            expertise: prev.expertise.filter((item) => item !== skill),
        }))
    }

    // Add functions to handle availability slots
    const handleAddAvailabilitySlot = () => {
        if (!formData.newAvailabilityDate || !formData.newAvailabilitySlot) return

        const existingDateIndex = formData.availability.findIndex((a) => a.date === formData.newAvailabilityDate)

        if (existingDateIndex >= 0) {
            // Add slot to existing date if not already present
            if (!formData.availability[existingDateIndex].slots.includes(formData.newAvailabilitySlot)) {
                const updatedAvailability = [...formData.availability]
                updatedAvailability[existingDateIndex].slots.push(formData.newAvailabilitySlot)

                setFormData((prev) => ({
                    ...prev,
                    availability: updatedAvailability,
                    newAvailabilitySlot: "",
                }))
            }
        } else {
            // Add new date with slot
            setFormData((prev) => ({
                ...prev,
                availability: [
                    ...prev.availability,
                    {
                        date: prev.newAvailabilityDate,
                        slots: [prev.newAvailabilitySlot],
                    },
                ],
                newAvailabilitySlot: "",
            }))
        }
    }

    const handleRemoveAvailabilitySlot = (date: string, slot: string) => {
        const updatedAvailability = formData.availability
            .map((a) => {
                if (a.date === date) {
                    return {
                        ...a,
                        slots: a.slots.filter((s) => s !== slot),
                    }
                }
                return a
            })
            .filter((a) => a.slots.length > 0) // Remove dates with no slots

        setFormData((prev) => ({
            ...prev,
            availability: updatedAvailability,
        }))
    }

    // Add functions to handle mentorships
    const handleAddMentorship = () => {
        if (formData.newMentorshipTitle.trim() && formData.newMentorshipDescription.trim()) {
            setFormData((prev) => ({
                ...prev,
                mentorships: [
                    ...prev.mentorships,
                    {
                        title: prev.newMentorshipTitle.trim(),
                        description: prev.newMentorshipDescription.trim(),
                    },
                ],
                newMentorshipTitle: "",
                newMentorshipDescription: "",
            }))
        }
    }

    const handleRemoveMentorship = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            mentorships: prev.mentorships.filter((_, i) => i !== index),
        }))
    }

    // Update the handleSubmit function to include all fields from the updated model
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            // Update mentor profile with all schema fields
            await axios.put(
                `https://medical-backend-loj4.onrender.com/api/mentor/${params.id}`,
                {
                    name: formData.name,
                    email: formData.email,
                    title: formData.title,
                    company: formData.company,
                    bio: formData.bio,
                    avatar: formData.avatar,
                    expertise: formData.expertise,
                    rating: formData.rating,
                    totalSessions: formData.totalSessions,
                    availability: formData.availability,
                    isActive: formData.isActive,
                    mentorships: formData.mentorships,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                },
            )

            toast.success("Mentor updated successfully")
            router.push(`/admin/mentor`)
        } catch (error) {
            console.error("Error updating mentor:", error)
            toast.error("Failed to update mentor")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Link href={`/admin/mentor/${params.id}`} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold">Edit Mentor</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Update the mentor&apos;s basic details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Optional - will update user account"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Senior Developer"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="e.g. Google"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="avatar">Avatar URL</Label>
                                <Input
                                    id="avatar"
                                    name="avatar"
                                    value={formData.avatar}
                                    onChange={handleChange}
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Professional Details</CardTitle>
                            <CardDescription>Update information about the mentor&apos;s expertise</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="A brief description of the mentor&apos;s background and experience"
                                    rows={5}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Areas of Expertise</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.expertise.map((skill) => (
                                        <div key={skill} className="flex items-center bg-muted rounded-full px-3 py-1 text-sm">
                                            <span>{skill}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 ml-1 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleRemoveExpertise(skill)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        id="newExpertise"
                                        name="newExpertise"
                                        value={formData.newExpertise}
                                        onChange={handleChange}
                                        placeholder="e.g. React, UX Design"
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddExpertise}
                                        disabled={!formData.newExpertise.trim()}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Rating (0-5)</Label>
                                    <Input
                                        id="rating"
                                        name="rating"
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={formData.rating}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="totalSessions">Total Sessions</Label>
                                    <Input
                                        id="totalSessions"
                                        name="totalSessions"
                                        type="number"
                                        min="0"
                                        value={formData.totalSessions}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Availability</CardTitle>
                            <CardDescription>Update the mentor&apos;s available time slots</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4 mb-4">
                                {formData.availability.map((avail) => (
                                    <div key={avail.date} className="border rounded-md p-3 w-full md:w-auto">
                                        <div className="font-medium mb-2">{new Date(avail.date).toLocaleDateString()}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {avail.slots.map((slot) => (
                                                <div
                                                    key={`${avail.date}-${slot}`}
                                                    className="flex items-center bg-muted rounded-full px-3 py-1 text-xs"
                                                >
                                                    <span>{slot}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 ml-1 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleRemoveAvailabilitySlot(avail.date, slot)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 md:col-span-1">
                                    <Label htmlFor="newAvailabilityDate">Date</Label>
                                    <Input
                                        id="newAvailabilityDate"
                                        name="newAvailabilityDate"
                                        type="date"
                                        value={formData.newAvailabilityDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-1">
                                    <Label htmlFor="newAvailabilitySlot">Time Slot</Label>
                                    <Input
                                        id="newAvailabilitySlot"
                                        name="newAvailabilitySlot"
                                        placeholder="e.g. 10:00 AM - 11:00 AM"
                                        value={formData.newAvailabilitySlot}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="flex items-end md:col-span-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleAddAvailabilitySlot}
                                        disabled={!formData.newAvailabilityDate || !formData.newAvailabilitySlot}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Time Slot
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Mentorships</CardTitle>
                            <CardDescription>Update mentorship offerings for this mentor</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4 mb-4">
                                {formData.mentorships.map((mentorship, index) => (
                                    <div key={index} className="border rounded-md p-3 w-full">
                                        <div className="flex justify-between">
                                            <h4 className="font-medium">{mentorship.title}</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleRemoveMentorship(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{mentorship.description}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newMentorshipTitle">Mentorship Title</Label>
                                    <Input
                                        id="newMentorshipTitle"
                                        name="newMentorshipTitle"
                                        value={formData.newMentorshipTitle}
                                        onChange={handleChange}
                                        placeholder="e.g. Frontend Development Coaching"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newMentorshipDescription">Description</Label>
                                    <Textarea
                                        id="newMentorshipDescription"
                                        name="newMentorshipDescription"
                                        value={formData.newMentorshipDescription}
                                        onChange={handleChange}
                                        placeholder="Describe what this mentorship offers"
                                        rows={3}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddMentorship}
                                    disabled={!formData.newMentorshipTitle.trim() || !formData.newMentorshipDescription.trim()}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Mentorship
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Reviews</CardTitle>
                            <CardDescription>View mentor reviews (read-only)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {formData.reviews.length === 0 ? (
                                <p className="text-muted-foreground">No reviews yet for this mentor.</p>
                            ) : (
                                <div className="space-y-4">
                                    {formData.reviews.map((review, index) => (
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
                                                                className={`h-4 w-4 ${star <= review.rating ? "text-primary fill-primary" : "text-muted-foreground"
                                                                    }`}
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
                </div>

                {/* Add Active Status toggle */}
                <div className="mt-4 flex items-center space-x-2">
                    <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked === true }))}
                    />
                    <Label htmlFor="isActive">Mentor is active and available for bookings</Label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => router.push(`/admin/mentor/${params.id}`)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

