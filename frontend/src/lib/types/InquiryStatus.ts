export type InquiryStatus = "open" | "in-progress" | "resolved" | "closed"

export interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin"
  avatar?: string
  studentId?: string
}

export interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  createdAt: string
  attachments?: { filename: string; originalName?: string }[]
}

export interface Response {
  id: string
  inquiryId: string
  content: string
  user: User
  createdAt: string
}

export interface Response {
  id: string
  user: User
  content: string
  createdAt: string
  attachments?: { filename: string; originalName?: string }[]
}

export interface Inquiry {
  _id: string
  id: string
  title: string
  description: string
  category: string
  status: InquiryStatus
  user: User
  attachments?: Attachment[]
  responses?: Response[]
  responseCount: number
  createdAt: string
  updatedAt?: string
}

