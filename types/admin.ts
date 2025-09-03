export interface AdminUser {
  id: string
  name: string
  email: string
  role: "super_admin" | "developer" | "level_admin" | "user"
  avatar?: string
  isActive: boolean
  lastLogin: Date
  createdAt: Date
  postsCount: number
  friendsCount: number
  reportsCount: number
}

export interface BulkNotification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  targetAudience: "all" | "admins" | "users" | "specific"
  targetUsers?: string[]
  scheduledFor?: Date
  sentAt?: Date
  sentBy: {
    id: string
    name: string
  }
  status: "draft" | "scheduled" | "sent" | "failed"
  recipientCount: number
  readCount: number
}

export interface ContentReport {
  id: string
  type: "post" | "comment" | "message" | "profile"
  contentId: string
  contentPreview: string
  reportedBy: {
    id: string
    name: string
    avatar?: string
  }
  reportedUser: {
    id: string
    name: string
    avatar?: string
  }
  reason: "spam" | "harassment" | "inappropriate" | "fake" | "other"
  description?: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  priority: "low" | "medium" | "high" | "critical"
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: {
    id: string
    name: string
  }
  action?: "none" | "warning" | "content_removed" | "user_suspended" | "user_banned"
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  totalPosts: number
  postsToday: number
  totalMessages: number
  messagesPerDay: number
  reportsPending: number
  systemHealth: "excellent" | "good" | "warning" | "critical"
  serverLoad: number
  storageUsed: number
  bandwidthUsed: number
}
