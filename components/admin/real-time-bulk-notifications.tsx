"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Users, Bell, Calendar, Target, AlertCircle, MapPin } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { NotificationService, UserService } from "@/lib/realtime-services"
import { toast } from "sonner"

export function RealTimeBulkNotifications() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [targetAudience, setTargetAudience] = useState<"all" | "location" | "new_users" | "active_users">("all")
  const [location, setLocation] = useState("")
  const [radius, setRadius] = useState("50")
  const [isSending, setIsSending] = useState(false)
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    newUsersToday: 0
  })
  const [sentNotifications, setSentNotifications] = useState<any[]>([])

  // Get real-time user stats
  useEffect(() => {
    if (!user) return

    const unsubscribe = UserService.subscribeToUserStats((stats) => {
      setUserStats(stats)
    })

    return unsubscribe
  }, [user])

  // Send bulk notification
  const sendBulkNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in both title and message")
      return
    }

    if (!user || user.role !== 'super_admin') {
      toast.error("Only super admins can send bulk notifications")
      return
    }

    setIsSending(true)
    try {
      let targetUsers: string[] | undefined

      // Determine target users based on audience selection
      if (targetAudience === "location" && location.trim()) {
        // For location-based targeting, you'd implement location filtering
        // This is a simplified version
        targetUsers = undefined // Send to all for now
      } else if (targetAudience === "new_users") {
        // Target users who joined today
        targetUsers = undefined // Implement new user filtering
      } else if (targetAudience === "active_users") {
        // Target currently online users
        targetUsers = undefined // Implement active user filtering
      }

      await NotificationService.sendBulkNotification(title, message, targetUsers)
      
      // Add to sent notifications list
      const newNotification = {
        id: Date.now().toString(),
        title,
        message,
        targetAudience,
        location: targetAudience === "location" ? location : null,
        sentAt: new Date(),
        sentBy: user.name
      }
      setSentNotifications(prev => [newNotification, ...prev])

      // Reset form
      setTitle("")
      setMessage("")
      setTargetAudience("all")
      setLocation("")
      
      toast.success("Bulk notification sent successfully! 🎉")
      
    } catch (error) {
      console.error("Error sending bulk notification:", error)
      toast.error("Failed to send notification. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const getEstimatedReach = () => {
    switch (targetAudience) {
      case "all":
        return userStats.totalUsers
      case "active_users":
        return userStats.onlineUsers
      case "new_users":
        return userStats.newUsersToday
      case "location":
        return Math.floor(userStats.totalUsers * 0.3) // Estimate 30% in location
      default:
        return 0
    }
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-muted-foreground">Only super administrators can access bulk notifications.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{userStats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Online Now</p>
                    <p className="text-2xl font-bold">{userStats.onlineUsers.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">New Today</p>
                    <p className="text-2xl font-bold">{userStats.newUsersToday.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Send Bulk Notification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Title</label>
                <Input
                  placeholder="Enter notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
              </div>

              {/* Target Audience */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Target Audience</label>
                <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active_users">Currently Online Users</SelectItem>
                    <SelectItem value="new_users">New Users (Today)</SelectItem>
                    <SelectItem value="location">Users by Location</SelectItem>
                  </SelectContent>
                </Select>

                {/* Location-specific options */}
                {targetAudience === "location" && (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">Location Targeting</span>
                    </div>
                    <Input
                      placeholder="Enter city, country, or region..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Radius (km):</label>
                      <Select value={radius} onValueChange={setRadius}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Estimated reach */}
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    Estimated reach: <strong>{getEstimatedReach().toLocaleString()} users</strong>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Send Button */}
              <Button
                onClick={sendBulkNotification}
                disabled={!title.trim() || !message.trim() || isSending}
                className="w-full"
                size="lg"
              >
                {isSending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending to {getEstimatedReach().toLocaleString()} users...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Send to {getEstimatedReach().toLocaleString()} users</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
              {sentNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentNotifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Target: {notification.targetAudience.replace('_', ' ')}</span>
                            {notification.location && (
                              <span>Location: {notification.location}</span>
                            )}
                            <span>Sent by: {notification.sentBy}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {notification.sentAt.toLocaleDateString()}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.sentAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}