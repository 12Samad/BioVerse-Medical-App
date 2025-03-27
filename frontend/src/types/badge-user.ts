// Badge and UserBadge types for type safety

export interface Badge {
    _id: string
    name: string
    description: string
    type: "achievement" | "rank" | "improvement" | "special"
    representation: "emoji" | "icon" | "image"
    icon: string
    status: "active" | "inactive"
    criteria: string
    createdAt?: string
  }
  
  export interface UserBadge {
    _id: string
    userId:
      | string
      | {
          _id: string
          username: string
          email: string
          profilePicture: string
        }
    badgeId: string | Badge
    awardedBy: string
    awardReason: string
    awardedAt: string
  }
  
  export interface BadgeStats {
    totalAwards: number
    awardsByBadge: {
      badgeId: string
      name: string
      count: number
    }[]
    recentAwards: UserBadge[]
    awardsByMonth: {
      date: string
      count: number
    }[]
  }
  
  export interface PaginationResponse<T> {
    success: boolean
    count: number
    pagination: {
      total: number
      page: number
      pages: number
      limit: number
    }
    data: T[]
  }
  
  export interface ApiResponse<T> {
    success: boolean
    data: T
    count?: number
    error?: string
  }
  
  