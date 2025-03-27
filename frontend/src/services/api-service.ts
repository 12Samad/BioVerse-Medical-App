import axios, { type AxiosError } from "axios"
import toast from "react-hot-toast"

// Improved type definitions for better type safety
export type ApiResponse<T> = {
  data: T
  status: number
  statusText: string
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export type ApiError = {
  message: string
  status?: number
  code?: string
  details?: unknown
  errors?: Record<string, string>
}

// Update the Flashcard type to include spaced repetition fields
export type Flashcard = {
  id?: string
  _id?: string
  question: string
  answer: string
  hint: string
  category: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  mastery: number
  reviewCount: number
  lastReviewedDate?: Date | null
  nextReviewDate?: Date | null
  reviewStage?: number // 0-5 (0=new, 5=mastered)
  reviewPriority?: "low" | "medium" | "high" | null
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

// Define more specific types to replace 'any'
type RawFlashcardData = {
  id?: string
  _id?: string
  question?: string
  answer?: string
  hint?: string
  category?: string
  difficulty?: string
  tags?: string[]
  mastery?: number
  reviewCount?: number
  lastReviewedDate?: string | Date
  nextReviewDate?: string | Date
  reviewStage?: number
  reviewPriority?: string
  userId?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  [key: string]: unknown
}

type FlashcardResponse =
  | {
      data?: RawFlashcardData[]
      pagination?: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }
  | RawFlashcardData[]

// Enhanced axios instance with improved error handling
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://medical-backend-loj4.onrender.com/api/v2",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
})

// Request interceptor for authentication and request preparation
apiClient.interceptors.request.use(
  (config) => {
    try {
      const userId = localStorage.getItem("Medical_User_Id")

      if (!userId) {
        console.warn("No user ID found in localStorage. Some API calls may fail.")
        return config
      }

      // Add user ID to appropriate request part based on method
      if (config.method?.toLowerCase() === "get") {
        config.params = {
          ...config.params,
          userId,
        }
      } else if (config.data) {
        // Handle different data types
        if (config.data instanceof FormData) {
          if (!config.data.has("userId")) {
            config.data.append("userId", userId)
          }
        } else if (typeof config.data === "object") {
          config.data = {
            ...config.data,
            userId,
          }
        }
      } else {
        config.data = { userId }
      }

      return config
    } catch (error) {
      console.error("Error in request interceptor:", error)
      return config
    }
  },
  (error) => {
    console.error("Request configuration error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let errorDetails: ApiError = {
      message: "An unexpected error occurred",
    }

    // Network errors (no response from server)
    if (!error.response) {
      errorDetails = {
        message: "Network error: Unable to connect to the server",
        code: "NETWORK_ERROR",
      }
      return Promise.reject(errorDetails)
    }

    // Server responded with an error status
    const response = error.response
    const status = response.status
    const data = response.data as Record<string, unknown>

    // Extract error details from response
    if (data) {
      if (data.error && typeof data.error === "string") {
        errorDetails.message = data.error
      }
      if (data.details) {
        errorDetails.details = data.details
      }
      if (data.errors && typeof data.errors === "object") {
        errorDetails.errors = data.errors as Record<string, string>
      }
      if (data.code && typeof data.code === "string") {
        errorDetails.code = data.code
      }
    }

    // Add status to error object
    errorDetails.status = status

    // Log error for debugging
    console.error("API Error:", { status, data, errorDetails })

    return Promise.reject(errorDetails)
  },
)

// API service with improved error handling and type safety
export const apiService = {
  // Flashcards
  async getFlashcards(params?: Record<string, string | number | boolean>): Promise<ApiResponse<Flashcard[]>> {
    try {
      const response = await apiClient.get<FlashcardResponse>("/flashcards", { params })

      // Handle both array and object with data property responses
      const data = Array.isArray(response.data) ? response.data : response.data.data || []

      // Normalize the response structure
      const result: ApiResponse<Flashcard[]> = {
        data: data.map((card: RawFlashcardData) => normalizeFlashcard(card)),
        status: response.status,
        statusText: response.statusText,
      }

      // Add pagination if available
      if (!Array.isArray(response.data) && response.data.pagination) {
        result.pagination = response.data.pagination
      }

      return result
    } catch (error) {
      console.error("Error in getFlashcards:", error)
      throw error
    }
  },

  // Get due flashcards (for spaced repetition)
  async getDueFlashcards(): Promise<ApiResponse<Flashcard[]>> {
    try {
      const now = new Date().toISOString()
      const response = await apiClient.get<FlashcardResponse>("/flashcards", {
        params: {
          nextReviewDate_lte: now,
          _sort: "reviewPriority,nextReviewDate",
          _order: "desc,asc",
        },
      })

      // Handle both array and object with data property responses
      const data = Array.isArray(response.data) ? response.data : response.data.data || []

      // Normalize the response structure
      const result: ApiResponse<Flashcard[]> = {
        data: data.map((card: RawFlashcardData) => normalizeFlashcard(card)),
        status: response.status,
        statusText: response.statusText,
      }

      return result
    } catch (error) {
      console.error("Error in getDueFlashcards:", error)
      throw error
    }
  },

  // Fix the type error in getFlashcardById
  async getFlashcardById(id: string): Promise<ApiResponse<Flashcard>> {
    try {
      // Validate ID format to fail fast
      if (!id || typeof id !== "string" || id.trim() === "") {
        throw new Error("Invalid flashcard ID")
      }

      const response = await apiClient.get<RawFlashcardData>(`/flashcards/${id}`)

      return {
        data: normalizeFlashcard(response.data),
        status: response.status,
        statusText: response.statusText,
      }
    } catch (error) {
      console.error("Error in getFlashcardById:", error)
      throw error
    }
  },

  // Fix the type error in createFlashcard
  async createFlashcard(flashcardData: Partial<Flashcard>): Promise<ApiResponse<Flashcard>> {
    try {
      // Validate required fields before making the API call
      validateFlashcardData(flashcardData)

      // Initialize spaced repetition fields if not provided
      const dataWithDefaults = {
        ...flashcardData,
        reviewStage: flashcardData.reviewStage ?? 0,
        reviewPriority: flashcardData.reviewPriority ?? null,
        nextReviewDate: flashcardData.nextReviewDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
      }

      const response = await apiClient.post<RawFlashcardData>("/flashcards", dataWithDefaults)

      return {
        data: normalizeFlashcard(response.data),
        status: response.status,
        statusText: response.statusText,
      }
    } catch (error) {
      console.error("Error in createFlashcard:", error)
      throw error
    }
  },

  // Fix the type error in updateFlashcard
  async updateFlashcard(id: string, flashcardData: Partial<Flashcard>): Promise<ApiResponse<Flashcard>> {
    try {
      // Validate required fields and ID
      if (!id) {
        throw new Error("Flashcard ID is required for updates")
      }

      validateFlashcardData(flashcardData)

      const response = await apiClient.put<RawFlashcardData>(`/flashcards/${id}`, flashcardData)

      return {
        data: normalizeFlashcard(response.data),
        status: response.status,
        statusText: response.statusText,
      }
    } catch (error) {
      console.error("Error in updateFlashcard:", error)
      throw error
    }
  },

  async deleteFlashcard(id: string): Promise<ApiResponse<{ message: string; id: string }>> {
    try {
      // Validate ID
      if (!id) {
        throw new Error("Flashcard ID is required for deletion")
      }

      const response = await apiClient.delete<{ message: string; id: string }>(`/flashcards/${id}`)

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      }
    } catch (error) {
      console.error("Error in deleteFlashcard:", error)
      throw error
    }
  },

  // Helper method for custom error handling with improved error messages
  handleApiError(error: unknown, customMessage?: string): void {
    console.error("Error in handleApiError:", error)

    let errorMessage = customMessage || "An error occurred"
    let errorsToDisplay: string[] = []

    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
      errorMessage = error.message
    }

    // Extract validation errors if available
    if (error && typeof error === "object" && "errors" in error) {
      const errors = error.errors
      if (typeof errors === "object" && errors !== null) {
        errorsToDisplay = Object.values(errors as Record<string, string>)
      }
    }

    // Display the main error message
    toast.error(errorMessage)

    // Display individual validation errors if available
    if (errorsToDisplay.length > 0) {
      errorsToDisplay.forEach((err) => {
        if (err !== errorMessage) {
          toast.error(err)
        }
      })
    }
  },
}

// Helper function to normalize flashcard data
function normalizeFlashcard(flashcard: RawFlashcardData): Flashcard {
  if (!flashcard) return null as unknown as Flashcard

  // Use the MongoDB _id as id if needed
  const id = flashcard.id || flashcard._id

  return {
    id,
    _id: flashcard._id,
    question: flashcard.question || "",
    answer: flashcard.answer || "",
    hint: flashcard.hint || "",
    category: flashcard.category || "",
    difficulty: (flashcard.difficulty || "medium") as "easy" | "medium" | "hard",
    tags: Array.isArray(flashcard.tags) ? flashcard.tags : [],
    mastery: typeof flashcard.mastery === "number" ? flashcard.mastery : 0,
    reviewCount: typeof flashcard.reviewCount === "number" ? flashcard.reviewCount : 0,
    lastReviewedDate: flashcard.lastReviewedDate ? new Date(flashcard.lastReviewedDate) : null,
    nextReviewDate: flashcard.nextReviewDate ? new Date(flashcard.nextReviewDate) : null,
    reviewStage: typeof flashcard.reviewStage === "number" ? flashcard.reviewStage : 0,
    reviewPriority: (flashcard.reviewPriority as "low" | "medium" | "high" | null) || null,
    userId: flashcard.userId || "",
    createdAt: flashcard.createdAt ? new Date(flashcard.createdAt) : undefined,
    updatedAt: flashcard.updatedAt ? new Date(flashcard.updatedAt) : undefined,
  }
}

// Helper function to validate flashcard data
function validateFlashcardData(data: Partial<Flashcard>): void {
  const errors: Record<string, string> = {}

  // Required fields
  if (!data.question || data.question.trim().length < 3) {
    errors.question = "Question is required and must be at least 3 characters"
  }

  if (!data.answer || data.answer.trim().length === 0) {
    errors.answer = "Answer is required"
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.category = "Category is required"
  }

  // If we have validation errors, throw them
  if (Object.keys(errors).length > 0) {
    const error: ApiError = {
      message: "Validation failed",
      errors,
    }
    throw error
  }
}

export default apiService

