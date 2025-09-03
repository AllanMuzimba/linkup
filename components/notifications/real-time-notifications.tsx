"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Heart, MessageCircle, UserPlus, Share2, AlertCircle, Check } from "lucide-react"
import { NotificationService } from "@/lib/realtime-services"

interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'admin_message' | 'post_mention' | 'share'
  title: string
  data: {
    message?: string
    fromUserId?: string
    fromUserName?: string
    fromUserAvatar?: string
    postId?: string
    postContent?: string
  }
  isRead: boolean
  createdAt: Date
}

export function RealTimeNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

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

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead)
      await Promise.all(
        unreadNotifications.map(notification => 
          NotificationService.markAsRead(notification.id)
        )
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'share':
        return <Share2 className="h-4 w-4 text-purple-500" />
      case 'admin_message':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!user) return null

  return (
    <Card className="border-border/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Notifications</CardTitle>
              <CardDescription>
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </CardDescription>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                You'll see notifications here when people interact with your posts or send you friend requests
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                  !notification.isRead ? 'bg-primary/5 border-primary/20' : 'border-border/50'
                }`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.data?.message || 'New activity on LinkUp'}
                  </p>
                  {notification.data?.postContent && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-primary/20">
                      "{notification.data.postContent.substring(0, 100)}
                      {notification.data.postContent.length > 100 ? '...' : ''}"
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-primary font-medium">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                    {notification.type === 'admin_message' && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
                {notification.data?.fromUserAvatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={notification.data.fromUserAvatar} 
                      alt={notification.data.fromUserName} 
                    />
                    <AvatarFallback>
                      {notification.data.fromUserName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for notification count
export function useNotificationCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      (notifications) => {
        setCount(notifications.filter(n => !n.isRead).length)
      }
    )

    return unsubscribe
  }, [user])

  return count
}