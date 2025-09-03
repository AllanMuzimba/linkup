"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { CreatePost } from "@/components/posts/create-post"
import { PostsFeed } from "@/components/posts/posts-feed"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Filter, MapPin, Users, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserService, PostService } from "@/lib/realtime-services"
import { toast } from "sonner"

export default function PostsPage() {
  const { user } = useAuth()
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [feedFilter, setFeedFilter] = useState<'all' | 'friends' | 'nearby' | 'mine' | 'none'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Get user location for location-based posts
  useEffect(() => {
    const initializePage = async () => {
      setIsPageLoading(true)
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setUserLocation(location)
            
            // Update user location in database
            if (user) {
              UserService.updateUserLocation(user.id, location)
            }
          },
          (error) => {
            console.log("Could not get user location:", error)
          }
        )
      }
      
      // Simulate page loading
      setTimeout(() => {
        setIsPageLoading(false)
      }, 800)
    }
    
    initializePage()
  }, [user])

  const handleCreatePost = async (postData: any) => {
    if (!user) {
      toast.error("Please log in to create posts")
      return
    }

    try {
      // Determine post type and upload media
      let mediaUrls: string[] = []
      let postType: 'text' | 'image' | 'video' = 'text'
      
      if (postData.images && postData.images.length > 0) {
        // Upload images
        postType = 'image'
        // In a real app, you would upload the images to storage
        // For now, we'll just use placeholder URLs
        mediaUrls = postData.images.map((_: any, index: number) => 
          `https://picsum.photos/seed/${Date.now()}-${index}/800/600`
        )
      } else if (postData.video) {
        // Upload video
        postType = 'video'
        // In a real app, you would upload the video to storage
        // For now, we'll use a placeholder
        mediaUrls = [`https://sample-videos.com/zip/10/mp4/Sample-video-10mb.mp4`]
      }

      // Create the post
      const postId = await PostService.createPost(
        user.id,
        postData.content,
        postType,
        mediaUrls
      )

      if (postId) {
        toast.success("Post created successfully! 🎉")
        // Close the dialog
        setIsCreateDialogOpen(false)
      } else {
        toast.error("Failed to create post")
      }
    } catch (error) {
      toast.error("Failed to create post")
      console.error("Error creating post:", error)
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-2xl mx-auto p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Loading posts & stories...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const getFilteredFeedProps = () => {
    switch (feedFilter) {
      case 'friends':
        return user ? { friendsOnly: true, authorId: user.id } : {}
      case 'nearby':
        return { location: userLocation ? { ...userLocation, radius: 50 } : undefined }
      case 'mine':
        return user ? { authorId: user.id } : {}
      case 'none':
        return { showNone: true }
      default:
        return {}
    }
  }

  const getFilterLabel = () => {
    switch (feedFilter) {
      case 'all': return 'All Posts'
      case 'friends': return 'Friends Only'
      case 'nearby': return 'Nearby Posts'
      case 'mine': return 'My Posts'
      case 'none': return 'No Posts'
      default: return 'All Posts'
    }
  }

  const getFilterIcon = () => {
    switch (feedFilter) {
      case 'friends': return <Users className="h-4 w-4" />
      case 'nearby': return <MapPin className="h-4 w-4" />
      case 'mine': return <Eye className="h-4 w-4" />
      case 'none': return <EyeOff className="h-4 w-4" />
      default: return <Filter className="h-4 w-4" />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-2xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Posts & Stories</h1>
            <div className="flex items-center space-x-3">
              {userLocation && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Location enabled
                </div>
              )}
              
              {/* Create Post Button */}
              {user ? (
                <>
                  <CreatePost 
                    isOpen={isCreateDialogOpen}
                    onClose={() => setIsCreateDialogOpen(false)}
                    onCreatePost={handleCreatePost}
                  />
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Story
                  </Button>
                </>
              ) : (
                <Button onClick={() => toast.error("Please log in to create posts")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Story
                </Button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              {getFilterIcon()}
              <span className="font-medium">{getFilterLabel()}</span>
            </div>
            
            <Select value={feedFilter} onValueChange={(value: any) => setFeedFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    All Posts
                  </div>
                </SelectItem>
                <SelectItem value="friends" disabled={!user}>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Friends Only
                  </div>
                </SelectItem>
                <SelectItem value="nearby">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Nearby Posts
                  </div>
                </SelectItem>
                <SelectItem value="mine" disabled={!user}>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    My Posts Only
                  </div>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center">
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide All Posts
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Posts Feed */}
          {feedFilter === 'none' ? (
            <div className="text-center py-12">
              <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Posts Hidden</h3>
              <p className="text-muted-foreground">Change the filter to view posts</p>
            </div>
          ) : (
            <PostsFeed {...getFilteredFeedProps()} />
          )}
        </div>
      </main>
    </div>
  )
}