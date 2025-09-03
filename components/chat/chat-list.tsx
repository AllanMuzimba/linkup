"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, MessageCircle, Users, Plus } from "lucide-react"
import type { Chat } from "@/types/chat"

interface ChatListProps {
  chats: Chat[]
  selectedChatId?: string
  onSelectChat: (chatId: string) => void
  onCreateGroup: () => void
}

export function ChatList({ chats, selectedChatId, onSelectChat, onCreateGroup }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredChats = chats.filter((chat) => {
    const chatName = chat.name || chat.participants.map((p) => p.name).join(", ")
    return chatName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button size="sm" onClick={onCreateGroup}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{searchQuery ? "No conversations found" : "No conversations yet"}</p>
          </div>
        ) : (
          <div>
            {filteredChats.map((chat) => {
              const chatName = chat.name || chat.participants.map((p) => p.name).join(", ")
              const chatAvatar = chat.avatar || chat.participants[0]?.avatar

              return (
                <div
                  key={chat.id}
                  className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedChatId === chat.id ? "bg-muted" : ""
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="relative">
                    {chat.type === "group" ? (
                      <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-foreground" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chatAvatar || "/placeholder.svg"} alt={chatName} />
                        <AvatarFallback>{chatName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    {chat.participants.some((p) => p.id !== "current-user" && p.id) && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{chatName}</p>
                      <div className="flex items-center space-x-2">
                        {chat.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(chat.lastMessage.timestamp)}
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="text-xs min-w-[20px] h-5 flex items-center justify-center"
                          >
                            {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.isTyping.length > 0
                          ? `${chat.isTyping[0]} is typing...`
                          : chat.lastMessage?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
