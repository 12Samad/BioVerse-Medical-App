"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { Download, FileText, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
// We'll use dynamic imports for jsPDF since it's a client-side only library

interface Flashcard {
  _id: string
  question: string
  answer: string
  explanation?: string
  topic?: string
  subtopics?: string[]
  createdAt: string
}

export function FlashcardExport() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [topics, setTopics] = useState<string[]>([])

  useEffect(() => {
    fetchFlashcards()
  }, [])

  const fetchFlashcards = async () => {
    try {
      setLoading(true)
      const userId = localStorage.getItem("Medical_User_Id")

      // Fetch flashcards from API
      const response = await axios.get(
        `https://medical-backend-loj4.onrender.com/api/test/flashcards?userId=${userId}`,
        // `https://medical-backend-loj4.onrender.com/api/test/flashcards`,
      )

      // For demo purposes, if the API isn't implemented yet, we'll use mock data
      const mockFlashcards: Flashcard[] = [
        {
          _id: "fc1",
          question: "What is the primary function of hemoglobin?",
          answer: "To transport oxygen from the lungs to the tissues",
          explanation:
            "Hemoglobin is a protein in red blood cells that binds to oxygen in the lungs and carries it to tissues throughout the body.",
          topic: "Cardiovascular System",
          subtopics: ["Blood", "Oxygen Transport"],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "fc2",
          question: "Which cranial nerve is responsible for taste sensation in the anterior two-thirds of the tongue?",
          answer: "Facial nerve (CN VII)",
          explanation:
            "The facial nerve provides taste sensation to the anterior two-thirds of the tongue via the chorda tympani branch.",
          topic: "Neuroanatomy",
          subtopics: ["Cranial Nerves", "Sensory Function"],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "fc3",
          question: "What is the half-life of a drug?",
          answer: "The time required for the concentration of the drug to reach half of its original value",
          explanation:
            "Half-life is a pharmacokinetic parameter that helps determine dosing intervals and the time required to reach steady state.",
          topic: "Pharmacokinetics",
          subtopics: ["Drug Metabolism", "Half-life"],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "fc4",
          question: "What causes metabolic acidosis?",
          answer: "Increased production of acid, decreased excretion of acid, or increased loss of bicarbonate",
          explanation: "Common causes include diabetic ketoacidosis, lactic acidosis, renal failure, and diarrhea.",
          topic: "Acid-Base Balance",
          subtopics: ["Metabolic Acidosis", "pH Regulation"],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "fc5",
          question: "What is the most common cause of community-acquired pneumonia?",
          answer: "Streptococcus pneumoniae",
          explanation:
            "S. pneumoniae is a gram-positive, alpha-hemolytic bacterium that commonly colonizes the upper respiratory tract.",
          topic: "Infectious Diseases",
          subtopics: ["Respiratory Infections", "Bacterial Pathogens"],
          createdAt: new Date().toISOString(),
        },
      ]

      const fetchedFlashcards = response.data?.flashcards || mockFlashcards
      setFlashcards(fetchedFlashcards)

      // Extract unique topics
      const uniqueTopics = Array.from(new Set(fetchedFlashcards.map((fc: Flashcard) => fc.topic || "Uncategorized")))
      setTopics(uniqueTopics as string[])

      setLoading(false)
    } catch (error) {
      console.error("Error fetching flashcards:", error)
      // Use mock data if API fails
      const mockFlashcards: Flashcard[] = [
        {
          _id: "fc1",
          question: "What is the primary function of hemoglobin?",
          answer: "To transport oxygen from the lungs to the tissues",
          explanation:
            "Hemoglobin is a protein in red blood cells that binds to oxygen in the lungs and carries it to tissues throughout the body.",
          topic: "Cardiovascular System",
          subtopics: ["Blood", "Oxygen Transport"],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "fc2",
          question: "Which cranial nerve is responsible for taste sensation in the anterior two-thirds of the tongue?",
          answer: "Facial nerve (CN VII)",
          explanation:
            "The facial nerve provides taste sensation to the anterior two-thirds of the tongue via the chorda tympani branch.",
          topic: "Neuroanatomy",
          subtopics: ["Cranial Nerves", "Sensory Function"],
          createdAt: new Date().toISOString(),
        },
      ]

      setFlashcards(mockFlashcards)

      // Extract unique topics
      const uniqueTopics = Array.from(new Set(mockFlashcards.map((fc) => fc.topic || "Uncategorized")))
      setTopics(uniqueTopics as string[])

      setLoading(false)
      toast.error("Failed to load flashcards")
    }
  }

  const exportToPDF = async (selectedCards: Flashcard[]) => {
    try {
      setExporting(true)

      // Dynamically import jsPDF and jspdf-autotable
      const jspdfModule = await import("jspdf")
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Import and add the autotable plugin
      const autoTableModule = await import("jspdf-autotable")
      const autoTable = autoTableModule.default

      // Add title
      const title = selectedTopic ? `Medical Flashcards - ${selectedTopic}` : "Medical Flashcards"
      doc.setFontSize(18)
      doc.text(title, 105, 15, { align: "center" })

      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 22, { align: "center" })

      // Add flashcards
      doc.setFontSize(12)

      // Prepare data for table
      const tableData = selectedCards.map((card, index) => [
        `${index + 1}`,
        card.question,
        card.answer,
        card.explanation || "",
      ])

      // Add table using the imported autoTable function
      autoTable(doc, {
        head: [["#", "Question", "Answer", "Explanation"]],
        body: tableData,
        startY: 30,
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { cellWidth: 60 },
          3: { cellWidth: 60 },
        },
        styles: { overflow: "linebreak", cellPadding: 3 },
        margin: { top: 30 },
      })

      // Save the PDF
      const filename = selectedTopic
        ? `medical_flashcards_${selectedTopic.toLowerCase().replace(/\s+/g, "_")}.pdf`
        : "medical_flashcards.pdf"

      doc.save(filename)

      toast.success(`PDF exported successfully!`)
      setExporting(false)
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast.error("Failed to export PDF. Please try again.")
      setExporting(false)
    }
  }

  const handleExportPDF = () => {
    const cardsToExport = selectedTopic ? flashcards.filter((card) => card.topic === selectedTopic) : flashcards

    if (cardsToExport.length === 0) {
      toast.error("No flashcards to export")
      return
    }

    exportToPDF(cardsToExport)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">Export Flashcards</h3>
            <p className="text-sm text-muted-foreground">Export your flashcards as PDF for offline study or printing</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              value={selectedTopic || ""}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
            >
              <option value="">All Topics ({flashcards.length} cards)</option>
              {topics.map((topic) => {
                const count = flashcards.filter((card) => card.topic === topic).length
                return (
                  <option key={topic} value={topic}>
                    {topic} ({count} cards)
                  </option>
                )
              })}
            </select>

            <Button
              onClick={handleExportPDF}
              disabled={exporting || flashcards.length === 0}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {flashcards.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <div className="text-center text-muted-foreground">
                <p>No flashcards found. Create some flashcards during your review sessions.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Flashcard Preview</CardTitle>
              <CardDescription>
                {selectedTopic
                  ? `Showing ${flashcards.filter((card) => card.topic === selectedTopic).length} flashcards for ${selectedTopic}`
                  : `Showing all ${flashcards.length} flashcards`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {(selectedTopic ? flashcards.filter((card) => card.topic === selectedTopic) : flashcards)
                  .slice(0, 5)
                  .map((card, index) => (
                    <Card key={card._id} className="border-muted">
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">Question {index + 1}</CardTitle>
                          {card.topic && <span className="text-xs px-2 py-1 bg-muted rounded-full">{card.topic}</span>}
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm font-medium">{card.question}</p>
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Answer:</span> {card.answer}
                          </p>
                          {card.explanation && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium text-foreground">Explanation:</span> {card.explanation}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {(selectedTopic ? flashcards.filter((card) => card.topic === selectedTopic) : flashcards).length >
                  5 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    {selectedTopic
                      ? flashcards.filter((card) => card.topic === selectedTopic).length - 5
                      : flashcards.length - 5}{" "}
                    more flashcards not shown in preview
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 flex justify-between">
              <div className="text-sm text-muted-foreground">Export all flashcards or filter by topic</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

export default FlashcardExport

