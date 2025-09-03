"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Smile, 
  Search, 
  Heart, 
  ThumbsUp, 
  Star, 
  Globe
} from 'lucide-react'

// Essential emojis organized by categories
const emojiCategories = {
  recent: [] as string[],
  faces: [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
    "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "😯", "😪", "😫", "🥱", "😴", "😌", "😖",
    "😤", "😠", "😡", "🤬", "🥺", "😢", "😭", "😰", "😨", "😱", "🥵", "🥶", "😵", "🤯", "🤠", "🥳",
    "🥸", "😎", "🤓", "🧐"
  ],
  hearts: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗",
    "💖", "💘", "💝", "💟"
  ],
  hands: [
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚",
    "🖐️", "✋", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏"
  ],
  activities: [
    "🔥", "⭐", "🌟", "✨", "💫", "⚡", "💥", "💯", "💢", "💦", "💨", "🎉", "🎊", "🎈", "🎁",
    "🏆", "🥇", "🥈", "🥉"
  ],
  objects: [
    "💎", "🔔", "🔕", "📱", "📞", "📧", "💌", "💰", "💸", "💳", "🎯", "🎮", "🎲", "🚀"
  ]
}

const categories = [
  { id: "recent", name: "Recent", icon: Smile },
  { id: "faces", name: "Faces", icon: Smile },
  { id: "hearts", name: "Hearts", icon: Heart },
  { id: "hands", name: "Hands", icon: ThumbsUp },
  { id: "activities", name: "Activities", icon: Star },
  { id: "objects", name: "Objects", icon: Globe },
]

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  trigger?: React.ReactNode
}

export function EmojiPicker({ onEmojiSelect, trigger }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("faces")
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("kubatana-recent-emojis")
    if (stored) {
      setRecentEmojis(JSON.parse(stored))
    }
  }, [])

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji)
    
    const updatedRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 16)
    setRecentEmojis(updatedRecent)
    localStorage.setItem("kubatana-recent-emojis", JSON.stringify(updatedRecent))
    
    setIsOpen(false)
  }

  const getEmojisToShow = () => {
    if (searchTerm) {
      const allEmojis = Object.values(emojiCategories).flat()
      return allEmojis.filter(emoji => 
        emoji.includes(searchTerm)
      )
    }
    
    if (activeCategory === "recent") {
      return recentEmojis
    }
    
    return emojiCategories[activeCategory as keyof typeof emojiCategories] || []
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost">
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emojis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {!searchTerm && (
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-6 mb-4 h-auto p-1">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="p-2"
                      title={category.name}
                    >
                      <IconComponent className="h-4 w-4" />
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          )}

          <ScrollArea className="h-64">
            <div className="grid grid-cols-8 gap-2">
              {getEmojisToShow().map((emoji, index) => (
                <Button
                  key={`${emoji}-${index}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="h-8 w-8 p-0 text-lg hover:bg-primary/10"
                >
                  {emoji}
                </Button>
              ))}
            </div>
            {getEmojisToShow().length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {searchTerm ? "No emojis found" : "No recent emojis"}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}