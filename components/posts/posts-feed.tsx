"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Bookmark } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PostService } from "@/lib/realtime-services"
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
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

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage 
                    src={post.author?.avatar || "/placeholder-user.jpg"} 
                    alt={post.author?.name || "Unknown User"} 
                  />
                  <AvatarFallback>
                    {post.author?.name ? post.author.name.charAt(0) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.author?.name || "Unknown User"}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{formatTimeAgo(post.createdAt)}</span>
                    {post.distance && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{post.distance.toFixed(1)} km away</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Post Content */}
            <div className="space-y-4">
              {post.content && (
                <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
              )}

              {/* Media */}
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="space-y-2">
                  {post.type === 'image' && (
                    <div className={`grid gap-2 ${
                      post.mediaUrls.length === 1 ? 'grid-cols-1' :
                      post.mediaUrls.length === 2 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {post.mediaUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt="Post media"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  {post.type === 'video' && (
                    <video
                      src={post.mediaUrls[0]}
                      controls
                      className="w-full h-64 rounded-lg"
                    />
                  )}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center space-x-4">
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                  <span>{post.sharesCount} shares</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={`flex-1 ${likedPosts.has(post.id) ? 'text-red-500' : ''}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                  Like
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSave(post.id)}
                  className={`flex-1 ${savedPosts.has(post.id) ? 'text-blue-500' : ''}`}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}