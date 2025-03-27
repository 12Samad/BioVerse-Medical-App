import axios from "axios"

// Create axios instance
const api = axios.create({
  baseURL: "https://medical-backend-loj4.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests
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

// API functions
// Inquiries
export const getUserInquiries = async () => {
  const response = await api.get("/inquiries")
  return response.data
}

export const getAllInquiries = async () => {
  const response = await api.get("/inquiries")
  return response.data
}

export const getInquiryById = async (id: string) => {
  const response = await api.get(`/inquiries/${id}`)
  return response.data
}

interface InquiryData {
  title: string;
  description: string;
  category: string;
  attachments?: File[];
}

export const createInquiry = async (data: InquiryData) => {
  // Use FormData for file uploads
  const formData = new FormData()
  formData.append("title", data.title)
  formData.append("description", data.description)
  formData.append("category", data.category)

  if (data.attachments && data.attachments.length > 0) {
    for (let i = 0; i < data.attachments.length; i++) {
      formData.append("attachments", data.attachments[i])
    }
  }

  const response = await api.post("/inquiries", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data
}

export const addInquiryResponse = async (inquiryId: string, content: string, isInternal = false) => {
  const formData = new FormData()
  formData.append("content", content)
  formData.append("isInternal", isInternal.toString())

  const response = await api.post(`/inquiries/${inquiryId}/responses`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data
}

export const updateInquiryStatus = async (inquiryId: string, status: string) => {
  const response = await api.put(`/inquiries/${inquiryId}/status`, { status })
  return response.data
}

// Dashboard Statistics (admin only)
export const getDashboardStats = async () => {
  const response = await api.get("/inquiries/stats/dashboard")
  return response.data
}

export default api

