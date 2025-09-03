"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Search, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ChatService, FriendService } from "@/lib/realtime-services"
import { toast } from "sonner"

interface Chat {
  id: string
  type: 'direct' | 'group'
  name?: string
  participants: {
    id: string
    name: string
    avatar?: string
  }[]
}

interface Friend {
  id: string
  name: string
  avatar?: string
  username?: string
}

interface ForwardMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageIds: string[]
  onForward: (targetChatIds: string[]) => Promise<void>
}

export function ForwardMessageDialog({ 
  open, 
  onOpenChange, 
  messageIds, 
  onForward 
}: ForwardMessageDialogProps) {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set())
  const [isForwarding, setIsForwarding] = useState(false)
  const [filteredItems, setFilteredItems] = useState<(Chat & { type: 'chat' | 'friend' })[]>([])

  // Load chats and friends
  useEffect(() => {
    if (!user || !open) return

    const unsubscribeChats = ChatService.subscribeToUserChats(user.id, (userChats) => {
      setChats(userChats)
    })

    const unsubscribeFriends = FriendService.subscribeToFriends(user.id, (userFriends) => {
      setFriends(userFriends)
    })

    return () => {
      unsubscribeChats()
      unsubscribeFriends()
    }
  }, [user, open])

  // Filter and combine chats and friends
  useEffect(() => {
    const allItems: (Chat & { type: 'chat' | 'friend' })[] = [
      ...chats.map(chat => ({ ...chat, type: 'chat' as const })),
      ...friends.map(friend => ({
        id: friend.id,
        type: 'friend' as const,
        name: friend.name,
        participants: [{ ...friend }]
      }))
    ]

    if (!searchQuery.trim()) {
      setFilteredItems(allItems)
    } else {
      const filtered = allItems.filter(item => {
        if (item.type === 'chat') {
          return item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        } else {
          return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.participants[0]?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        }
      })
      setFilteredItems(filtered)
    }
  }, [chats, friends, searchQuery])

  const handleToggleSelection = (itemId: string, itemType: 'chat' | 'friend') => {
    const newSelected = new Set(selectedChats)
    const key = `${itemType}:${itemId}`
    
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    
    setSelectedChats(newSelected)
  }

  const handleForward = async () => {
    if (selectedChats.size === 0) return

    setIsForwarding(true)
    try {
      const targetChatIds: string[] = []
      
      for (const selection of selectedChats) {
        const [type, id] = selection.split(':')
        
        if (type === 'chat') {
          targetChatIds.push(id)
        } else if (type === 'friend') {
          // Create or get chat with friend
          const chatId = await ChatService.createOrGetChat([user.id, id])
          targetChatIds.push(chatId)
        }
      }

      await onForward(targetChatIds)
      
      // Reset state
      setSelectedChats(new Set())
      setSearchQuery("")
      onOpenChange(false)
      
      toast.success(`Message${messageIds.length > 1 ? 's' : ''} forwarded successfully`)
    } catch (error) {
      console.error('Error forwarding messages:', error)
      toast.error('Failed to forward messages')
    } finally {
      setIsForwarding(false)
    }
  }

  const getDisplayName = (item: Chat & { type: 'chat' | 'friend' }) => {
    if (item.type === 'chat') {
      if (item.name) return item.name
      const otherParticipant = item.participants.find(p => p.id !== user?.id)
      return otherParticipant?.name || 'Unknown'
    }
    return item.name
  }

  const getDisplayAvatar = (item: Chat & { type: 'chat' | 'friend' }) => {
    if (item.type === 'chat' && item.participants.length === 2) {
      const otherParticipant = item.participants.find(p => p.id !== user?.id)
      return otherParticipant?.avatar
    }
    if (item.type === 'friend') {
      return item.participants[0]?.avatar
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Forward Message{messageIds.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats and friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Chat/Friend List */}
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? 'No results found' : 'No chats or friends available'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const key = `${item.type}:${item.id}`
                  const isSelected = selectedChats.has(key)
                  const displayName = getDisplayName(item)
                  const displayAvatar = getDisplayAvatar(item)

                  return (
                    <div
                      key={key}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleToggleSelection(item.id, item.type)}
                    >
                      <Checkbox checked={isSelected} />
                      
                      <div className="relative">
                        {displayAvatar ? (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={displayAvatar} />
                            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {item.type === 'chat' && item.participants.length > 2 ? (
                              <Users className="h-4 w-4 text-primary" />
                            ) : (
                              <span className="text-xs font-medium text-primary">
                                {displayName.charAt(0)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === 'chat' 
                            ? item.participants.length > 2 
                              ? `${item.participants.length} members`
                              : 'Direct chat'
                            : 'Friend'
                          }
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          {/* Selected count */}
          {selectedChats.size > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedChats.size} recipient{selectedChats.size > 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleForward}
            disabled={selectedChats.size === 0 || isForwarding}
          >
            {isForwarding ? 'Forwarding...' : 'Forward'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}