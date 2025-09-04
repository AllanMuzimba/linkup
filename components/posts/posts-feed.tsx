"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Bookmark } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PostService } from "@/lib/realtime-services"
import { PostCard } from "@/components/posts/post-card"
import { toast } from "sonner"

interface Post {
  id: string
  authorId: string
  content: string
  mediaUrls?: string[]
  type: 'text' | 'image' | 'video'
  location?: any
  likesCount: number
  commentsCount: number
  sharesCount: number
  createdAt: Date
  author?: {
    name: string
    avatar?: string
  } | null
  distance?: number
  isLiked?: boolean
  isSaved?: boolean
}

interface PostsFeedProps {
  location?: { lat: number, lng: number, radius?: number }
  friendsOnly?: boolean
  authorId?: string
  showNone?: boolean
}

export function PostsFeed({ location, friendsOnly, authorId, showNone }: PostsFeedProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to posts feed with filter options
    const unsubscribe = PostService.subscribeToPostsFeed(
      (newPosts) => {
        setPosts(newPosts)
        setLoading(false)
      },
      {
        location,
        friendsOnly,
        authorId
      }
    )

    return unsubscribe
  }, [location, friendsOnly, authorId])

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error("Please log in to like posts")
      return
    }

    try {
      const isLiked = await PostService.togglePostLike(postId, user.id)
      
      if (isLiked) {
        setLikedPosts(prev => new Set([...prev, postId]))
        toast.success("Post liked! ❤️")
      } else {
        setLikedPosts(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
        toast.success("Post unliked")
      }
    } catch (error) {
      toast.error("Failed to like post")
    }
  }

  const handleComment = async (postId: string, content: string) => {
    if (!user) {
      toast.error("Please log in to comment")
      return
    }

    try {
      const commentId = await PostService.addComment(postId, user.id, content)
      if (commentId) {
        toast.success("Comment added!")
      } else {
        toast.error("Failed to add comment")
      }
    } catch (error) {
      toast.error("Failed to add comment")
    }
  }

  const handleShare = async (postId: string) => {
    if (!user) {
      toast.error("Please log in to share posts")
      return
    }

    try {
      await PostService.sharePost(postId, user.id)
      toast.success("Post shared!")
    } catch (error) {
      toast.error("Failed to share post")
    }
  }

  const handleSave = async (postId: string) => {
    if (!user) {
      toast.error("Please log in to save posts")
      return
    }

    try {
      const isSaved = await PostService.togglePostSave(postId, user.id)
      
      if (isSaved) {
        setSavedPosts(prev => new Set([...prev, postId]))
        toast.success("Post saved for later!")
      } else {
        setSavedPosts(prev => {
          const newSet = new Set(prev)
          newSet.delete(postId)
          return newSet
        })
        toast.success("Post removed from saved")
      }
    } catch (error) {
      toast.error("Failed to save post")
    }
  }

  const formatTimeAgo = (date: Date | any) => {
    // Handle case where date might be a Firestore Timestamp or undefined
    if (!date) return "Unknown time";
    
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date?.toDate && typeof date.toDate === 'function') {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else if (date?._seconds) {
      // Firestore Timestamp alternative format
      dateObj = new Date(date._seconds * 1000);
    } else {
      // Try to parse as date string or return default
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Unknown time";
      }
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-muted rounded"></div>
                  <div className="w-16 h-3 bg-muted rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="w-full h-4 bg-muted rounded"></div>
                <div className="w-3/4 h-4 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No posts yet</h3>
          <p className="text-muted-foreground">Be the first to share something with the community!</p>
        </CardContent>
      </Card>
    )
  }

  // Helper function to convert Firestore timestamps to Date objects
  const convertTimestampToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date()
    
    if (timestamp instanceof Date) {
      return timestamp
    } else if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      return timestamp.toDate()
    } else if (timestamp?._seconds) {
      // Firestore Timestamp alternative format
      return new Date(timestamp._seconds * 1000)
    } else {
      // Try to parse as date string or return current date
      const dateObj = new Date(timestamp)
      return isNaN(dateObj.getTime()) ? new Date() : dateObj
    }
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={{
            ...post,
            createdAt: convertTimestampToDate(post.createdAt),
            updatedAt: convertTimestampToDate(post.updatedAt),
            isLiked: likedPosts.has(post.id),
            isSaved: savedPosts.has(post.id),
            isShared: false, // You can track this if needed
            visibility: post.visibility || 'public',
            tags: post.tags || [],
            location: typeof post.location === 'object' && post.location?._lat && post.location?._long
              ? `${post.location._lat.toFixed(4)}, ${post.location._long.toFixed(4)}`
              : post.location
          }}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onSave={handleSave}
        />
      ))}
    </div>
  )
}