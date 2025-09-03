"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ChevronLeft, ChevronRight, Heart, Send } from "lucide-react"
import type { Story } from "@/types/post"

interface StoryViewerProps {
  stories: Story[]
  initialStoryIndex?: number
  isOpen: boolean
  onClose: () => void
  onStoryView: (storyId: string) => void
}

export function StoryViewer({ stories, initialStoryIndex = 0, isOpen, onClose, onStoryView }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentStory = stories[currentIndex]
  const STORY_DURATION = 5000 // 5 seconds

  useEffect(() => {
    if (!isOpen || isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1)
            onStoryView(stories[currentIndex + 1].id)
            return 0
          } else {
            // Close viewer when all stories are done
            onClose()
            return 0
          }
        }
        return prev + 100 / (STORY_DURATION / 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, isPaused, currentIndex, stories.length, onClose, onStoryView])

  useEffect(() => {
    if (isOpen && currentStory) {
      setProgress(0)
      onStoryView(currentStory.id)
    }
  }, [currentIndex, isOpen, currentStory, onStoryView])

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    }
  }

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  if (!currentStory) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 bg-black border-none">
        <div className="relative aspect-[9/16] overflow-hidden rounded-lg">
          {/* Progress Bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex space-x-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={currentStory.author.avatar || "/placeholder.svg"} alt={currentStory.author.name} />
                <AvatarFallback>{currentStory.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-medium text-sm">{currentStory.author.name}</p>
                <p className="text-white/80 text-xs">{formatTimeAgo(currentStory.createdAt)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Story Content */}
          <div
            className="w-full h-full flex items-center justify-center text-white relative"
            style={{
              backgroundColor: currentStory.backgroundColor || "#000",
              backgroundImage: currentStory.image ? `url(${currentStory.image})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {currentStory.image && <div className="absolute inset-0 bg-black/20" />}

            {currentStory.content && (
              <div className="relative z-10 p-6 text-center">
                <p className="text-lg font-medium break-words">{currentStory.content}</p>
              </div>
            )}

            {/* Navigation Areas */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full z-10"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            />
            <button className="absolute right-0 top-0 w-1/3 h-full z-10" onClick={goToNext} />
          </div>

          {/* Navigation Buttons */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-20"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {currentIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-20"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Bottom Actions */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Send className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-right">
              <span className="text-white/80 text-xs">{currentStory.viewsCount} views</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
