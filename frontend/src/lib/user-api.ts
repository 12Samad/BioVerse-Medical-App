import axios from "axios"
import type { ApiError, ApiResponse } from "./types/api-error"

// Base API URL - you may need to adjust this based on your environment
const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api/user-badges"

export const userApi = {
  // Get all users
  getAllUsers: async (): Promise<ApiResponse> => {
    try {
      const response = await axios.get(`https://medical-backend-loj4.onrender.com/api/user-badges/leaderboard-users`)
      return {
        success: true,
        data: response.data,
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || "Failed to fetch users",
      }
    }
  },

  // Get a specific user
  getUser: async (userId: string): Promise<ApiResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`)
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || "Failed to fetch user",
      }
    }
  },

  // Get user progress and statistics
  getUserProgress: async (userId: string): Promise<ApiResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/progress`)
      return {
        success: true,
        data: response.data.data,
      }
    } catch (error: unknown) {
      const apiError = error as ApiError
      return {
        success: false,
        error: apiError.response?.data?.error || "Failed to fetch user progress",
      }
    }
  },
}

