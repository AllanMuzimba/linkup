"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { CreatePost } from "@/components/posts/real-time-create-post"
import { PostsFeed } from "@/components/posts/posts-feed"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Filter, MapPin, Users, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserService } from "@/lib/realtime-services"

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

  if (!user) {
    return <div>Please log in to view posts</div>
  }

  if (isPageLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-2xl mx-auto p-6">
            <LoadingSpinner size="lg" text="Loading posts & stories..." />
          </div>
        </main>
      </div>
    )
  }

  const getFilteredFeedProps = () => {
    switch (feedFilter) {
      case 'friends':
        return { friendsOnly: true }
      case 'nearby':
        return { location: userLocation ? { ...userLocation, radius: 50 } : undefined }
      case 'mine':
        return { authorId: user?.id }
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
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Story
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                  </DialogHeader>
                  <CreatePost />
                </DialogContent>
              </Dialog>
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
                <SelectItem value="friends">
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
                <SelectItem value="mine">
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