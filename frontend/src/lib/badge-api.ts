import type { Badge } from "@/types/badge"
import axios from "axios"
import type { ApiError, ApiResponse } from "./types/api-error"

const BASE_API_URL = "https://medical-backend-loj4.onrender.com/api/badges"

// Add request and response timeout
const api = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error("API Request Error:", error)
    return Promise.reject(error)
  },
)

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network Error:", error.message)
      return Promise.reject({
        success: false,
        error: "Network error. Please check your connection.",
      })
    }

    // Handle API errors
    console.error("API Error:", error.response?.data)
    return Promise.reject({
      success: false,
      error: error.response?.data?.message || "An error occurred",
      errors: error.response?.data?.errors || [],
      status: error.response?.status,
    })
  },
)

export const badgeApi = {
  // Get all badges
  getAllBadges: async (): Promise<ApiResponse<Badge[]>> => {
    try {
      const response = await api.get(BASE_API_URL)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: unknown) {
      console.error("Error fetching badges:", error)
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || "Failed to fetch badges",
      }
    }
  },

  // Get a single badge
  getBadge: async (id: string): Promise<ApiResponse<Badge>> => {
    try {
      const response = await api.get(`${BASE_API_URL}/${id}`)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: unknown) {
      console.error(`Error fetching badge ${id}:`, error)
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || `Failed to fetch badge ${id}`,
      }
    }
  },

  // Create a new badge
  createBadge: async (badgeData: Omit<Badge, "_id">): Promise<ApiResponse<Badge>> => {
    try {
      const response = await api.post(BASE_API_URL, badgeData)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: unknown) {
      console.error("Error creating badge:", error)
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || "Failed to create badge",
        errors: apiError.response?.data?.errors || [],
      }
    }
  },

  // Update a badge
  updateBadge: async (id: string, badgeData: Partial<Badge>): Promise<ApiResponse<Badge>> => {
    try {
      const response = await api.put(`${BASE_API_URL}/${id}`, badgeData)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: unknown) {
      console.error(`Error updating badge ${id}:`, error)
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || `Failed to update badge ${id}`,
        errors: apiError.response?.data?.errors || [],
      }
    }
  },

  // Delete a badge
  deleteBadge: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await api.delete(`${BASE_API_URL}/${id}`)
      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
      }
    } catch (error: unknown) {
      console.error(`Error deleting badge ${id}:`, error)
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || `Failed to delete badge ${id}`,
      }
    }
  },
}

