import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type React from "react"

type TestPageWarningProps = {
    selectedAnswers: Record<number, string>
    showResults: boolean
    totalQuestions: number
}

const TestPageWarning: React.FC<TestPageWarningProps> = ({ selectedAnswers, showResults, totalQuestions }) => {
    const answeredQuestions = Object.keys(selectedAnswers).length
    const unansweredQuestions = totalQuestions - answeredQuestions

    if (showResults) {
        return null
    }

    return (
        <Alert variant="default" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Test Progress</AlertTitle>
            <AlertDescription>
                {unansweredQuestions > 0
                    ? `You have ${unansweredQuestions} unanswered ${unansweredQuestions === 1 ? "question" : "questions"}.`
                    : "You have answered all questions."}
            </AlertDescription>
        </Alert>
    )
}

export default TestPageWarning

