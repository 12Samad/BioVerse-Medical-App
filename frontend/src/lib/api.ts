import axios, { type AxiosError, type AxiosResponse } from "axios"

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  message?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: boolean
  message: string
  error?: string
}

// Create an axios instance with default config
export const api = axios.create({
  baseURL: "https://medical-backend-loj4.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["x-auth-token"] = token
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Generic API functions with type safety
export const apiClient = {
  // GET request with type parameters
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.get(url, { params })
      return response.data.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // GET paginated request
  async getPaginated<T>(url: string, params?: Record<string, unknown>): Promise<PaginatedResponse<T>> {
    try {
      const response: AxiosResponse<PaginatedResponse<T>> = await api.get(url, { params })
      return response.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // POST request
  async post<T, D extends Record<string, unknown> | FormData>(url: string, data: D): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.post(url, data)
      return response.data.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // PUT request
  async put<T, D extends Record<string, unknown> | FormData>(url: string, data: D): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.put(url, data)
      return response.data.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // DELETE request
  async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.delete(url)
      return response.data.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // POST with FormData (for file uploads)
  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data.data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  // PUT with FormData
  async putFormData<T>(url: string, formData: FormData): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.put(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data.data
    } catch (error) {
      throw handleApiError(error)
    }
  },
}

// Helper function to handle API errors
function handleApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    const errorMessage = axiosError.response?.data?.message || axiosError.message || "An error occurred"
    return new Error(errorMessage)
  }
  return error instanceof Error ? error : new Error("An unknown error occurred")
}

export default api