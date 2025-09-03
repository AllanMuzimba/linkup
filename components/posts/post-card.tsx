"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Share, MoreHorizontal, MapPin, Globe, Users, Lock, Send } from "lucide-react"
import type { Post } from "@/types/post"
import { SocialShareModal } from "@/components/sharing/social-share-modal"

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
  onShare: (postId: string) => void
  onComment: (postId: string, content: string) => void
}

export function PostCard({ post, onLike, onShare, onComment }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)

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

            {post.images && post.images.length > 0 && (
              <div
                className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}
              >
                {post.images.map((image, index) => (
                  <img
                    key={index}
                    src={image || "/placeholder.svg"}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            )}

            {post.video && <video src={post.video} controls className="w-full rounded-lg" poster="/placeholder.svg" />}
          </div>

          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {post.likesCount > 0 && <span>{post.likesCount} likes</span>}
              {post.commentsCount > 0 && <span>{post.commentsCount} comments</span>}
              {post.sharesCount > 0 && <span>{post.sharesCount} shares</span>}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={post.isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
              Like
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Comment
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare} className={post.isShared ? "text-green-500" : ""}>
              <Share className="h-4 w-4 mr-2" />
              Share
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
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/professional-woman-avatar.png" alt="Sarah" />
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">Sarah Wilson</span>
                        <span className="text-xs text-muted-foreground">2h ago</span>
                      </div>
                      <p className="text-sm">Great post! Really insightful content.</p>
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SocialShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} post={post} />
    </>
  )
}
