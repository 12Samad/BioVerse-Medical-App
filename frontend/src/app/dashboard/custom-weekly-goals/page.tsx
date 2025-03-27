"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { BarChart2, Calendar, Clock, Edit, FileText, Plus, Star, Tag, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

// Types
interface Quest {
  _id: string
  userId: string
  studyId?: string
  title: string
  subject: string
  description: string
  category: "medication" | "exercise" | "diet" | "monitoring" | "assessment" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  targetHours: number
  completedHours: number
  startDate: string
  dueDate: string
  status: "pending" | "in_progress" | "completed" | "overdue" | "canceled"
  progress: number
  isCompleted: boolean
  completedAt?: string
  tags: string[]
  notes: {
    content: string
    createdAt: string
    updatedAt?: string
  }[]
  attachments: {
    type: "image" | "document" | "video" | "audio" | "other"
    url: string
    name: string
    size: number
    uploadedAt: string
  }[]
  timeRemaining?: number
  isOverdue?: boolean
  createdAt: string
  updatedAt: string
}

interface QuestStats {
  status: string
  count: number
  totalTargetHours: number
  totalCompletedHours: number
  completionRate: number
}

// New quest initial state
const initialNewQuest: Partial<Quest> = {
  title: "",
  subject: "",
  description: "",
  category: "other",
  priority: "medium",
  targetHours: 1,
  dueDate: "",
  tags: [],
}

const api = axios.create({
  baseURL: "https://medical-backend-loj4.onrender.com/api/",
  withCredentials: true,
})

// Validation functions
const validateQuest = (quest: Partial<Quest>) => {
  const errors: string[] = []

  if (!quest.title?.trim()) {
    errors.push("Title is required")
  } else if (quest.title.length < 2 || quest.title.length > 100) {
    errors.push("Title must be between 2 and 100 characters")
  }

  if (!quest.subject?.trim()) {
    errors.push("Subject is required")
  } else if (quest.subject.length < 2 || quest.subject.length > 100) {
    errors.push("Subject must be between 2 and 100 characters")
  }

  if (!quest.description?.trim()) {
    errors.push("Description is required")
  } else if (quest.description.length < 10 || quest.description.length > 1000) {
    errors.push("Description must be between 10 and 1000 characters")
  }

  if (!quest.targetHours || quest.targetHours < 0.25 || quest.targetHours > 168) {
    errors.push("Target hours must be between 0.25 and 168")
  }

  if (!quest.dueDate) {
    errors.push("Due date is required")
  } else if (new Date(quest.dueDate) <= new Date()) {
    errors.push("Due date must be in the future")
  }

  return errors
}

export default function StudyQuest() {
  const router = useRouter()
  const [quests, setQuests] = useState<Quest[]>([])
  const [newQuest, setNewQuest] = useState<Partial<Quest>>(initialNewQuest)
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<QuestStats[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [newNote, setNewNote] = useState("")
  const [newTag, setNewTag] = useState("")
  // const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)

  // Check for user authentication
  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem("Medical_User_Id")
      if (!userId) {
        toast.error("Please login to access Study Quest")
        router.push("/login") // Redirect to login page
      }
    }
    checkAuth()
  }, [router])

  const fetchQuests = useCallback(async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await api.get(`/quest?userId=${userId}`)

      if (response.data.success) {
        setQuests(response.data.data)
      } else {
        throw new Error(response.data.error || "Failed to fetch quests")
      }
    } catch (error) {
      console.error("Failed to fetch quests:", error)
      toast.error("Failed to fetch quests")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await api.get(`/quest/stats?userId=${userId}`)

      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }, [])

  useEffect(() => {
    fetchQuests()
    fetchStats()
  }, [fetchQuests, fetchStats])

  const addQuest = async () => {
    const errors = validateQuest(newQuest)
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
      return
    }

    try {
      setLoading(true)
      const userId = localStorage.getItem("Medical_User_Id")

      const questData = {
        ...newQuest,
        userId,
        startDate: new Date().toISOString(),
      }

      const response = await api.post("/quest", questData)

      if (response.data.success) {
        setQuests((prev) => [response.data.data, ...prev])
        setNewQuest(initialNewQuest)
        toast.success("Quest created successfully")
        fetchStats()
      } else {
        throw new Error(response.data.error || "Failed to create quest")
      }
    } catch (error) {
      console.error("Failed to create quest:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create quest")
    } finally {
      setLoading(false)
    }
  }

  const updateQuest = async (id: string, updates: Partial<Quest>) => {
    const quest = quests.find((q) => q._id === id)
    if (!quest) return

    // Optimistically update UI
    setQuests((prev) => prev.map((q) => (q._id === id ? { ...q, ...updates } : q)))

    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await api.patch(`/quest/${id}`, { ...updates, userId })

      if (!response.data.success) {
        // Revert on failure
        setQuests((prev) => prev.map((q) => (q._id === id ? quest : q)))
        throw new Error(
          Array.isArray(response.data.error) ? response.data.error[0] : response.data.error || "Failed to update quest",
        )
      } else {
        // Update with server response to ensure consistency
        setQuests((prev) => prev.map((q) => (q._id === id ? response.data.data : q)))
        fetchStats()
      }
    } catch (error) {
      console.error("Failed to update quest:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update quest")
    }
  }

  const deleteQuest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quest?")) {
      return
    }

    try {
      setLoading(true)
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await api.delete(`/quest/${id}?userId=${userId}`)

      if (response.data.success) {
        setQuests((prev) => prev.filter((quest) => quest._id !== id))
        toast.success("Quest deleted successfully")
        fetchStats()
      } else {
        throw new Error(response.data.error || "Failed to delete quest")
      }
    } catch (error) {
      console.error("Failed to delete quest:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete quest")
    } finally {
      setLoading(false)
    }
  }

  // const updateProgress = async (id: string, hours: number) => {
  //   const quest = quests.find((q) => q._id === id)
  //   if (!quest) return

  //   const newHours = Math.min(Math.max(0, hours), quest.targetHours)
  //   await updateQuest(id, { completedHours: newHours })
  // }

  const markAsComplete = async (id: string) => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await api.post(`/quest/${id}/complete`, { userId })

      if (response.data.success) {
        setQuests((prev) => prev.map((q) => (q._id === id ? response.data.data : q)))
        toast.success("Quest marked as complete")
        fetchStats()
      } else {
        throw new Error(response.data.error || "Failed to complete quest")
      }
    } catch (error) {
      console.error("Failed to complete quest:", error)
      toast.error(error instanceof Error ? error.message : "Failed to complete quest")
    }
  }

  const addNote = async (id: string, content: string) => {
    if (!content.trim()) {
      toast.error("Note content cannot be empty")
      return
    }

    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const response = await api.post(`/quest/${id}/notes`, { userId, content })

      if (response.data.success) {
        setQuests((prev) => prev.map((q) => (q._id === id ? response.data.data : q)))
        setNewNote("")
        toast.success("Note added successfully")
      } else {
        throw new Error(response.data.error || "Failed to add note")
      }
    } catch (error) {
      console.error("Failed to add note:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add note")
    }
  }

  const addTag = async (id: string, tag: string) => {
    if (!tag.trim()) {
      toast.error("Tag cannot be empty")
      return
    }

    const quest = quests.find((q) => q._id === id)
    if (!quest) return

    if (quest.tags.includes(tag)) {
      toast.error("Tag already exists")
      return
    }

    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const updatedTags = [...quest.tags, tag]
      const response = await api.patch(`/quest/${id}`, { userId, tags: updatedTags })

      if (response.data.success) {
        setQuests((prev) => prev.map((q) => (q._id === id ? response.data.data : q)))
        setNewTag("")
        toast.success("Tag added successfully")
      } else {
        throw new Error(response.data.error || "Failed to add tag")
      }
    } catch (error) {
      console.error("Failed to add tag:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add tag")
    }
  }

  const removeTag = async (id: string, tagToRemove: string) => {
    const quest = quests.find((q) => q._id === id)
    if (!quest) return

    try {
      const userId = localStorage.getItem("Medical_User_Id")
      const updatedTags = quest.tags.filter((tag) => tag !== tagToRemove)
      const response = await api.patch(`/quest/${id}`, { userId, tags: updatedTags })

      if (response.data.success) {
        setQuests((prev) => prev.map((q) => (q._id === id ? response.data.data : q)))
        toast.success("Tag removed successfully")
      } else {
        throw new Error(response.data.error || "Failed to remove tag")
      }
    } catch (error) {
      console.error("Failed to remove tag:", error)
      toast.error(error instanceof Error ? error.message : "Failed to remove tag")
    }
  }

  const filteredQuests = quests.filter((quest) => {
    if (activeTab === "all") return true
    if (activeTab === "completed") return quest.isCompleted
    if (activeTab === "active") return !quest.isCompleted
    if (activeTab === "overdue") return quest.isOverdue && !quest.isCompleted
    return true
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800"
      case "medium":
        return "bg-green-100 text-green-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "canceled":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medication":
        return "💊"
      case "exercise":
        return "🏃"
      case "diet":
        return "🍎"
      case "monitoring":
        return "📊"
      case "assessment":
        return "📝"
      default:
        return "📚"
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-8 bg-[#F3F4F6] max-h-[85dvh] overflow-auto">
      <h1 className="text-4xl font-bold text-center text-primary mb-8">Study Quest</h1>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>New Quest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Title"
              value={newQuest.title || ""}
              onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
              className="border-input"
            />
            <Input
              placeholder="Subject"
              value={newQuest.subject || ""}
              onChange={(e) => setNewQuest({ ...newQuest, subject: e.target.value })}
              className="border-input"
            />
          </div>
          <Textarea
            placeholder="Description"
            value={newQuest.description || ""}
            onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
            className="border-input"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newQuest.category}
                onValueChange={(value) => setNewQuest({ ...newQuest, category: value as Quest["category"] })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="diet">Diet</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newQuest.priority}
                onValueChange={(value) => setNewQuest({ ...newQuest, priority: value as Quest["priority"] })}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetHours">Target Hours</Label>
              <Input
                id="targetHours"
                type="number"
                placeholder="Target Hours"
                value={newQuest.targetHours || ""}
                onChange={(e) => setNewQuest({ ...newQuest, targetHours: Math.max(0.25, Number(e.target.value)) })}
                className="border-input"
                min="0.25"
                step="0.25"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newQuest.dueDate || ""}
                onChange={(e) => setNewQuest({ ...newQuest, dueDate: e.target.value })}
                className="border-input"
              />
            </div>
          </div>
          <Button
            onClick={addQuest}
            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 transition-colors flex items-center justify-center w-full"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Quest
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Quest Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center text-primary">
                <BarChart2 className="w-5 h-5 mr-2" />
                Total Quests
              </h3>
              <p className="text-3xl font-bold text-primary">{quests.length}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center text-green-600">
                <Star className="w-5 h-5 mr-2" />
                Completed
              </h3>
              <p className="text-3xl font-bold text-green-600">{quests.filter((q) => q.isCompleted).length}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center text-blue-600">
                <Clock className="w-5 h-5 mr-2" />
                In Progress
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {quests.filter((q) => q.status === "in_progress").length}
              </p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 flex items-center text-red-600">
                <Calendar className="w-5 h-5 mr-2" />
                Overdue
              </h3>
              <p className="text-3xl font-bold text-red-600">
                {quests.filter((q) => q.isOverdue && !q.isCompleted).length}
              </p>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Completion Statistics</h3>
              <div className="space-y-4">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="capitalize">{stat.status}</span>
                      <span>{stat.completionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stat.completionRate} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {stat.totalCompletedHours.toFixed(1)} / {stat.totalTargetHours.toFixed(1)} hours
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Quests</CardTitle>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No quests found. Create a new quest to get started!
            </div>
          ) : (
            filteredQuests.map((quest) => (
              <div key={quest._id} className="border rounded-lg p-4 shadow-sm">
                {editingQuest?._id === quest._id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        value={editingQuest.title}
                        onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
                        className="border-input"
                      />
                      <Input
                        value={editingQuest.subject}
                        onChange={(e) => setEditingQuest({ ...editingQuest, subject: e.target.value })}
                        className="border-input"
                      />
                    </div>
                    <Textarea
                      value={editingQuest.description}
                      onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
                      className="border-input"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-category">Category</Label>
                        <Select
                          value={editingQuest.category}
                          onValueChange={(value) =>
                            setEditingQuest({ ...editingQuest, category: value as Quest["category"] })
                          }
                        >
                          <SelectTrigger id="edit-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="exercise">Exercise</SelectItem>
                            <SelectItem value="diet">Diet</SelectItem>
                            <SelectItem value="monitoring">Monitoring</SelectItem>
                            <SelectItem value="assessment">Assessment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-priority">Priority</Label>
                        <Select
                          value={editingQuest.priority}
                          onValueChange={(value) =>
                            setEditingQuest({ ...editingQuest, priority: value as Quest["priority"] })
                          }
                        >
                          <SelectTrigger id="edit-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="number"
                        value={editingQuest.targetHours}
                        onChange={(e) =>
                          setEditingQuest({ ...editingQuest, targetHours: Math.max(0.25, Number(e.target.value)) })
                        }
                        className="border-input"
                        min="0.25"
                        step="0.25"
                      />
                      <Input
                        type="date"
                        value={editingQuest.dueDate.split("T")[0]}
                        onChange={(e) => setEditingQuest({ ...editingQuest, dueDate: e.target.value })}
                        className="border-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const errors = validateQuest(editingQuest)
                          if (errors.length > 0) {
                            errors.forEach((error) => toast.error(error))
                            return
                          }
                          updateQuest(quest._id, editingQuest)
                          setEditingQuest(null)
                        }}
                        disabled={loading}
                      >
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingQuest(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCategoryIcon(quest.category)}</span>
                          <h3 className="text-xl font-semibold">{quest.title}</h3>
                        </div>
                        <div className="text-sm text-muted-foreground">{quest.subject}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getPriorityColor(quest.priority)}>{quest.priority}</Badge>
                        <Badge className={getStatusColor(quest.status)}>{quest.status.replace("_", " ")}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingQuest(quest)}
                          className="text-muted-foreground hover:text-primary"
                          disabled={loading || quest.isCompleted}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuest(quest._id)}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{quest.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {quest.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                          {!quest.isCompleted && (
                            <button
                              onClick={() => removeTag(quest._id, tag)}
                              className="ml-1 text-xs hover:text-destructive"
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                      ))}

                      {!quest.isCompleted && (
                        <div className="flex items-center gap-1">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            className="h-8 w-24 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addTag(quest._id, newTag)
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addTag(quest._id, newTag)}
                            className="h-8 text-xs"
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {!quest.isCompleted ? (
                        <>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-muted-foreground">
                                {quest.completedHours} / {quest.targetHours}h ({quest.progress}%)
                              </span>
                            </div>
                            <Progress value={quest.progress} className="h-2" />

                            {/* <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateProgress(quest._id, quest.completedHours - 0.25)}
                                disabled={quest.completedHours <= 0 || loading}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={quest.completedHours}
                                onChange={(e) => updateProgress(quest._id, Number(e.target.value))}
                                className="h-8"
                                min="0"
                                max={quest.targetHours}
                                step="0.25"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateProgress(quest._id, quest.completedHours + 0.25)}
                                disabled={quest.completedHours >= quest.targetHours || loading}
                              >
                                +
                              </Button>
                            </div> */}
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                Started: {new Date(quest.startDate).toLocaleDateString()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Due: {new Date(quest.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <Button onClick={() => markAsComplete(quest._id)} disabled={loading}>
                              Mark as Complete
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg">
                          <div className="flex flex-col gap-2">
                            <span className="text-sm text-muted-foreground">
                              Completed on: {new Date(quest.completedAt || "").toLocaleDateString()}
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              Total Hours: {quest.targetHours}h
                            </span>
                          </div>
                          <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                      )}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="mt-4 w-full flex items-center gap-2"
                        // onClick={() => setSelectedQuest(quest)}
                        >
                          <FileText className="w-4 h-4" />
                          View Notes ({quest.notes?.length || 0})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Notes for {quest.title}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto">
                          {quest.notes && quest.notes.length > 0 ? (
                            <div className="space-y-4 mt-4">
                              {quest.notes.map((note, index) => (
                                <div key={index} className="p-3 bg-muted rounded-md">
                                  <p>{note.content}</p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(note.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center py-4 text-muted-foreground">No notes yet</p>
                          )}
                        </div>

                        {!quest.isCompleted && (
                          <div className="flex gap-2 mt-4">
                            <Textarea
                              placeholder="Add a note..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            />
                            <Button
                              onClick={() => {
                                addNote(quest._id, newNote)
                              }}
                              disabled={!newNote.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Toaster position="top-right" />
    </div>
  )
}