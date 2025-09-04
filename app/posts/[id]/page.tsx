"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { PostCard } from "@/components/posts/post-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PostService } from "@/lib/realtime-services"
import { toast } from "sonner"
import type { Post } from "@/types/post"

export default function PostPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError("Post ID not found")
        setLoading(false)
        return
      }

      try {
        // Subscribe to the specific post
        const unsubscribe = PostService.subscribeToPostsFeed(
          (posts) => {
            const foundPost = posts.find(p => p.id === postId)
            if (foundPost) {
              setPost(foundPost)
            } else {
              setError("Post not found")
            }
            setLoading(false)
          },
          { authorId: undefined } // Get all posts to find the specific one
        )

        return unsubscribe
      } catch (error) {
        console.error("Error fetching post:", error)
        setError("Failed to load post")
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error("Please log in to like posts")
      return
    }

    try {
      const isLiked = await PostService.togglePostLike(postId, user.id)
      
      if (isLiked) {
        toast.success("Post liked! ❤️")
      } else {
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
      await PostService.addComment(postId, user.id, content)
      toast.success("Comment added!")
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
        toast.success("Post saved for later!")
      } else {
        toast.success("Post removed from saved")
      }
    } catch (error) {
      toast.error("Failed to save post")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-2xl mx-auto p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Loading post...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-2xl mx-auto p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Post Not Found</h3>
              <p className="text-muted-foreground">{error || "The post you're looking for doesn't exist."}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-2xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Post Details</h1>
          </div>

          {/* Post */}
          <PostCard
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onSave={handleSave}
          />
        </div>
      </main>
    </div>
  )
}