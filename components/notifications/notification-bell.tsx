"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Heart, MessageCircle, UserPlus, Share2, AlertCircle, Check, X } from "lucide-react"
import { NotificationService } from "@/lib/realtime-services"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'admin_message' | 'post_mention' | 'share' | 'message'
  title: string
  data: {
    message?: string
    fromUserId?: string
    fromUserName?: string
    fromUserAvatar?: string
    postId?: string
    postContent?: string
    chatId?: string
    messageId?: string
  }
  isRead: boolean
  createdAt: Date
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <Heart className="h-4 w-4 text-red-500" />
    case 'comment':
      return <MessageCircle className="h-4 w-4 text-blue-500" />
    case 'message':
      return <MessageCircle className="h-4 w-4 text-green-500" />
    case 'friend_request':
    case 'friend_accepted':
      return <UserPlus className="h-4 w-4 text-purple-500" />
    case 'share':
      return <Share2 className="h-4 w-4 text-orange-500" />
    case 'admin_message':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export function NotificationBell() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      (notifs) => {
        setNotifications(notifs)
        setUnreadCount(notifs.filter(n => !n.isRead).length)
      }
    )

    return unsubscribe
  }, [user])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await NotificationService.markAsRead(notification.id)
    }

    // Handle different notification types
    switch (notification.type) {
      case 'message':
        if (notification.data.chatId) {
          router.push(`/messages?chat=${notification.data.chatId}`)
        } else {
          router.push('/messages')
        }
        break
      case 'like':
      case 'comment':
      case 'share':
        if (notification.data.postId) {
          router.push(`/posts?post=${notification.data.postId}`)
        } else {
          router.push('/posts')
        }
        break
      case 'friend_request':
      case 'friend_accepted':
        router.push('/friends')
        break
      default:
        router.push('/notifications')
        break
    }

    setIsOpen(false)
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead)
    await Promise.all(
      unreadNotifications.map(notification => 
        NotificationService.markAsRead(notification.id)
      )
    )
  }

  const clearAllNotifications = async () => {
    // Implementation for clearing all notifications
    // This would require a new service method
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0">
                      {notification.data.fromUserAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={notification.data.fromUserAvatar} />
                          <AvatarFallback>
                            {notification.data.fromUserName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      {notification.data.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.data.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <Separator className="my-1" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              router.push('/notifications')
              setIsOpen(false)
            }}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}