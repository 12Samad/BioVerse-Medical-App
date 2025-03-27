
  export interface UserWithBadges extends User {
    badges?: UserBadge[]
  }
  

  // User type
export interface User {
    _id: string
    userId: string
    name: string
    username: string
    email: string
    profilePicture?: string
    score?: number
    rank?: number
    totalTime?: number
    quizzesTaken?: number
    lastActive?: string
    createdAt: string
    updatedAt: string
  }
  
  // Badge type
  export interface Badge {
    _id: string
    name: string
    description: string
    icon: string
    representation: "emoji" | "icon" | "image"
    criteria: string
    type: "achievement" | "rank" | "special" | "improvement"
    isActive: boolean
    createdAt: string
    updatedAt: string
    imageUrl?: string
  }
  
  // UserBadge type
  export interface UserBadge {
    _id: string
    userId: string | User
    badgeId: string | Badge
    awardedAt: string
    awardedBy: "system" | "admin"
    awardReason?: string
    createdAt: string
    updatedAt: string
    user?: UserRef[]
  }
  
  // User with badges
  export interface UserWithBadges extends User {
    badges?: UserBadge[]
    badgesEarned: number
    recentBadges: Badge[];
  }
  
  // Badge assignment form data
  export interface BadgeAssignmentFormData {
    userId: string
    badgeId: string
    awardReason?: string
  }
  
  // API response type
  export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    count?: number
    pagination?: {
      total: number
      page: number
      pages: number
      limit: number
    }
  }
  

// Reference types for populated fields
export interface UserRef {
  _id: string
  name?: string
  profilePicture?: string
}

export interface BadgeRef {
  _id: string
  name: string
}

// Badge stats types
export interface BadgeStats {
  recentAwards?: UserBadge[]
  awardsByBadge?: BadgeAwardCount[]
  totalAwards?: number
}

export interface BadgeAwardCount {
  badgeId: string
  name: string
  count: number
}

// Dashboard stats types
// export interface DashboardStats {
//   totalUsers: number
//   activeBadges: number
//   badgesAwarded: number
//   engagementRate: number
//   recentActivity: RecentActivity[]
//   topBadges: TopBadge[]
//   topUsers: TopUser[]
// }
// export type DashboardStats = {
//   totalUsers: number
//   activeBadges: number
//   badgesAwarded: number
//   engagementRate: number
//   recentActivity: RecentActivity[]
//   topBadges: TopBadge[]
//   topUsers: TopUser[]
//   totalRevenue: number
//   activeUsers: number
//   courseSales: number
//   mentorshipBookings: number
//   revenueByMonth: { name: string; total: number }[]
//   recentSales: RecentSale[]
// }

export interface RecentActivity {
  id: string
  user: string
  userId: string
  profilePicture?: string
  action: string
  time: string
  badgeId?: string
  badgeName?: string
}

export interface TopBadge {
  id: string
  name: string
  awarded: number
  icon: string
  representation: string
}

export interface TopUser {
  id: string
  name: string
  username: string
  profilePicture?: string
  badges: number
  score: number
}




// User related types
export interface User {
  _id: string
  name: string
  email: string
  role: "student" | "admin" | "mentor"
  avatar?: string
  bio?: string
  company?: string
  title?: string
  createdAt: string
  updatedAt: string
}

// Course related types
export interface Course {
  _id: string
  title: string
  description: string
  thumbnail: string
  category: string
  instructor: string
  instructorBio?: string
  price: number
  duration: string
  level: "Beginner" | "Intermediate" | "Advanced"
  featured: boolean
  rating: number
  enrollments: number
  source: "internal" | "udemy" | "coursera" | "edx"
  modules?: CourseModule[]
  prerequisites?: string[]
  objectives?: string[]
  createdAt: string
  updatedAt: string
}

export interface CourseModule {
  title: string
  lessons: string[]
}

// Mentorship related types
export interface Mentorship {
  _id: string
  title: string
  description: string
  mentor: Mentor
  price: number
  duration: string
  category: string
  featured: boolean
  topics?: string[]
  availability?: AvailabilitySlot[]
  createdAt: string
  updatedAt: string
}

export interface Mentor {
  _id: string
  name: string
  avatar: string
  title: string
  company: string
  bio: string
  expertise?: string[]
  rating: number
  totalSessions: number
  reviews?: MentorReview[]
}

export interface MentorReview {
  _id: string
  user: string
  rating: number
  comment: string
  createdAt: string
}

export interface AvailabilitySlot {
  date: string
  slots: string[]
}

// Booking related types
export interface Booking {
  _id: string
  mentorshipId: string
  mentorship: {
    _id: string
    title: string
    duration: string
  }
  mentorId: string
  mentor: {
    _id: string
    name: string
    avatar: string
  }
  userId: string
  date: string
  time: string
  status: "upcoming" | "completed" | "cancelled"
  paymentStatus: "pending" | "completed" | "refunded"
  createdAt: string
  updatedAt: string
}

// Payment related types
export interface Payment {
  _id: string
  bookingId?: string
  courseId?: string
  userId: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  paymentMethod: string
  stripePaymentIntentId: string
  createdAt: string
  updatedAt: string
}


export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  message?: string
}

// Form submission types
export interface CourseFormData {
  title: string
  description: string
  category: string
  instructor: string
  instructorBio?: string
  price: number
  duration: string
  level: "Beginner" | "Intermediate" | "Advanced"
  featured: boolean
  source: "internal" | "udemy" | "coursera" | "edx"
  thumbnail?: FileList
  objectives: string[]
  prerequisites?: string[]
}

export interface BookingFormData {
  mentorshipId: string
  mentorId: string
  date: string
  time: string
}

export interface PaymentFormData {
  bookingId?: string
  courseId?: string
  amount: number
  paymentMethod: string
}

// Dashboard statistics
// export interface DashboardStats {
//   totalRevenue: number
//   activeUsers: number
//   courseSales: number
//   mentorshipBookings: number
//   revenueByMonth: { name: string; total: number }[]
//   recentSales: RecentSale[]
// }

export interface RecentSale {
  user: {
    name: string
    email: string
    avatar?: string
  }
  amount: number
}




// types.ts - Update this file to have a single, comprehensive DashboardStats type

// Option 1: Update the existing type to have all properties
export interface DashboardStats {
  // Core metrics for both badge and course dashboards
  totalUsers: number
  activeBadges: number
  badgesAwarded: number
  engagementRate: number
  recentActivity: RecentActivity[]
  topBadges: TopBadge[]
  topUsers: TopUser[]
  
  // Additional properties for e-learning dashboard
  // Make these optional to work with both dashboard types
  totalRevenue?: number
  activeUsers?: number
  courseSales?: number
  mentorshipBookings?: number
  revenueByMonth?: { name: string; total: number }[]
  recentSales?: RecentSale[]
}

// Option 2: Create separate types and use them where appropriate

// For the badges/gamification dashboard
export interface BadgeDashboardStats {
  totalUsers: number
  activeBadges: number
  badgesAwarded: number
  engagementRate: number
  recentActivity: RecentActivity[]
  topBadges: TopBadge[]
  topUsers: TopUser[]
}

// For the e-learning dashboard
export interface LearningDashboardStats {
  totalRevenue: number
  activeUsers: number
  courseSales: number
  mentorshipBookings: number
  revenueByMonth: { name: string; total: number }[]
  recentSales: RecentSale[]
  // You could also include these if needed
  totalUsers?: number
  recentActivity?: RecentActivity[]
  topUsers?: TopUser[]
}