"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageIcon, MapPin, Hash, Globe, Users, Lock, X, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { CreatePostData } from "@/types/post"

interface CreatePostProps {
  onCreatePost: (postData: CreatePostData) => void
}

export function CreatePost({ onCreatePost }: CreatePostProps) {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public")
  const [location, setLocation] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = () => {
    if (!content.trim()) return

    const postData: CreatePostData = {
      content: content.trim(),
      images: selectedImages.length > 0 ? selectedImages : undefined,
      visibility,
      tags: tags.length > 0 ? tags : undefined,
      location: location.trim() || undefined,
    }

    onCreatePost(postData)

    // Reset form
    setContent("")
    setVisibility("public")
    setLocation("")
    setTags([])
    setSelectedImages([])
    setIsExpanded(false)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages((prev) => [...prev, ...files].slice(0, 4)) // Max 4 images
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const visibilityIcons = {
    public: Globe,
    friends: Users,
    private: Lock,
  }

  const VisibilityIcon = visibilityIcons[visibility]

  if (!user) return null

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
            <div className="flex items-center space-x-2">
              <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                <SelectTrigger className="w-auto h-auto p-1 border-none">
                  <SelectValue>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <VisibilityIcon className="h-3 w-3" />
                      <span className="capitalize">{visibility}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Friends</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Private</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          className="border-none resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0"
          rows={isExpanded ? 4 : 2}
        />

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {selectedImages.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                  alt={`Selected ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
                <Button size="sm" variant="ghost" className="h-auto w-auto p-0 ml-1" onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center space-x-2 mt-4 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
            <Button size="sm" variant="ghost" className="h-auto w-auto p-0" onClick={() => setLocation("")}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {isExpanded && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              {/* Image Upload */}
              <label className="cursor-pointer">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                  <span>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo
                  </span>
                </Button>
              </label>

              {/* Location */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add Location</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Where are you?"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <Button onClick={() => {}} className="w-full">
                      Add Location
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Tags */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Hash className="h-4 w-4 mr-2" />
                    Tag
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add Tags</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto w-auto p-0 ml-1"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Button onClick={handleSubmit} disabled={!content.trim()}>
              Post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
