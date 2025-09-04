"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { CreatePost } from "@/components/posts/create-post"
import { PostsFeed } from "@/components/posts/posts-feed"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Plus, Filter, MapPin, Users, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserService, PostService } from "@/lib/realtime-services"
import FileService from "@/lib/FileService"
import { toast } from "sonner"
import { auth } from "@/lib/firebase"

// Define types for better type safety
interface Location {
  lat: number;
  lng: number;
}

interface PostData {
  content: string;
  images?: File[];
  video?: File;
  visibility: "public" | "friends" | "private";
  tags?: string[];
  location?: string;
}

type FeedFilter = "all" | "friends" | "nearby" | "mine" | "none";

export default function PostsPage() {
  const { user } = useAuth()
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Get user location for location-based posts
  useEffect(() => {
    const initializePage = async () => {
      setIsPageLoading(true)

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: Location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            setUserLocation(location)

            // Update user location in database
            if (user?.id) {
              UserService.updateUserLocation(user.id, location).catch((error) => {
                console.error("Failed to update user location:", error)
              })
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

  const handleCreatePost = async (postData: PostData) => {
    if (!user?.id || !auth || !auth.currentUser) {
      toast.error("Please log in to create posts")
      return
    }

    try {
      const idToken = await auth.currentUser.getIdToken()

      // Determine post type and upload media
      let mediaUrls: string[] = []
      let postType: "text" | "image" | "video" = "text"

      if (postData.images && postData.images.length > 0) {
        // Upload images to Cloudinary
        postType = "image"
        mediaUrls = await FileService.uploadPostMedia(postData.images, user.id, idToken)
      } else if (postData.video) {
        // Upload video
        postType = "video"
        const videoUrl = await FileService.uploadFile(postData.video, "post", user.id, idToken)
        mediaUrls = [videoUrl]
      }

      // Create the post
      const postId = await PostService.createPost(
        user.id,
        postData.content,
        postType,
        mediaUrls,
        postData.visibility,
        postData.tags || [],
        postData.location ? JSON.stringify(postData.location) : undefined
      )

      if (postId) {
        toast.success("Post created successfully! 🎉")
        setIsCreateDialogOpen(false)
      } else {
        toast.error("Failed to create post")
      }
    } catch (error) {
      toast.error("Failed to create post")
      console.error("Error creating post:", error)
    }
  }

  const handleCreatePostClick = () => {
    if (!user) {
      toast.error("Please log in to create posts")
      return
    }
    setIsCreateDialogOpen(true)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFeedFilter(e.target.value as FeedFilter)
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
    );
  }

  const getFilteredFeedProps = () => {
    switch (feedFilter) {
      case "friends":
        return user?.id ? { friendsOnly: true, authorId: user.id } : {}
      case "nearby":
        return userLocation ? { location: { ...userLocation, radius: 50 } } : {}
      case "mine":
        return user?.id ? { authorId: user.id } : {}
      case "none":
        return { showNone: true }
      default:
        return {}
    }
  }

  const getFilterLabel = () => {
    switch (feedFilter) {
      case "all":
        return "All Posts"
      case "friends":
        return "Friends Only"
      case "nearby":
        return "Nearby Posts"
      case "mine":
        return "My Posts"
      case "none":
        return "No Posts"
      default:
        return "All Posts"
    }
  }

  const getFilterIcon = () => {
    switch (feedFilter) {
      case "friends":
        return <Users className="h-4 w-4" />
      case "nearby":
        return <MapPin className="h-4 w-4" />
      case "mine":
        return <Eye className="h-4 w-4" />
      case "none":
        return <EyeOff className="h-4 w-4" />
      default:
        return <Filter className="h-4 w-4" />
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
              <CreatePost
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onCreatePost={handleCreatePost}
              />
              <Button onClick={handleCreatePostClick}>
                <Plus className="h-4 w-4 mr-2" />
                Post Story
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              {getFilterIcon()}
              <span className="font-medium">{getFilterLabel()}</span>
            </div>

            <select
              value={feedFilter}
              onChange={handleFilterChange}
              className="w-48 p-2 rounded bg-background border"
            >
              <option value="all">All Posts</option>
              <option value="friends" disabled={!user}>
                Friends Only
              </option>
              <option value="nearby">Nearby Posts</option>
              <option value="mine" disabled={!user}>
                My Posts Only
              </option>
              <option value="none">Hide All Posts</option>
            </select>
          </div>

          {/* Posts Feed */}
          {feedFilter === "none" ? (
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