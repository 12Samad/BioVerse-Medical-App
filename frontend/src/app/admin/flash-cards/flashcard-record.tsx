"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast, Toaster } from "react-hot-toast"

interface Flashcard {
  _id: string
  question: string
  answer: string
  hint: string
  category: string
}

interface EditFlashcardForm {
  question: string
  answer: string
  hint: string
  category: string
}

const BASE_API_URL = "https://medical-backend-loj4.onrender.com/api/test"

export default function FlashcardRecord() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null)
  const [formData, setFormData] = useState<EditFlashcardForm>({
    question: "",
    answer: "",
    hint: "",
    category: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchFlashcards()
  }, [])

  const fetchFlashcards = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/flashcards?numFlashcards=1000`)
      setFlashcards(response.data.reverse())
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to load flashcards: ${error.response?.data?.message || error.message}`)
      } else {
        toast.error("Failed to load flashcards")
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashcard?")) return

    try {
      await axios.delete(`${BASE_API_URL}/flashcards/${id}`)
      setFlashcards((prevFlashcards) => prevFlashcards.filter((card) => card._id !== id))
      toast.success("Flashcard deleted successfully")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to delete flashcard: ${error.response?.data?.message || error.message}`)
      } else {
        toast.error("Failed to delete flashcard")
      }
    }
  }

  const openEditDialog = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard)
    setFormData({
      question: flashcard.question,
      answer: flashcard.answer,
      hint: flashcard.hint,
      category: flashcard.category,
    })
    setIsEditDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingFlashcard) return

    // Validate form data
    if (!formData.question.trim() || !formData.answer.trim() || !formData.hint.trim() || !formData.category.trim()) {
      toast.error("All fields are required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await axios.put(`${BASE_API_URL}/flashcards/${editingFlashcard._id}`, formData)

      // Update the flashcards state with the edited flashcard
      setFlashcards((prevFlashcards) =>
        prevFlashcards.map((card) => (card._id === editingFlashcard._id ? response.data.data : card)),
      )

      toast.success("Flashcard updated successfully")
      setIsEditDialogOpen(false)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to update flashcard: ${error.response?.data?.message || error.message}`)
      } else {
        toast.error("Failed to update flashcard")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flashcards.map((flashcard) => (
            <div key={flashcard._id} className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">{flashcard.question}</h3>
              <div className="space-y-2">
                <p>
                  <strong>Answer:</strong> {flashcard.answer}
                </p>
                <p>
                  <strong>Hint:</strong> {flashcard.hint}
                </p>
                <p>
                  <strong>Category:</strong> {flashcard.category}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(flashcard)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(flashcard._id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea id="answer" name="answer" value={formData.answer} onChange={handleInputChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hint">Hint</Label>
                <Input id="hint" name="hint" value={formData.hint} onChange={handleInputChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleInputChange} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

