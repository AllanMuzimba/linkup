"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { EnhancedRealTimeChat } from "@/components/chat/enhanced-real-time-chat"
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Plus, Users, Phone, Video, Search, X, Volume2, VolumeX, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { ChatService, FriendService } from "@/lib/realtime-services"
import { UnreadMessageService } from "@/lib/unread-message-service"
import { SoundService } from "@/lib/sound-service"
import { useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

export default function MessagesPage() {
  // Redirect to enhanced version for now
  return <EnhancedMessagesPage />
}

function EnhancedMessagesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [filteredFriends, setFilteredFriends] = useState<any[]>([])
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [friendSearchQuery, setFriendSearchQuery] = useState("")
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map())
  const [mutedChats, setMutedChats] = useState<string[]>([])
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

  // Subscribe to user's chats
  useEffect(() => {
    if (!user) return

    setIsPageLoading(true)

    const unsubscribeChats = ChatService.subscribeToUserChats(user.id, (userChats) => {
      // Sort chats by most recent activity
      const sortedChats = userChats.sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt
        const bTime = b.updatedAt || b.createdAt
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })
      setChats(sortedChats)
      setIsPageLoading(false)
    })

    const unsubscribeFriends = FriendService.subscribeToFriends(user.id, (userFriends) => {
      setFriends(userFriends)
      setFilteredFriends(userFriends)
    })

    // Fallback to stop loading after 2 seconds
    const loadingTimeout = setTimeout(() => {
      setIsPageLoading(false)
    }, 2000)

    return () => {
      unsubscribeChats()
      unsubscribeFriends()
      clearTimeout(loadingTimeout)
    }
  }, [user])

  // Handle URL parameters for direct chat opening
  useEffect(() => {
    const chatId = searchParams.get('chat')
    if (chatId) {
      setSelectedChatId(chatId)
    }
  }, [searchParams])

  // Filter friends based on search query
  useEffect(() => {
    if (!friendSearchQuery.trim()) {
      setFilteredFriends(friends)
    } else {
      const filtered = friends.filter(friend =>
        friend.name?.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
        friend.username?.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
        friend.email?.toLowerCase().includes(friendSearchQuery.toLowerCase())
      )
      setFilteredFriends(filtered)
    }
  }, [friendSearchQuery, friends])

  // Initialize sound service and load muted chats
  useEffect(() => {
    SoundService.initialize()
    setMutedChats(SoundService.getMutedChats())
  }, [])

  // Subscribe to unread messages
  useEffect(() => {
    if (!user) return

    const unsubscribe = UnreadMessageService.subscribeToUnreadMessages(
      user.id,
      (unreadData) => {
        const newUnreadCounts = new Map<string, number>()
        let total = 0
        
        unreadData.forEach(data => {
          newUnreadCounts.set(data.chatId, data.unreadCount)
          total += data.unreadCount
        })
        
        setUnreadCounts(newUnreadCounts)
        setTotalUnreadCount(total)
      }
    )

    return unsubscribe
  }, [user])

  const createGroupChat = async () => {
    if (!user || !groupName.trim() || selectedFriends.length === 0) return

    try {
      const participantIds = [user.id, ...selectedFriends]
      const chatId = await ChatService.createOrGetChat(participantIds, groupName, true)
      
      setSelectedChatId(chatId)
      setIsCreateGroupOpen(false)
      setGroupName("")
      setSelectedFriends([])
    } catch (error) {
      console.error("Error creating group chat:", error)
    }
  }

  const startNewChat = async (friendId: string) => {
    try {
      const chatId = await ChatService.createOrGetChat([user.id, friendId])
      setSelectedChatId(chatId)
      setIsNewChatOpen(false)
      
      // Mark chat as read when opened
      if (user) {
        await UnreadMessageService.markChatAsRead(chatId, user.id)
      }
    } catch (error) {
      console.error("Error creating chat:", error)
    }
  }

  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId)
    
    // Mark chat as read when opened
    if (user) {
      await UnreadMessageService.markChatAsRead(chatId, user.id)
    }
  }

  const toggleChatMute = (chatId: string) => {
    const isMuted = SoundService.toggleChatMute(chatId)
    setMutedChats(SoundService.getMutedChats())
    return isMuted
  }

  const deleteChat = async (chatId: string) => {
    try {
      await ChatService.deleteChat(chatId, user.id)
      if (selectedChatId === chatId) {
        setSelectedChatId(null)
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  const formatLastMessageTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  if (!user) {
    return <div>Please log in to view messages</div>
  }

  if (isPageLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-6xl mx-auto p-6">
            <LoadingSpinner size="lg" text="Loading messages..." />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 h-full">
            {/* Chat List - Compact */}
            <div className="md:col-span-4 lg:col-span-3">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">Chats</CardTitle>
                      {totalUnreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center text-xs">
                          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setIsNewChatOpen(true)}
                        className="h-8 px-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New
                      </Button>
                      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2">
                            <Users className="h-4 w-4 mr-1" />
                            Group
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Group Chat</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Group name"
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                            />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Select Friends:</p>
                              <ScrollArea className="h-32 border rounded-md p-2">
                                {friends.map((friend) => (
                                  <div key={friend.id} className="flex items-center space-x-2 p-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedFriends.includes(friend.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedFriends(prev => [...prev, friend.id])
                                        } else {
                                          setSelectedFriends(prev => prev.filter(id => id !== friend.id))
                                        }
                                      }}
                                    />
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={friend.avatar} alt={friend.name} />
                                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{friend.name}</span>
                                  </div>
                                ))}
                              </ScrollArea>
                            </div>
                            <Button 
                              onClick={createGroupChat} 
                              disabled={!groupName.trim() || selectedFriends.length === 0}
                              className="w-full"
                            >
                              Create Group
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-1 p-2">
                      {chats.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">
                            No conversations yet
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setIsNewChatOpen(true)}
                            className="mt-2"
                          >
                            Start New Chat
                          </Button>
                        </div>
                      ) : (
                      chats.map((chat) => {
                        const otherParticipants = chat.participants.filter((p: any) => p.id !== user?.id)
                        const displayName = chat.type === 'group' ? chat.name : otherParticipants[0]?.name || 'Unknown'
                        const displayAvatar = chat.type === 'group' ? null : otherParticipants[0]?.avatar
                        const unreadCount = unreadCounts.get(chat.id) || 0
                        const hasUnread = unreadCount > 0
                        const isMuted = mutedChats.includes(chat.id)
                        const isOnline = chat.type !== 'group' && otherParticipants[0]?.isOnline
                        
                        return (
                          <div
                            key={chat.id}
                            className={`p-2 hover:bg-muted/50 cursor-pointer transition-colors relative group rounded-lg ${
                              selectedChatId === chat.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => handleChatSelect(chat.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {chat.type === 'group' ? (
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-primary" />
                                  </div>
                                ) : (
                                  <Avatar>
                                    <AvatarImage src={displayAvatar || "/placeholder-user.jpg"} alt={displayName} />
                                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                )}
                                {isOnline && (
                                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`truncate ${hasUnread ? 'font-bold' : 'font-medium'}`}>
                                    {displayName}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    {chat.lastMessage && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatLastMessageTime(chat.lastMessage.timestamp?.toDate() || new Date())}
                                      </span>
                                    )}
                                    {hasUnread && (
                                      <Badge variant="destructive" className="h-4 min-w-[16px] text-xs px-1">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm text-muted-foreground truncate ${hasUnread ? 'font-medium' : ''}`}>
                                    {chat.lastMessage ? chat.lastMessage.content || 'Media message' : 'No messages yet'}
                                  </p>
                                  <div className="flex items-center space-x-1">
                                    {isMuted && (
                                      <VolumeX className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    {chat.type === 'group' && (
                                      <Badge variant="secondary" className="text-xs">
                                        {chat.participants.length}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Chat Options Menu */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    toggleChatMute(chat.id)
                                  }}>
                                    {isMuted ? (
                                      <>
                                        <Volume2 className="h-4 w-4 mr-2" />
                                        Unmute
                                      </>
                                    ) : (
                                      <>
                                        <VolumeX className="h-4 w-4 mr-2" />
                                        Mute
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm('Are you sure you want to delete this chat?')) {
                                        deleteChat(chat.id)
                                      }
                                    }}
                                    className="text-destructive"
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Delete Chat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      })
                    )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            {/* Chat Window */}
            <div className="md:col-span-8 lg:col-span-9">
              {selectedChatId ? (
                <ChatErrorBoundary>
                  <EnhancedRealTimeChat 
                    chatId={selectedChatId}
                    currentUserId={user.id}
                    onClose={() => {
                      setSelectedChatId(null)
                    }}
                  />
                </ChatErrorBoundary>
              ) : (
                <Card className="h-full">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Welcome to Messages</h3>
                        <p className="text-muted-foreground mb-4">
                          Select a conversation to start messaging
                        </p>
                        <Button onClick={() => setIsNewChatOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Start New Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* New Chat Dialog */}
          <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search friends..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {friendSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFriendSearchQuery("")}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Friends List */}
                <ScrollArea className="h-64 border rounded-md">
                  <div className="p-2">
                    {filteredFriends.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          {friendSearchQuery ? 'No friends found' : 'No friends yet'}
                        </p>
                      </div>
                    ) : (
                      filteredFriends.map((friend) => (
                        <div
                          key={friend.id}
                          onClick={() => startNewChat(friend.id)}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={friend.avatar || "/placeholder-user.jpg"} />
                              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {friend.isOnline && (
                              <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 border border-background rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{friend.name}</p>
                            <p className="text-xs text-muted-foreground">
                              @{friend.username || 'username'}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {friend.isOnline ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Online
                              </Badge>
                            ) : (
                              <span>Offline</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}