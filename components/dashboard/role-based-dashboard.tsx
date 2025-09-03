"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, MessageCircle, TrendingUp, Bell, UserPlus, Activity, Heart, Share2 } from "lucide-react"
import { DashboardService, DashboardStats, RecentActivity } from "@/lib/dashboard-services"
import { NotificationService } from "@/lib/realtime-services"

interface OnlineFriend {
  id: string
  name: string
  username: string
  avatar?: string
  isOnline: boolean
  lastSeen: Date
}

export function RoleBasedDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    unreadNotifications: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    // Subscribe to role-based stats
    const unsubscribeStats = DashboardService.subscribeToRoleBasedStats(
      user.id,
      user.role,
      (newStats) => {
        setStats(prev => ({ ...prev, ...newStats }))
      }
    )

    // Subscribe to recent activities
    const unsubscribeActivities = DashboardService.subscribeToRecentActivities(
      user.id,
      user.role,
      setRecentActivities
    )

    // Subscribe to notifications
    const unsubscribeNotifications = NotificationService.subscribeToNotifications(
      user.id,
      (notifs) => {
        setNotifications(notifs)
        setStats(prev => ({
          ...prev,
          unreadNotifications: notifs.filter(n => !n.isRead).length
        }))
      }
    )

    // For regular users, also subscribe to online friends
    let unsubscribeOnlineFriends: (() => void) | undefined
    if (user.role === 'user') {
      unsubscribeOnlineFriends = DashboardService.subscribeToOnlineFriends(
        user.id,
        setOnlineFriends
      )
    }

    return () => {
      unsubscribeStats()
      unsubscribeActivities()
      unsubscribeNotifications()
      unsubscribeOnlineFriends?.()
    }
  }, [user])

  if (!user) return null

  // Define dashboard cards based on user role
  const getDashboardCards = () => {
    if (user.role === 'user') {
      return [
        {
          title: "Friends Online",
          value: stats.onlineFriends?.toString() || "0",
          change: `${stats.totalFriends || 0} total friends`,
          icon: Users,
          color: "text-green-500",
          description: "Friends currently online"
        },
        {
          title: "Notifications",
          value: stats.unreadNotifications.toString(),
          change: "Unread messages",
          icon: Bell,
          color: "text-orange-500",
          description: "New notifications"
        }
      ]
    } else {
      // Admin, Support, Developer roles
      return [
        {
          title: "Total Users",
          value: stats.totalUsers?.toLocaleString() || "0",
          change: `${stats.onlineUsers || 0} online`,
          icon: Users,
          color: "text-primary",
          description: "Registered users"
        },
        {
          title: "Online Now",
          value: stats.onlineUsers?.toString() || "0",
          change: "Active users",
          icon: MessageCircle,
          color: "text-green-500",
          description: "Currently active"
        },
        {
          title: "New Today",
          value: stats.newUsersToday?.toString() || "0",
          change: "New members",
          icon: TrendingUp,
          color: "text-blue-500",
          description: "Joined today"
        },
        {
          title: "Notifications",
          value: stats.unreadNotifications.toString(),
          change: "Unread",
          icon: Bell,
          color: "text-orange-500",
          description: "System notifications"
        }
      ]
    }
  }

  const dashboardCards = getDashboardCards()

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_friend':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'new_post':
        return <Activity className="h-4 w-4 text-green-500" />
      case 'post_engagement':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'friend_post':
        return <Share2 className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Welcome back, {user.name}!
              </h1>
              <p className="text-muted-foreground mt-1">
                {user.role === 'user' 
                  ? "Ready to connect and share on LinkUp today?" 
                  : "Managing your LinkUp community dashboard"
                }
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-l from-primary/5 to-transparent rounded-full transform translate-x-32 -translate-y-32" />
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${user.role !== 'user' ? 'lg:grid-cols-4' : ''} gap-6`}>
        {dashboardCards.map((stat, index) => (
          <Card key={stat.title} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <Badge 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary hover:bg-primary/15 border-primary/20"
              >
                {stat.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Online Friends (for regular users) */}
        {user.role === 'user' && (
          <Card className="border-border/50">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Friends Online</CardTitle>
                  <CardDescription>Friends who are currently active</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {onlineFriends.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No friends online right now</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Invite friends to join LinkUp!
                    </p>
                  </div>
                ) : (
                  onlineFriends.slice(0, 8).map((friend) => (
                    <div key={friend.id} className="flex items-center space-x-3 group hover:bg-muted/50 p-2 rounded-lg transition-colors">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar || "/placeholder-user.jpg"} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{friend.name}</p>
                        <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className={`border-border/50 ${user.role === 'user' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>
                  {user.role === 'user' 
                    ? "Your recent activities and friend updates" 
                    : "Latest platform activities"
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {user.role === 'user' 
                      ? "Start connecting with friends and creating posts!" 
                      : "Platform activity will appear here"
                    }
                  </p>
                </div>
              ) : (
                recentActivities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 group hover:bg-muted/50 p-3 rounded-lg transition-colors">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    {activity.userAvatar && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                        <AvatarFallback>{activity.userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}