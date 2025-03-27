"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from "axios"
import { Info } from "lucide-react"
import type React from "react"
import { useState } from "react"
import { toast, Toaster } from "react-hot-toast"

const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/test"

interface UploadError {
    row: number
    errors: string[]
}

const QuestionFileUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<UploadError[]>([])
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setErrors([])
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload")
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await axios.post(`${API_BASE_URL}/upload-questions`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            if (response.data.errors && response.data.errors.length > 0) {
                setErrors(response.data.errors)
                toast.error("Upload completed with errors. Please check the error list.")
            } else {
                toast.success("Questions uploaded successfully!")
                setFile(null)
                setErrors([])
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("An error occurred while uploading the file")
        } finally {
            setIsUploading(false)
        }
    }

    const fileStructureInfo = `
    JSON Structure:
    {
      "subject": "Subject Name",
      "subsection": "Subsection Name",
      "system": "System Name",
      "topic": "Topic Name",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "exam_type": "USMLE_STEP1" | "USMLE_STEP2" | "USMLE_STEP3",
      "year": 2023,
      "difficulty": "easy" | "medium" | "hard",
      "specialty": "Specialty Name",
      "state_specific": "State Name" (optional),
      "clinical_setting": "Clinical Setting",
      "question_type": "case_based" | "single_best_answer" | "extended_matching",
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": "Correct option",
      "explanation": "Explanation text"
    }

    CSV Structure:
    subject,subsection,system,topic,subtopics,exam_type,year,difficulty,specialty,state_specific,clinical_setting,question_type,question,option1,option2,option3,option4,answer,explanation
  `

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Upload Questions
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info size={20} />
                            </TooltipTrigger>
                            <TooltipContent>
                                <pre className="text-xs whitespace-pre-wrap">{fileStructureInfo}</pre>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Input
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileChange}
                        className="h-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                    {errors.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Errors:</h3>
                            <ul className="list-disc pl-5">
                                {errors.map((error, index) => (
                                    <li key={index} className="text-red-500">
                                        Row {error.row}: {error.errors.join(", ")}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
            <Toaster position="top-right" />
        </Card>
    )
}

export default QuestionFileUpload