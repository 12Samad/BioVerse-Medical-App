"use client"

import type React from "react"
import { useState } from "react"
import { ClipboardCheck, Clock, BookOpen, Award, X, CheckCircle, ChevronRight, AlertCircle } from "lucide-react"

interface MockExamBlockProps {
  weekNumber: number
  weekTheme: string
  focusAreas: string[]
  dayOfWeek: string
  examNumber: number
}

interface ExamQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

export const MockExamBlock: React.FC<MockExamBlockProps> = ({
  weekNumber,
  weekTheme,
  focusAreas,
//   dayOfWeek,
  examNumber,
}) => {
  const [showExam, setShowExam] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [examCompleted, setExamCompleted] = useState(false)

  // Calculate duration based on week number (more advanced weeks get longer exams)
  const duration = Math.min(30 + weekNumber * 5, 60)

  // Generate a name for the exam based on the week theme
  const examName = `Mini Assessment ${examNumber}: ${weekTheme}`

  // Select topics to cover (use focus areas or generate based on week)
  const topicsCovered = focusAreas.slice(0, Math.min(3, focusAreas.length))

  // Calculate a score range based on the week number
  const minScore = Math.max(60, 65 + weekNumber * 2)
  const maxScore = Math.min(95, minScore + 15)

  // Generate mock questions based on the focus areas
  const generateQuestions = (): ExamQuestion[] => {
    const questions: ExamQuestion[] = []

    // Generate 5 questions (or more for higher week numbers)
    const questionCount = Math.min(5 + Math.floor(weekNumber / 2), 10)

    for (let i = 0; i < questionCount; i++) {
      const topicIndex = i % topicsCovered.length
      const topic = topicsCovered[topicIndex]

      questions.push({
        id: i,
        question: `Question about ${topic}: ${getQuestionForTopic(topic, i)}`,
        options: getOptionsForTopic(topic, i),
        correctAnswer: Math.floor(Math.random() * 4), // Random correct answer (0-3)
      })
    }

    return questions
  }

  // Generate a question for a specific topic
  const getQuestionForTopic = (topic: string, index: number): string => {
    const questionTemplates = [
      `Which of the following best describes ${topic}?`,
      `What is the primary function of ${topic}?`,
      `How does ${topic} relate to clinical practice?`,
      `Which condition is most associated with ${topic}?`,
      `What is the diagnostic approach for issues related to ${topic}?`,
    ]

    return questionTemplates[index % questionTemplates.length]
  }

  // Generate options for a specific topic
  const getOptionsForTopic = (topic: string): string[] => {
    // These are generic options that would be replaced with real content in a production app
    return [
      `Option A related to ${topic}`,
      `Option B related to ${topic}`,
      `Option C related to ${topic}`,
      `Option D related to ${topic}`,
    ]
  }

  const questions = generateQuestions()

  const handleStartExam = () => {
    setShowExam(true)
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setExamCompleted(false)
  }

  const handleCloseExam = () => {
    setShowExam(false)
  }

  const handleSelectAnswer = (questionId: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setExamCompleted(true)
    }
  }

  const calculateScore = (): number => {
    let correctCount = 0

    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++
      }
    })

    return Math.round((correctCount / questions.length) * 100)
  }

  // If the exam is being shown, render the exam interface
  if (showExam) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
            <h3 className="font-semibold text-indigo-800">{examName}</h3>
            <button onClick={handleCloseExam} className="p-1 rounded-full hover:bg-indigo-100 text-indigo-700">
              <X size={20} />
            </button>
          </div>

          {!examCompleted ? (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span>Time remaining: {duration} minutes</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-4">{questions[currentQuestionIndex].question}</h4>

                <div className="space-y-3">
                  {questions[currentQuestionIndex].options.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectAnswer(questions[currentQuestionIndex].id, index)}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedAnswers[questions[currentQuestionIndex].id] === index
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                            selectedAnswers[questions[currentQuestionIndex].id] === index
                              ? "border-indigo-500 bg-indigo-500 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedAnswers[questions[currentQuestionIndex].id] === index && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[questions[currentQuestionIndex].id] === undefined}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    selectedAnswers[questions[currentQuestionIndex].id] !== undefined
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Complete Exam"}
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-800 mb-4">
                  <Award size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Exam Completed!</h3>
                <p className="text-gray-600">You&apos;ve completed the {examName}</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-800 mb-1">{calculateScore()}%</div>
                  <div className="text-sm text-indigo-600">Your Score</div>
                </div>

                <div className="w-full bg-white h-3 rounded-full mt-4">
                  <div
                    className={`h-3 rounded-full ${calculateScore() >= minScore ? "bg-green-500" : "bg-amber-500"}`}
                    style={{ width: `${calculateScore()}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>
                    Target: {minScore}% - {maxScore}%
                  </span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-800">Question Review:</h4>

                {questions.map((question, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start">
                      {selectedAnswers[question.id] === question.correctAnswer ? (
                        <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={18} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-gray-800">{question.question}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Your answer: {question.options[selectedAnswers[question.id] || 0]}
                          {selectedAnswers[question.id] !== question.correctAnswer && (
                            <div className="text-green-600 mt-1">
                              Correct answer: {question.options[question.correctAnswer]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCloseExam}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Close Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default view (when exam is not being shown)
  return (
    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <ClipboardCheck className="text-indigo-600 mr-2" size={20} />
          <h4 className="font-medium text-indigo-800">{examName}</h4>
        </div>
        <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-1 rounded-full">Checkpoint</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-indigo-700">
          <Clock className="mr-2" size={16} />
          <span>Duration: {duration} minutes</span>
        </div>

        <div className="flex items-start text-sm text-indigo-700">
          <BookOpen className="mr-2 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <div className="font-medium mb-1">Topics Covered:</div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              {topicsCovered.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center text-sm text-indigo-700">
          <Award className="mr-2" size={16} />
          <span>
            Target Score: {minScore}% - {maxScore}%
          </span>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleStartExam}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            Start Practice Exam
          </button>
        </div>
      </div>
    </div>
  )
}

