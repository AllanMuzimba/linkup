"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal, 
  MapPin, 
  Globe, 
  Users, 
  Lock, 
  Send,
  ThumbsUp,
  Laugh,
  Angry,
  Frown,
  Meh,
  HeartCrack
} from "lucide-react"
import type { Post } from "@/types/post"
import { SocialShareModal } from "@/components/sharing/social-share-modal"
import { toast } from "sonner"
import { PostService } from "@/lib/realtime-services"

interface Comment {
  id: string
  author: {
    name: string
    username: string
    avatar?: string
  }
  content: string
  createdAt: Date
  likesCount: number
}

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
  onShare: (postId: string) => void
  onComment: (postId: string, content: string) => void
  onSave: (postId: string) => void
}

// Emoji reaction types
const reactionEmojis = {
  like: { icon: ThumbsUp, label: "Like", color: "text-blue-500" },
  love: { icon: Heart, label: "Love", color: "text-red-500" },
  laugh: { icon: Laugh, label: "Haha", color: "text-yellow-500" },
  wow: { icon: Meh, label: "Wow", color: "text-yellow-500" },
  sad: { icon: Frown, label: "Sad", color: "text-yellow-500" },
  angry: { icon: Angry, label: "Angry", color: "text-red-500" },
  care: { icon: HeartCrack, label: "Care", color: "text-orange-500" }
}

export function PostCard({ post, onLike, onShare, onComment, onSave }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])

  // Subscribe to comments
  useEffect(() => {
    if (showComments) {
      const unsubscribe = PostService.subscribeToPostComments(post.id, (newComments) => {
        setComments(newComments)
      })
      
      return unsubscribe
    }
  }, [showComments, post.id])

  const handleComment = () => {
    if (newComment.trim()) {
      onComment(post.id, newComment.trim())
      setNewComment("")
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
    onShare(post.id)
  }

  const handleReaction = (reactionType: string) => {
    // If user already reacted with this type, remove it (toggle off)
    if (userReaction === reactionType) {
      setUserReaction(null)
      // In a real app, you would call an API to remove the reaction
    } else {
      setUserReaction(reactionType)
      // In a real app, you would call an API to add/update the reaction
      toast.success(`You reacted with ${reactionEmojis[reactionType as keyof typeof reactionEmojis].label}!`)
    }
    setShowReactions(false)
  }

  const handleLike = () => {
    // Prevent multiple likes by checking if already liked
    if (!post.isLiked) {
      onLike(post.id)
    } else {
      toast.info("You've already liked this post")
    }
  }

  const handleSave = () => {
    onSave(post.id)
    toast.success(post.isSaved ? "Post unsaved" : "Post saved for later!")
  }

  const visibilityIcons = {
    public: Globe,
    friends: Users,
    private: Lock,
  }

  const VisibilityIcon = visibilityIcons[post.visibility]

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const formatCommentTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{post.author.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {post.author.role}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>@{post.author.username}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                  <VisibilityIcon className="h-3 w-3" />
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{post.content}</p>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {post.location && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{post.location}</span>
              </div>
            )}

            {/* Image support */}
            {post.mediaUrls && post.mediaUrls.length > 0 && post.type === 'image' && (
              <div
                className={`grid gap-2 ${post.mediaUrls.length === 1 ? "grid-cols-1" : post.mediaUrls.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}
              >
                {post.mediaUrls.map((image, index) => (
                  <img
                    key={index}
                    src={image || "/placeholder.svg"}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            )}

            {/* Video support */}
            {post.mediaUrls && post.mediaUrls.length > 0 && post.type === 'video' && (
              <video 
                src={post.mediaUrls[0]} 
                controls 
                className="w-full h-64 rounded-lg" 
                poster="/placeholder.svg"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {post.likesCount > 0 && <span>{post.likesCount} likes</span>}
              {post.commentsCount > 0 && <span>{post.commentsCount} comments</span>}
              {post.sharesCount > 0 && <span>{post.sharesCount} shares</span>}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactions(!showReactions)}
                className={post.isLiked ? "text-red-500" : ""}
              >
                <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                Like
              </Button>
              
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex space-x-1 z-10">
                  {Object.entries(reactionEmojis).map(([key, reaction]) => {
                    const Icon = reaction.icon
                    return (
                      <Button
                        key={key}
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleReaction(key)}
                      >
                        <Icon className={`h-5 w-5 ${reaction.color}`} />
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Comment
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare} className={post.isShared ? "text-green-500" : ""}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              className={post.isSaved ? "text-blue-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${post.isSaved ? "fill-current" : ""}`} />
              Save
            </Button>
          </div>

          {showComments && (
            <div className="pt-4 border-t mt-4 space-y-4">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="You" />
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <Button onClick={handleComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
                      <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">{formatCommentTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <Button variant="ghost" size="sm" className="text-xs h-auto p-0">
                          <Heart className="h-3 w-3 mr-1" />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs h-auto p-0">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SocialShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} post={post} />
    </>
  )
}