export interface UserProfile {
  id: string
  email: string
  name: string
  username: string
  bio?: string
  avatar?: string
  coverImage?: string
  phone?: string
  location?: string
  website?: string
  birthDate?: Date
  joinedDate: Date
  followersCount: number
  followingCount: number
  postsCount: number
  isVerified: boolean
  isPrivate: boolean
  lastActive: Date
  isOnline: boolean
  socialLinks?: {
    twitter?: string
    instagram?: string
    linkedin?: string
    facebook?: string
  }
}

export interface UserStats {
  totalPosts: number
  totalLikes: number
  totalShares: number
  totalComments: number
  profileViews: number
  storiesViewed: number
}
