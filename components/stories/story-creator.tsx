"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ImageIcon, Type, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { CreateStoryData } from "@/types/post"

interface StoryCreatorProps {
  onCreateStory: (storyData: CreateStoryData) => void
}

const backgroundColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

export function StoryCreator({ onCreateStory }: StoryCreatorProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [backgroundColor, setBackgroundColor] = useState(backgroundColors[0])
  const [mode, setMode] = useState<"text" | "image">("text")

  const handleSubmit = () => {
    if (!content.trim() && !selectedImage) return

    const storyData: CreateStoryData = {
      content: content.trim(),
      image: selectedImage || undefined,
      backgroundColor: mode === "text" ? backgroundColor : undefined,
    }

    onCreateStory(storyData)

    // Reset form
    setContent("")
    setSelectedImage(null)
    setBackgroundColor(backgroundColors[0])
    setMode("text")
    setIsOpen(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setMode("image")
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Plus className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <div>
                <p className="font-medium text-sm">Create Story</p>
                <p className="text-xs text-muted-foreground">Share a moment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex space-x-2">
            <Button variant={mode === "text" ? "default" : "outline"} size="sm" onClick={() => setMode("text")}>
              <Type className="h-4 w-4 mr-2" />
              Text
            </Button>
            <Button variant={mode === "image" ? "default" : "outline"} size="sm" onClick={() => setMode("image")}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Photo
            </Button>
          </div>

          {/* Story Preview */}
          <div
            className="aspect-[9/16] rounded-lg p-4 flex items-center justify-center text-white relative overflow-hidden"
            style={{
              backgroundColor: mode === "text" ? backgroundColor : "#000",
              backgroundImage: selectedImage ? `url(${URL.createObjectURL(selectedImage)})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {mode === "image" && selectedImage && <div className="absolute inset-0 bg-black/20" />}
            <div className="relative z-10 text-center">
              {content && <p className="text-lg font-medium text-center break-words">{content}</p>}
              {!content && !selectedImage && <p className="text-muted-foreground">Your story preview</p>}
            </div>
          </div>

          {/* Content Input */}
          <Textarea
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none"
            rows={3}
          />

          {/* Background Colors (Text Mode) */}
          {mode === "text" && (
            <div>
              <p className="text-sm font-medium mb-2">Background Color</p>
              <div className="flex space-x-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      backgroundColor === color ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Image Upload (Image Mode) */}
          {mode === "image" && (
            <div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <span>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {selectedImage ? "Change Photo" : "Select Photo"}
                  </span>
                </Button>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!content.trim() && !selectedImage} className="flex-1">
              Share Story
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
