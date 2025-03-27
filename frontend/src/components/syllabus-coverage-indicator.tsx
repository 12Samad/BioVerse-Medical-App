"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useMemo } from "react"

interface Subject {
  _id: string
  name: string
  count: number
  subsections: Subsection[]
}

interface Subsection {
  _id: string
  name: string
  count: number
}

interface SyllabusCoverageIndicatorProps {
  subjects: Subject[]
  selectedSubjects: string[]
  selectedSubsections: string[]
  examType: string
}

export default function SyllabusCoverageIndicator({
  subjects,
  selectedSubjects,
  selectedSubsections,
  examType,
}: SyllabusCoverageIndicatorProps) {
  // Calculate coverage percentages
  const {
    subjectCoverage,
    subsectionCoverage,
    overallCoverage,
    totalSubjects,
    totalSubsections,
    selectedSubjectCount,
    selectedSubsectionCount,
    examTypeLabel,
  } = useMemo(() => {
    if (!subjects || subjects.length === 0) {
      return {
        subjectCoverage: 0,
        subsectionCoverage: 0,
        overallCoverage: 0,
        totalSubjects: 0,
        totalSubsections: 0,
        selectedSubjectCount: 0,
        selectedSubsectionCount: 0,
        examTypeLabel: "USMLE",
      }
    }

    // Get exam type label for display
    let examTypeLabel = "USMLE"
    if (examType === "USMLE_STEP1") examTypeLabel = "USMLE Step 1"
    else if (examType === "USMLE_STEP2") examTypeLabel = "USMLE Step 2"
    else if (examType === "USMLE_STEP3") examTypeLabel = "USMLE Step 3"

    // Filter subjects by exam type if specific exam is selected
    let relevantSubjects = subjects
    if (examType !== "ALL_USMLE_TYPES") {
      // This is a simplified approach - in a real app, you'd have exam-specific subject data
      // For now, we'll use all subjects but weight them differently
      relevantSubjects = subjects.map((subject) => ({
        ...subject,
        // Simulate exam-specific weighting
        examWeight:
          examType === "USMLE_STEP1"
            ? ["Anatomy", "Biochemistry", "Physiology"].includes(subject.name)
              ? 1.5
              : 1
            : ["Pathology", "Pharmacology", "Clinical Sciences"].includes(subject.name)
              ? 1.5
              : 1,
      })) as Subject[]
    }

    const totalSubjects = relevantSubjects.length
    const selectedSubjectCount = selectedSubjects.length

    // Calculate total subsections and selected subsections
    const totalSubsections = relevantSubjects.reduce((acc, subject) => acc + subject.subsections.length, 0)
    const selectedSubsectionCount = selectedSubsections.length

    // Calculate coverage percentages
    const subjectCoverage = totalSubjects > 0 ? (selectedSubjectCount / totalSubjects) * 100 : 0
    const subsectionCoverage = totalSubsections > 0 ? (selectedSubsectionCount / totalSubsections) * 100 : 0

    // Calculate overall coverage (weighted average - subjects 40%, subsections 60%)
    const overallCoverage = subjectCoverage * 0.4 + subsectionCoverage * 0.6

    return {
      subjectCoverage,
      subsectionCoverage,
      overallCoverage,
      totalSubjects,
      totalSubsections,
      selectedSubjectCount,
      selectedSubsectionCount,
      examTypeLabel,
    }
  }, [subjects, selectedSubjects, selectedSubsections, examType])

  // Determine coverage level for styling and messaging
  const coverageLevel = useMemo(() => {
    if (overallCoverage >= 75) return "high"
    if (overallCoverage >= 40) return "medium"
    return "low"
  }, [overallCoverage])

  // Skip rendering if no subjects are loaded yet
  if (!subjects || subjects.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">{examTypeLabel} Syllabus Coverage</h3>

      <div className="space-y-4">
        {/* Overall coverage indicator */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Coverage</span>
            <span
              className={`text-sm font-medium ${
                coverageLevel === "high"
                  ? "text-green-600"
                  : coverageLevel === "medium"
                    ? "text-amber-600"
                    : "text-red-600"
              }`}
            >
              {Math.round(overallCoverage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                coverageLevel === "high" ? "bg-green-500" : coverageLevel === "medium" ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, overallCoverage))}%` }}
            ></div>
          </div>
        </div>

        {/* Subject coverage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Subjects</span>
            <span className="text-sm text-gray-600">
              {selectedSubjectCount} of {totalSubjects} ({Math.round(subjectCoverage)}%)
            </span>
          </div>
        </div>

        {/* Subsection coverage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Topics</span>
            <span className="text-sm text-gray-600">
              {selectedSubsectionCount} of {totalSubsections} ({Math.round(subsectionCoverage)}%)
            </span>
          </div>
        </div>

        {/* Recommendations based on coverage */}
        {coverageLevel !== "high" && (
          <div
            className={`mt-3 p-3 rounded-lg ${
              coverageLevel === "medium" ? "bg-amber-50 border border-amber-100" : "bg-red-50 border border-red-100"
            }`}
          >
            <div className="flex items-start">
              <AlertCircle
                className={`mr-2 h-5 w-5 flex-shrink-0 ${
                  coverageLevel === "medium" ? "text-amber-500" : "text-red-500"
                }`}
              />
              <div>
                <p className={`text-sm font-medium ${coverageLevel === "medium" ? "text-amber-800" : "text-red-800"}`}>
                  {coverageLevel === "low"
                    ? "Your test covers a small portion of the syllabus"
                    : "Consider expanding your test coverage"}
                </p>
                <ul
                  className={`mt-1 text-sm list-disc pl-5 ${
                    coverageLevel === "medium" ? "text-amber-700" : "text-red-700"
                  }`}
                >
                  {selectedSubjectCount < totalSubjects * 0.5 && (
                    <li>Add more subjects to broaden your knowledge assessment</li>
                  )}
                  {selectedSubsectionCount < totalSubsections * 0.4 && (
                    <li>Include additional topics to ensure comprehensive coverage</li>
                  )}
                  {coverageLevel === "low" && (
                    <li>For effective exam preparation, aim for at least 40% syllabus coverage</li>
                  )}
                  {examType !== "ALL_USMLE_TYPES" && <li>Focus on high-yield topics for {examTypeLabel}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {coverageLevel === "high" && (
          <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
            <div className="flex items-start">
              <CheckCircle2 className="mr-2 h-5 w-5 flex-shrink-0 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800">Excellent coverage of the {examTypeLabel} syllabus</p>
                <p className="mt-1 text-sm text-green-700">
                  Your test includes a comprehensive selection of subjects and topics
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

