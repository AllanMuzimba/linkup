export interface Post {
  id: string
  authorId: string
  author?: {
    name: string
    username: string
    avatar?: string
    role: string
  } | null
  content: string
  mediaUrls?: string[]
  type: 'text' | 'image' | 'video'
  createdAt: Date
  updatedAt: Date
  likesCount: number
  commentsCount: number
  sharesCount: number
  isLiked: boolean
  isShared: boolean
  isSaved: boolean
  visibility: "public" | "friends" | "private"
  tags?: string[]
  location?: string | { _lat: number; _long: number } | any
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  author: {
    name: string
    username: string
    avatar?: string
  }
  content: string
  createdAt: Date
  likesCount: number
  isLiked: boolean
  replies?: Comment[]
}

export interface Story {
  id: string
  authorId: string
  author: {
    name: string
    username: string
    avatar?: string
  }
  content: string
  image?: string
  video?: string
  backgroundColor?: string
  createdAt: Date
  expiresAt: Date
  viewsCount: number
  isViewed: boolean
  viewers: {
    userId: string
    viewedAt: Date
  }[]
}

export interface CreatePostData {
  content: string
  images?: File[]
  video?: File
  visibility: "public" | "friends" | "private"
  tags?: string[]
  location?: string | { _lat: number; _long: number } | any
  idToken?: string // Add idToken to the interface
}

export interface CreateStoryData {
  content: string
  image?: File
  video?: File
  backgroundColor?: string
}