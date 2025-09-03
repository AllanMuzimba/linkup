export interface Friend {
  id: string
  name: string
  username: string
  email: string
  phone?: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
  status: "pending" | "accepted" | "blocked"
  addedAt: Date
  mutualFriends: number
}

export interface FileAttachment {
  id: string
  name: string
  type: "image" | "video" | "audio" | "document"
  size: number // in bytes
  url: string
  mimeType: string
  duration?: number // for audio/video in seconds
  thumbnail?: string // for video files
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  sender: {
    name: string
    avatar?: string
  }
  content: string
  type: "text" | "image" | "file" | "audio" | "video" | "document" | "system" | "call"
  timestamp: Date
  isRead: boolean
  attachments?: FileAttachment[]
  replyTo?: {
    id: string
    content: string
    sender: string
  }
  callData?: {
    type: "audio" | "video"
    duration?: number
    status: "missed" | "completed" | "declined" | "ongoing"
  }
}

export interface CallState {
  isActive: boolean
  type: "audio" | "video" | null
  participantId: string | null
  participantName: string | null
  startTime: Date | null
  status: "calling" | "ringing" | "connected" | "ended" | "declined"
  isMuted: boolean
  isVideoEnabled: boolean
}

export interface Chat {
  id: string
  type: "direct" | "group"
  name?: string
  avatar?: string
  participants: {
    id: string
    name: string
    avatar?: string
    role?: "admin" | "member"
    joinedAt: Date
    isOnline?: boolean
  }[]
  lastMessage?: ChatMessage
  unreadCount: number
  isTyping: string[]
  createdAt: Date
  updatedAt: Date
  currentCall?: CallState
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUser: {
    name: string
    username: string
    avatar?: string
    mutualFriends: number
  }
  message?: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 25 * 1024 * 1024, // 25MB
  document: 50 * 1024 * 1024, // 50MB
} as const

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
} as const
