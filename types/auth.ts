export type UserRole = "super_admin" | "developer" | "admin" | "support" | "user"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  createdAt: Date
  lastActive: Date
  isOnline: boolean
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithFacebook: () => Promise<void>
  loginWithTwitter: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  hasPermission: (permission: string) => boolean
}

export const PERMISSIONS = {
  // Super Admin permissions
  MANAGE_ALL_USERS: "manage_all_users",
  MANAGE_SYSTEM: "manage_system",
  VIEW_ANALYTICS: "view_analytics",

  // Developer permissions
  MANAGE_INTEGRATIONS: "manage_integrations",
  VIEW_LOGS: "view_logs",

  // Level Admin permissions
  MODERATE_CONTENT: "moderate_content",
  SEND_BULK_NOTIFICATIONS: "send_bulk_notifications",
  MANAGE_LEVEL_USERS: "manage_level_users",

  // User permissions
  CREATE_POSTS: "create_posts",
  CHAT_WITH_USERS: "chat_with_users",
  MANAGE_FRIENDS: "manage_friends",
  SHARE_CONTENT: "share_content",
} as const

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  developer: [
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.CHAT_WITH_USERS,
    PERMISSIONS.MANAGE_FRIENDS,
    PERMISSIONS.SHARE_CONTENT,
  ],
  admin: [
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.SEND_BULK_NOTIFICATIONS,
    PERMISSIONS.MANAGE_LEVEL_USERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.CHAT_WITH_USERS,
    PERMISSIONS.MANAGE_FRIENDS,
    PERMISSIONS.SHARE_CONTENT,
  ],
  support: [
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MANAGE_LEVEL_USERS,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.CHAT_WITH_USERS,
    PERMISSIONS.MANAGE_FRIENDS,
    PERMISSIONS.SHARE_CONTENT,
  ],
  user: [PERMISSIONS.CREATE_POSTS, PERMISSIONS.CHAT_WITH_USERS, PERMISSIONS.MANAGE_FRIENDS, PERMISSIONS.SHARE_CONTENT],
}
