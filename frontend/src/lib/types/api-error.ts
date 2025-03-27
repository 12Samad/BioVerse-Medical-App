import type { AxiosError } from "axios"

// Define a type for API responses
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: string[]
  count?: number
  pagination?: {
    total: number
    perPage: number
    currentPage: number
    totalPages: number
  }
  hasBadge?: boolean
  badgeDetails?: Record<string, unknown>
}

// Define a type for API errors
export type ApiErrorResponse = {
  success: boolean
  error: string
  errors?: string[]
  status?: number
}

// Define a type for Axios errors with proper typing
export type ApiError = AxiosError<{
  error?: string
  message?: string
  errors?: string[]
}>
