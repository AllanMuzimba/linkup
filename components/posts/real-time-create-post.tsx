"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, VideoIcon, FileIcon, MapPinIcon, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PostService, FileService } from "@/lib/realtime-services"
import { toast } from "sonner"
import { GeoPoint } from "firebase/firestore"

export function CreatePost() {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          toast.success("Location added to post")
        },
        (error) => {
          toast.error("Could not get location")
        }
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && selectedFiles.length === 0) {
      toast.error("Please add some content or media")
      return
    }

    if (!user) {
      toast.error("You must be logged in to post")
      return
    }

    setIsPosting(true)
    
    try {
      let mediaUrls: string[] = []
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        mediaUrls = await FileService.uploadPostMedia(selectedFiles, user.id)
      }
      
      // Determine post type
      const postType = selectedFiles.length > 0 ? 
        (selectedFiles[0].type.startsWith('image/') ? 'image' : 'video') : 
        'text'
      
      // Create post
      await PostService.createPost(
        user.id,
        content,
        postType,
        mediaUrls,
        location ? new GeoPoint(location.lat, location.lng) : undefined
      )
      
      // Reset form
      setContent("")
      setSelectedFiles([])
      setLocation(null)
      
      toast.success("Post created successfully! 🎉")
      
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post. Please try again.")
    } finally {
      setIsPosting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.name || "User"} />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name || "User"}</p>
            <p className="text-sm text-muted-foreground">Share your thoughts with LinkUp...</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground"
          />
          
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative">
                  {file.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-full h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-24 bg-muted rounded flex items-center justify-center">
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Location indicator */}
          {location && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPinIcon className="h-4 w-4" />
              <span>Location added</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLocation(null)}
                className="h-auto p-0 text-xs"
              >
                Remove
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-4">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <label className="flex items-center cursor-pointer">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <label className="flex items-center cursor-pointer">
                  <VideoIcon className="h-5 w-5 mr-2" />
                  Video
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={getLocation}
              >
                <MapPinIcon className="h-5 w-5 mr-2" />
                Location
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={(!content.trim() && selectedFiles.length === 0) || isPosting}
              className="px-8"
            >
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}