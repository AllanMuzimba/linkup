"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users, Image, File, Play, Download, Eye, Phone, Video, PhoneOff, Paperclip, Smile, Send, MessageSquare, Trash2, Share, Archive } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { EnhancedMessageInput } from "@/components/ui/enhanced-message-input"
import { CallComponent } from "@/components/ui/call-component"
import type { Chat, ChatMessage, FileAttachment, CallState } from "@/types/chat"

interface ChatWindowProps {
  chat: Chat
  messages: ChatMessage[]
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void
  onStartTyping: () => void
  onStopTyping: () => void
  onStartCall?: (type: "audio" | "video", participantId: string) => void
  onEndCall?: () => void
  onToggleMute?: () => void
  onToggleVideo?: () => void
}

export function ChatWindow({ 
  chat, 
  messages, 
  onSendMessage, 
  onStartTyping, 
  onStopTyping,
  onStartCall,
  onEndCall,
  onToggleMute,
  onToggleVideo
}: ChatWindowProps) {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [callState, setCallState] = useState<CallState | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (content: string, attachments?: FileAttachment[]) => {
    if (content.trim() || attachments?.length) {
      onSendMessage(content.trim(), attachments)
      setNewMessage("")
      handleStopTyping()
    }
  }

  // Define chatName before using it
  const chatName =
    chat.name ||
    chat.participants
      .filter((p) => p.id !== user?.id)
      .map((p) => p.name)
      .join(", ")
  const chatAvatar = chat.avatar || chat.participants.find((p) => p.id !== user?.id)?.avatar

  const handleStartCall = (type: "audio" | "video", participantId: string) => {
    const newCallState: CallState = {
      isActive: true,
      type,
      participantId,
      participantName: chatName,
      startTime: new Date(),
      status: "calling" as const,
      isMuted: false,
      isVideoEnabled: type === "video"
    }
    setCallState(newCallState)
    onStartCall?.(type, participantId)
  }

  const handleEndCall = () => {
    setCallState(null)
    onEndCall?.()
  }

  const handleToggleMute = () => {
    if (callState) {
      setCallState({ ...callState, isMuted: !callState.isMuted })
      onToggleMute?.()
    }
  }

  const handleToggleVideo = () => {
    if (callState) {
      setCallState({ ...callState, isVideoEnabled: !callState.isVideoEnabled })
      onToggleVideo?.()
    }
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)

    if (!isTyping && value.trim()) {
      setIsTyping(true)
      onStartTyping()
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 1000)
  }

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false)
      onStopTyping()
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleSelectChat = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedMessages(new Set())
  }

  const handleDeleteSelected = () => {
    if (selectedMessages.size === 0) return

    // In a real app, you would call an API to delete messages
    console.log("Deleting messages:", Array.from(selectedMessages))

    // Reset selection
    setSelectedMessages(new Set())
    setIsSelectionMode(false)

    // You could also update the messages state here to remove deleted messages
    // For now, just showing the functionality
  }

  const handleShareSelected = () => {
    if (selectedMessages.size === 0) return

    const selectedMessageData = messages.filter(msg => selectedMessages.has(msg.id))
    console.log("Sharing/forwarding messages:", selectedMessageData)

    // In a real app, you would open a share dialog or forward dialog
    // For now, just showing the functionality
  }

  const handleExportToZip = () => {
    if (selectedMessages.size === 0) return

    const selectedMessageData = messages.filter(msg => selectedMessages.has(msg.id))
    console.log("Exporting messages to ZIP:", selectedMessageData)

    // In a real app, you would generate and download a ZIP file
    // For now, just showing the functionality
  }

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages)
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId)
    } else {
      newSelected.add(messageId)
    }
    setSelectedMessages(newSelected)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const renderAttachment = (attachment: FileAttachment) => {
    const getIcon = () => {
      switch (attachment.type) {
        case "image": return <Image className="h-4 w-4" />
        case "video": return <Play className="h-4 w-4" />
        case "audio": return <Play className="h-4 w-4" />
        case "document": return <File className="h-4 w-4" />
        default: return <File className="h-4 w-4" />
      }
    }

    return (
      <div key={attachment.id} className="mt-2 p-2 bg-muted/50 rounded border max-w-xs">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachment.size)}
              {attachment.duration && ` • ${Math.floor(attachment.duration / 60)}:${(attachment.duration % 60).toString().padStart(2, '0')}`}
            </p>
          </div>
          <div className="flex space-x-1">
            {attachment.type === "image" && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Eye className="h-3 w-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {attachment.type === "image" && (
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="mt-2 max-w-full h-auto rounded cursor-pointer"
            style={{ maxHeight: "200px" }}
          />
        )}
      </div>
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      })
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = message.timestamp.toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
      return groups
    },
    {} as Record<string, ChatMessage[]>,
  )

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Chat Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {chat.type === "group" ? (
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarImage src={chatAvatar || "/placeholder.svg"} alt={chatName} />
                <AvatarFallback>{chatName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="font-medium">
                {isSelectionMode ? `${selectedMessages.size} selected` : chatName}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSelectionMode
                  ? "Select messages to delete, share, or export"
                  : chat.type === "group"
                    ? `${chat.participants.length} members`
                    : chat.isTyping.length > 0
                      ? "typing..."
                      : "online"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Call status indicator */}
            {callState?.isActive && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-primary/10 rounded-lg">
                {callState.type === "video" ? (
                  <Video className="h-3 w-3 text-primary" />
                ) : (
                  <Phone className="h-3 w-3 text-primary" />
                )}
                <span className="text-xs text-primary font-medium">
                  {callState.status === "connected" ? "On call" : "Calling..."}
                </span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleEndCall}
                  className="h-6 w-6 p-0 ml-1"
                >
                  <PhoneOff className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )}
            
            {/* Call initiation buttons */}
            {!callState?.isActive && (
              <>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleStartCall("audio", chat.participants.find(p => p.id !== user?.id)?.id || "")}
                  title="Start audio call"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleStartCall("video", chat.participants.find(p => p.id !== user?.id)?.id || "")}
                  title="Start video call"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSelectChat}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isSelectionMode ? "Cancel Selection" : "Select Messages"}
                </DropdownMenuItem>
                {isSelectionMode && selectedMessages.size > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteSelected}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedMessages.size})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareSelected}>
                      <Share className="h-4 w-4 mr-2" />
                      Share/Forward Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportToZip}>
                      <Archive className="h-4 w-4 mr-2" />
                      Export to ZIP
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: '120px' }}>
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                {formatDate(new Date(date))}
              </div>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id
              const showAvatar = !isOwnMessage && (index === 0 || dayMessages[index - 1].senderId !== message.senderId)

              return (
                <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-2 group`}>
                  {/* Selection checkbox */}
                  {isSelectionMode && (
                    <div className="flex items-center mr-2">
                      <Checkbox
                        checked={selectedMessages.has(message.id)}
                        onCheckedChange={() => toggleMessageSelection(message.id)}
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div
                    className={`flex items-end space-x-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""} ${
                      isSelectionMode ? "cursor-pointer" : ""
                    }`}
                    onClick={isSelectionMode ? () => toggleMessageSelection(message.id) : undefined}
                  >
                    {showAvatar && !isOwnMessage && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={message.sender.avatar || "/placeholder.svg"} alt={message.sender.name} />
                        <AvatarFallback className="text-xs">{message.sender.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    {!showAvatar && !isOwnMessage && <div className="w-6" />}

                    <div
                      className={`rounded-lg px-3 py-2 transition-all ${
                        isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      } ${
                        selectedMessages.has(message.id) ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                    >
                      {!isOwnMessage && showAvatar && <p className="text-xs font-medium mb-1">{message.sender.name}</p>}
                      <p className="text-sm">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {message.attachments.map(renderAttachment)}
                        </div>
                      )}
                      {message.type === "image" && (
                        <div className="mt-2">
                          <img
                            src={message.content}
                            alt="Shared image"
                            className="max-w-xs rounded-lg cursor-pointer"
                            onClick={() => window.open(message.content, "_blank")}
                          />
                        </div>
                      )}
                      {message.type === "call" && message.callData && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center space-x-2">
                            {message.callData.type === "video" ? (
                              <Video className="h-4 w-4 text-primary" />
                            ) : (
                              <Phone className="h-4 w-4 text-primary" />
                            )}
                            <span className="text-sm font-medium">
                              {message.callData.type === "video" ? "Video" : "Voice"} Call
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.callData.status === "completed" && message.callData.duration
                                ? `${Math.floor(message.callData.duration / 60)}:${(message.callData.duration % 60).toString().padStart(2, '0')}`
                                : message.callData.status}
                            </span>
                          </div>
                        </div>
                      )}
                      <p
                        className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {chat.isTyping.length > 0 && (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">T</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed to bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 z-20">
        <EnhancedMessageInput
          value={newMessage}
          onChange={handleInputChange}
          onSend={handleSendMessage}
          onStartTyping={onStartTyping}
          onStopTyping={onStopTyping}
          placeholder="Type a message..."
        />
      </div>

      {/* Call Component Overlay */}
      <CallComponent
        callState={callState}
        onStartCall={handleStartCall}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        participantName={chatName}
        participantAvatar={chatAvatar}
        participantId={chat.participants.find(p => p.id !== user?.id)?.id || ""}
      />
    </div>
  )
}
