"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Reply, 
  Forward, 
  Trash2, 
  Copy,
  X,
  ArrowLeft,
  Check,
  CheckCheck
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ChatService, FriendService } from "@/lib/realtime-services"
import { SoundService } from "@/lib/sound-service"
import { EnhancedMessageInput } from "@/components/chat/enhanced-message-input"
import { ForwardMessageDialog } from "@/components/chat/forward-message-dialog"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  chatId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document'
  mediaUrls?: string[]
  timestamp: Date
  isRead: boolean
  readBy?: string[]
  isDeleted?: boolean
  deletedFor?: 'sender' | 'everyone'
  replyTo?: {
    messageId: string
    content: string
    senderName: string
  }
}

interface Chat {
  id: string
  type: 'direct' | 'group'
  name?: string
  participants: {
    id: string
    name: string
    avatar?: string
    isOnline: boolean
  }[]
}

interface EnhancedRealTimeChatProps {
  chatId: string
  currentUserId: string
  onClose?: () => void
}

export function EnhancedRealTimeChat({ chatId, currentUserId, onClose }: EnhancedRealTimeChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [chat, setChat] = useState<Chat | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteType, setDeleteType] = useState<'sender' | 'everyone'>('sender')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showForwardDialog, setShowForwardDialog] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (!isSearching) {
      scrollToBottom()
    }
  }, [messages, isSearching])

  // Filter messages based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages)
      setIsSearching(false)
    } else {
      setIsSearching(true)
      const filtered = messages.filter(message =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredMessages(filtered)
    }
  }, [searchQuery, messages])

  // Subscribe to chat and messages
  useEffect(() => {
    if (!user || !chatId) return

    const unsubscribe = ChatService.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages.map(msg => {
        let timestamp = new Date()
        
        try {
          if (msg.timestamp) {
            if (msg.timestamp.toDate && typeof msg.timestamp.toDate === 'function') {
              // Firestore Timestamp
              timestamp = msg.timestamp.toDate()
            } else if (msg.timestamp instanceof Date) {
              timestamp = msg.timestamp
            } else {
              timestamp = new Date(msg.timestamp)
            }
          }
        } catch (error) {
          console.warn('Error parsing timestamp:', error)
          timestamp = new Date()
        }
        
        return {
          ...msg,
          timestamp: timestamp
        }
      }))
      
      // Play sound for new messages from others
      const lastMessage = newMessages[newMessages.length - 1]
      if (lastMessage && lastMessage.senderId !== user.id) {
        SoundService.playIncomingMessageSound(chatId)
      }
    })

    return unsubscribe
  }, [user, chatId])

  // Send message
  const handleSendMessage = async (content: string, mediaFiles?: any[]) => {
    if ((!content.trim() && !mediaFiles?.length) || !user || isSending) return

    setIsSending(true)
    try {
      if (replyingTo) {
        // Send reply
        await ChatService.replyToMessage(chatId, user.id, content, replyingTo.id)
      } else {
        // Send regular message
        await ChatService.sendMessage(chatId, user.id, content, 'text', mediaFiles)
      }
      
      setNewMessage("")
      setReplyingTo(null)
      
      // Play outgoing sound
      SoundService.playOutgoingSound()
      
      scrollToBottom()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  // Delete messages
  const handleDeleteMessages = async () => {
    if (selectedMessages.size === 0) return

    try {
      const deletePromises = Array.from(selectedMessages).map(messageId =>
        ChatService.deleteMessage(messageId, deleteType, user.id)
      )
      
      await Promise.all(deletePromises)
      
      setSelectedMessages(new Set())
      setIsSelectionMode(false)
      setShowDeleteDialog(false)
      
      toast.success(`Message${selectedMessages.size > 1 ? 's' : ''} deleted`)
    } catch (error) {
      console.error("Error deleting messages:", error)
      toast.error("Failed to delete messages")
    }
  }

  // Forward messages
  const handleForwardMessages = () => {
    if (selectedMessages.size === 0) return
    setShowForwardDialog(true)
  }

  // Handle forward to chats
  const handleForwardToChats = async (targetChatIds: string[]) => {
    if (selectedMessages.size === 0) return

    try {
      const forwardPromises = Array.from(selectedMessages).map(messageId =>
        ChatService.forwardMessage(messageId, targetChatIds, user.id)
      )
      
      await Promise.all(forwardPromises)
      
      setSelectedMessages(new Set())
      setIsSelectionMode(false)
      
    } catch (error) {
      console.error("Error forwarding messages:", error)
      throw error
    }
  }

  // Copy message content
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success("Message copied to clipboard")
  }

  // Toggle message selection
  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages)
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId)
    } else {
      newSelected.add(messageId)
    }
    setSelectedMessages(newSelected)
    
    if (newSelected.size === 0) {
      setIsSelectionMode(false)
    }
  }

  // Start selection mode
  const startSelectionMode = (messageId: string) => {
    setIsSelectionMode(true)
    setSelectedMessages(new Set([messageId]))
  }

  // Cancel selection mode
  const cancelSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedMessages(new Set())
  }

  // Get chat display info
  const getChatDisplayInfo = () => {
    if (!chat) return { name: 'Loading...', avatar: null, isOnline: false }
    
    if (chat.type === 'group') {
      return {
        name: chat.name || 'Group Chat',
        avatar: null,
        isOnline: false,
        memberCount: chat.participants.length
      }
    }
    
    const otherParticipant = chat.participants.find(p => p.id !== user?.id)
    return {
      name: otherParticipant?.name || 'Unknown',
      avatar: otherParticipant?.avatar,
      isOnline: otherParticipant?.isOnline || false
    }
  }

  const chatInfo = getChatDisplayInfo()

  // Format message time
  const formatMessageTime = (timestamp: Date | any) => {
    try {
      // Handle various timestamp formats
      let messageDate: Date
      
      if (!timestamp) {
        return 'Just now'
      }
      
      if (timestamp instanceof Date) {
        messageDate = timestamp
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp
        messageDate = timestamp.toDate()
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        messageDate = new Date(timestamp)
      } else {
        return 'Just now'
      }
      
      // Validate the date
      if (isNaN(messageDate.getTime())) {
        return 'Just now'
      }
      
      const now = new Date()
      
      // Check if it's today
      if (now.toDateString() === messageDate.toDateString()) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      // Use relative time for other days
      return formatDistanceToNow(messageDate, { addSuffix: true })
    } catch (error) {
      console.warn('Error formatting message time:', error)
      return 'Just now'
    }
  }

  // Render message item
  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === user?.id
    const isSelected = selectedMessages.has(message.id)
    const isDeleted = message.isDeleted

    if (isDeleted && message.deletedFor === 'everyone') {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <span className="text-xs text-muted-foreground italic">
            This message was deleted
          </span>
        </div>
      )
    }

    if (isDeleted && message.deletedFor === 'sender' && isOwn) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <span className="text-xs text-muted-foreground italic">
            You deleted this message
          </span>
        </div>
      )
    }

    return (
      <div
        key={message.id}
        className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'} ${
          isSelected ? 'bg-primary/10 rounded-lg p-1' : ''
        }`}
      >
        <div className={`flex items-start space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isOwn && (
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.senderAvatar} />
              <AvatarFallback>{message.senderName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          )}
          
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            {!isOwn && (
              <span className="text-xs text-muted-foreground mb-1">
                {message.senderName}
              </span>
            )}
            
            {message.replyTo && (
              <div className="bg-muted/50 border-l-2 border-primary pl-2 py-1 mb-1 text-xs">
                <div className="font-medium">{message.replyTo.senderName}</div>
                <div className="text-muted-foreground truncate">
                  {message.replyTo.content}
                </div>
              </div>
            )}
            
            <div
              className={`relative group rounded-lg px-2 py-1 ${
                isOwn
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
              onClick={() => isSelectionMode && toggleMessageSelection(message.id)}
            >
              {isSelectionMode && (
                <Checkbox
                  checked={isSelected}
                  className="absolute -top-2 -left-2 bg-background"
                  onChange={() => toggleMessageSelection(message.id)}
                />
              )}
              
              <div className="break-words">{message.content}</div>
              
              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                <span className="text-xs">
                  {formatMessageTime(message.timestamp)}
                </span>
                {isOwn && (
                  <div className="flex">
                    {message.readBy?.length > 1 ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Message options menu */}
              {!isSelectionMode && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyMessage(message.content)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => startSelectionMode(message.id)}>
                        <Forward className="h-4 w-4 mr-2" />
                        Select
                      </DropdownMenuItem>
                      {isOwn && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedMessages(new Set([message.id]))
                              setShowDeleteDialog(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="h-[500px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="flex-shrink-0 pb-3 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex items-center space-x-3">
              {chatInfo.avatar ? (
                <Avatar>
                  <AvatarImage src={chatInfo.avatar} />
                  <AvatarFallback>{chatInfo.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {chatInfo.name.charAt(0)}
                  </span>
                </div>
              )}
              
              <div>
                <h3 className="font-medium">{chatInfo.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {chat?.type === 'group' 
                    ? `${chatInfo.memberCount} members`
                    : chatInfo.isOnline ? 'Online' : 'Offline'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-8"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
            
            {/* Selection mode controls */}
            {isSelectionMode && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedMessages.size} selected
                </Badge>
                <Button size="sm" variant="outline" onClick={handleForwardMessages}>
                  <Forward className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedMessages.size === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelSelectionMode}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Call buttons */}
            {!isSelectionMode && (
              <>
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area - Fixed Height with Scroll */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea 
          ref={messagesContainerRef}
          className="h-[320px] px-4"
        >
          <div className="py-2">
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No messages found' : 'No messages yet'}
                </p>
              </div>
            ) : (
              filteredMessages.map(renderMessage)
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-3 py-1 bg-muted/50 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                Replying to {replyingTo.senderName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {replyingTo.content}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 ml-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Input - Fixed at Bottom */}
      <div className="flex-shrink-0 border-t">
        <EnhancedMessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
          disabled={isSending}
          placeholder="Type a message..."
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message{selectedMessages.size > 1 ? 's' : ''}?</DialogTitle>
            <DialogDescription>
              Choose how you want to delete {selectedMessages.size > 1 ? 'these messages' : 'this message'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="delete-sender"
                name="deleteType"
                value="sender"
                checked={deleteType === 'sender'}
                onChange={(e) => setDeleteType(e.target.value as 'sender' | 'everyone')}
              />
              <label htmlFor="delete-sender" className="text-sm">
                Delete for me only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="delete-everyone"
                name="deleteType"
                value="everyone"
                checked={deleteType === 'everyone'}
                onChange={(e) => setDeleteType(e.target.value as 'sender' | 'everyone')}
              />
              <label htmlFor="delete-everyone" className="text-sm">
                Delete for everyone
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMessages}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        open={showForwardDialog}
        onOpenChange={setShowForwardDialog}
        messageIds={Array.from(selectedMessages)}
        onForward={handleForwardToChats}
      />
    </Card>
  )
}