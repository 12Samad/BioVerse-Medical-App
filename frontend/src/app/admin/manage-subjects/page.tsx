"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com/api/test"

type Subject = {
    _id: string
    name: string
    count: number
    subsections: string[]
}

type Subsection = {
    _id: string
    name: string
    subject: string
    count: number
}

export default function ManagePage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [subsections, setSubsections] = useState<Subsection[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
    const [isSubsectionDialogOpen, setIsSubsectionDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null)
    const [newItemName, setNewItemName] = useState("")

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            const [subjectsRes, subsectionsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/subject`),
                axios.get(`${API_BASE_URL}/subsection`),
            ])
            setSubjects(subjectsRes.data.reverse())
            setSubsections(subsectionsRes.data)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to load data. Please try again: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to load data. Please try again ${(error as Error).message}`)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Subject CRUD operations
    const createSubject = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/subject`, { name: newItemName })
            setSubjects((prev) => [...prev, response.data])
            setIsSubjectDialogOpen(false)
            setNewItemName("")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to create subject: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to create subject ${(error as Error).message}`)
            }
        }
    }

    const updateSubject = async () => {
        if (!editingItem) return

        try {
            await axios.put(`${API_BASE_URL}/subject/${editingItem.id}`, {
                name: newItemName,
            })
            setSubjects((prev) =>
                prev.map((subject) => (subject._id === editingItem.id ? { ...subject, name: newItemName } : subject)),
            )
            toast.success("Subject updated successfully")
            setIsSubjectDialogOpen(false)
            setEditingItem(null)
            setNewItemName("")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to updated Subject: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to updated Subject ${(error as Error).message}`)
            }
        }
    }

    const deleteSubject = async (id: string) => {
        if (!confirm("Are you sure? This will delete all associated subsections and questions.")) return
        const toastId = toast.loading("Deleteting Subjects")
        try {
            await axios.delete(`${API_BASE_URL}/subject/${id}`)
            setSubjects((prev) => prev.filter((subject) => subject._id !== id))
            setSubsections((prev) => prev.filter((subsection) => subsection.subject !== id))
            toast.success("Subject deleted successfully", { id: toastId })
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to delete subject: ${error.response?.data?.message || error.message}`, { id: toastId })
            } else {
                toast.error(`Failed to delete subject ${(error as Error).message}`, { id: toastId })
            }
        }
    }

    // Subsection CRUD operations
    const createSubsection = async () => {
        if (!selectedSubject) return

        try {
            const response = await axios.post(`${API_BASE_URL}/subsection`, {
                name: newItemName,
                subject: selectedSubject._id,
            })
            setSubsections((prev) => [...prev, response.data])
            setSubjects((prev) =>
                prev.map((subject) =>
                    subject._id === selectedSubject._id
                        ? { ...subject, subsections: [...subject.subsections, response.data._id] }
                        : subject,
                ),
            )
            toast.success("Subsection created successfully")
            setIsSubsectionDialogOpen(false)
            setNewItemName("")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to create subsection: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to create subsection ${(error as Error).message}`)
            }
        }
    }

    const updateSubsection = async () => {
        if (!editingItem) return

        try {
            await axios.put(`${API_BASE_URL}/subsection/${editingItem.id}`, {
                name: newItemName,
            })
            setSubsections((prev) =>
                prev.map((subsection) =>
                    subsection._id === editingItem.id ? { ...subsection, name: newItemName } : subsection,
                ),
            )
            toast.success("Subsection updated successfully")
            setIsSubsectionDialogOpen(false)
            setEditingItem(null)
            setNewItemName("")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to update subsection: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to update subsection ${(error as Error).message}`)
            }
        }
    }

    const deleteSubsection = async (id: string) => {
        if (!confirm("Are you sure? This will delete all associated questions.")) return

        try {
            await axios.delete(`${API_BASE_URL}/subsection/${id}`)
            const subsection = subsections.find((s) => s._id === id)
            if (subsection) {
                setSubjects((prev) =>
                    prev.map((subject) =>
                        subject._id === subsection.subject
                            ? { ...subject, subsections: subject.subsections.filter((sid) => sid !== id) }
                            : subject,
                    ),
                )
            }
            setSubsections((prev) => prev.filter((subsection) => subsection._id !== id))
            toast.success("Subsection deleted successfully")
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(`Failed to delete subsection: ${error.response?.data?.message || error.message}`)
            } else {
                toast.error(`Failed to delete subsection ${(error as Error).message}`)
            }
        }
    }

    if (loading) {
        return (
            <div className="container py-6 space-y-4">
                <Skeleton className="h-8 w-[200px]" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-[200px]" />
                    <Skeleton className="h-[200px]" />
                </div>
            </div>
        )
    }

    return (
        <div className="container py-6 space-y-6">
            <Toaster position="top-right" />
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Manage Subjects & Subsections</h1>
                <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setEditingItem(null)
                                setNewItemName("")
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Subject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Subject" : "Add Subject"}</DialogTitle>
                            <DialogDescription>
                                {editingItem ? "Update the subject name below." : "Enter a name for the new subject below."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Enter subject name"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsSubjectDialogOpen(false)
                                    setEditingItem(null)
                                    setNewItemName("")
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={editingItem ? updateSubject : createSubject} disabled={!newItemName.trim()}>
                                {editingItem ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {subjects.map((subject) => (
                    <Card key={subject._id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{subject.name}</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            setEditingItem({ id: subject._id, name: subject.name })
                                            setNewItemName(subject.name)
                                            setIsSubjectDialogOpen(true)
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => deleteSubject(subject._id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardDescription>
                                {subject.count} questions across {subject.subsections.length} subsections
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Subsections</h3>
                                <Dialog open={isSubsectionDialogOpen} onOpenChange={setIsSubsectionDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedSubject(subject)
                                                setEditingItem(null)
                                                setNewItemName("")
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add Subsection
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{editingItem ? "Edit Subsection" : "Add Subsection"}</DialogTitle>
                                            <DialogDescription>
                                                {editingItem ? "Update the subsection name below." : `Add a new subsection to ${subject.name}.`}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    value={newItemName}
                                                    onChange={(e) => setNewItemName(e.target.value)}
                                                    placeholder="Enter subsection name"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsSubsectionDialogOpen(false)
                                                    setEditingItem(null)
                                                    setNewItemName("")
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={editingItem ? updateSubsection : createSubsection}
                                                disabled={!newItemName.trim()}
                                            >
                                                {editingItem ? "Update" : "Create"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="space-y-2">
                                {subsections
                                    .filter((subsection) => subsection.subject === subject._id)
                                    .map((subsection) => (
                                        <div key={subsection._id} className="flex items-center justify-between p-2 rounded-lg border">
                                            <div>
                                                <p className="font-medium">{subsection.name}</p>
                                                <p className="text-sm text-muted-foreground">{subsection.count} questions</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedSubject(subject)
                                                        setEditingItem({ id: subsection._id, name: subsection.name })
                                                        setNewItemName(subsection.name)
                                                        setIsSubsectionDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="icon" onClick={() => deleteSubsection(subsection._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

