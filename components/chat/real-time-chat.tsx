"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CallComponent } from "@/components/ui/call-component"
import { Send, Paperclip, Smile, Phone, Video } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ChatService, FileService } from "@/lib/realtime-services"
import { toast } from "sonner"

interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'file'
  attachments?: any[]
  timestamp: Date
  isRead: boolean
}

interface Chat {
  id: string
  participants: {
    id: string
    name: string
    avatar?: string
    isOnline: boolean
  }[]
}

interface RealTimeChatProps {
  chatId?: string
  friendId?: string
  onClose?: () => void
}

export function RealTimeChat({ chatId, friendId, onClose }: RealTimeChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [chat, setChat] = useState<Chat | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video'
    isIncoming: boolean
    callerName: string
    callerAvatar?: string
    isMinimized: boolean
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize chat
  useEffect(() => {
    if (!user) return

    const initializeChat = async () => {
      try {
        let currentChatId = chatId

        // If no chatId but friendId provided, create or get chat
        if (!currentChatId && friendId) {
          currentChatId = await ChatService.createOrGetChat([user.id, friendId])
        }

        if (currentChatId) {
          // Subscribe to messages
          const unsubscribe = ChatService.subscribeToMessages(currentChatId, (newMessages) => {
            setMessages(newMessages)
          })

          return unsubscribe
        }
      } catch (error) {
        toast.error("Failed to load chat")
      }
    }

    const unsubscribe = initializeChat()
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub && unsub())
      }
    }
  }, [user, chatId, friendId])

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return

    const currentChatId = chatId || (friendId ? await ChatService.createOrGetChat([user.id, friendId]) : null)
    if (!currentChatId) return

    setIsSending(true)
    try {
      await ChatService.sendMessage(currentChatId, user.id, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const currentChatId = chatId || (friendId ? await ChatService.createOrGetChat([user.id, friendId]) : null)
    if (!currentChatId) return

    try {
      const fileUrl = await FileService.uploadFile(file, `chats/${currentChatId}/${Date.now()}_${file.name}`)
      
      await ChatService.sendMessage(
        currentChatId, 
        user.id, 
        file.type.startsWith('image/') ? 'Image' : file.name,
        file.type.startsWith('image/') ? 'image' : 'file',
        [{ name: file.name, url: fileUrl, type: file.type, size: file.size }]
      )
      
      toast.success("File sent!")
    } catch (error) {
      toast.error("Failed to send file")
    }
  }

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const formatMessageDate = (date: Date) => {
    const today = new Date()
    const messageDate = new Date(date)
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return messageDate.toLocaleDateString()
  }

  if (!user) {
    return <div>Please log in to use chat</div>
  }

  return (
    <>
      {/* Active Call Overlay */}
      {activeCall && (
        <CallComponent
          isIncoming={activeCall.isIncoming}
          callerName={activeCall.callerName}
          callerAvatar={activeCall.callerAvatar}
          callType={activeCall.type}
          isMinimized={activeCall.isMinimized}
          onAccept={() => {
            toast.success("Call connected!")
          }}
          onDecline={() => {
            setActiveCall(null)
          }}
          onEnd={() => {
            setActiveCall(null)
          }}
          onToggleMinimize={() => {
            setActiveCall(prev => prev ? { ...prev, isMinimized: !prev.isMinimized } : null)
          }}
        />
      )}

      <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" alt="Friend" />
              <AvatarFallback>F</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Chat</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isTyping ? "Typing..." : "Online"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveCall({
                type: 'voice',
                isIncoming: false,
                callerName: 'Friend',
                isMinimized: false
              })}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveCall({
                type: 'video',
                isIncoming: false,
                callerName: 'Friend',
                isMinimized: false
              })}
            >
              <Video className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.senderId === user.id
                const showDate = index === 0 || 
                  formatMessageDate(messages[index - 1].timestamp) !== formatMessageDate(message.timestamp)

                return (
                  <div key={message.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        {formatMessageDate(message.timestamp)}
                      </div>
                    )}

                    {/* Message */}
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        {!isOwnMessage && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src="/placeholder-user.jpg" alt="Friend" />
                              <AvatarFallback>F</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        
                        <div className={`rounded-lg p-3 ${
                          isOwnMessage 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {/* Message content */}
                          {message.type === 'text' && (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                          
                          {message.type === 'image' && message.attachments && (
                            <div className="space-y-2">
                              {message.content !== 'Image' && <p>{message.content}</p>}
                              {message.attachments.map((attachment, i) => (
                                <img
                                  key={i}
                                  src={attachment.url}
                                  alt="Shared image"
                                  className="max-w-full rounded"
                                />
                              ))}
                            </div>
                          )}
                          
                          {message.type === 'file' && message.attachments && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, i) => (
                                <div key={i} className="flex items-center space-x-2 p-2 bg-background/10 rounded">
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm">{attachment.name}</span>
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                                      Download
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className={`text-xs text-muted-foreground mt-1 ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </Card>
    </>
  )
}