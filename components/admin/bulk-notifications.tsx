"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Send, Clock, Users, Shield, AlertTriangle, CheckCircle, CalendarIcon, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PERMISSIONS } from "@/types/auth"
import type { BulkNotification } from "@/types/admin"
import { format } from "date-fns"

// Mock data
const mockNotifications: BulkNotification[] = [
  {
    id: "1",
    title: "System Maintenance Notice",
    message:
      "We will be performing scheduled maintenance on Sunday from 2-4 AM EST. The platform may be temporarily unavailable.",
    type: "warning",
    targetAudience: "all",
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    sentBy: { id: "admin1", name: "System Admin" },
    status: "sent",
    recipientCount: 2847,
    readCount: 1923,
  },
  {
    id: "2",
    title: "New Features Available",
    message: "Check out our latest updates including improved messaging and enhanced profile customization!",
    type: "success",
    targetAudience: "users",
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    sentBy: { id: "admin2", name: "Product Team" },
    status: "sent",
    recipientCount: 2156,
    readCount: 1834,
  },
  {
    id: "3",
    title: "Security Update Required",
    message: "Please update your passwords and enable two-factor authentication for enhanced security.",
    type: "error",
    targetAudience: "all",
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24),
    sentBy: { id: "admin1", name: "Security Team" },
    status: "scheduled",
    recipientCount: 2847,
    readCount: 0,
  },
]

export function BulkNotifications() {
  const { hasPermission } = useAuth()
  const [notifications, setNotifications] = useState<BulkNotification[]>(mockNotifications)
  const [isCreating, setIsCreating] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as const,
    targetAudience: "all" as const,
    scheduledFor: undefined as Date | undefined,
  })

  const canSendNotifications = hasPermission(PERMISSIONS.SEND_BULK_NOTIFICATIONS)

  const handleCreateNotification = () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) return

    const notification: BulkNotification = {
      id: Date.now().toString(),
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      targetAudience: newNotification.targetAudience,
      scheduledFor: newNotification.scheduledFor,
      sentBy: { id: "current-user", name: "Current User" },
      status: newNotification.scheduledFor ? "scheduled" : "sent",
      recipientCount: getRecipientCount(newNotification.targetAudience),
      readCount: 0,
      ...(newNotification.scheduledFor ? {} : { sentAt: new Date() }),
    }

    setNotifications([notification, ...notifications])
    setNewNotification({
      title: "",
      message: "",
      type: "info",
      targetAudience: "all",
      scheduledFor: undefined,
    })
    setIsCreating(false)
  }

  const getRecipientCount = (audience: string) => {
    switch (audience) {
      case "all":
        return 2847
      case "users":
        return 2156
      case "admins":
        return 45
      default:
        return 0
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (notification: BulkNotification) => {
    switch (notification.status) {
      case "sent":
        return <Badge variant="secondary">Sent</Badge>
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return null
    }
  }

  if (!canSendNotifications) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to send bulk notifications.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.filter((n) => n.status === "sent").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.filter((n) => n.status === "scheduled").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.reduce((sum, n) => sum + n.recipientCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (notifications.reduce((sum, n) => sum + n.readCount, 0) /
                  notifications.reduce((sum, n) => sum + n.recipientCount, 0)) *
                  100,
              )}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Notification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Notifications</CardTitle>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Bulk Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      placeholder="Notification title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      placeholder="Notification message"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select
                      value={newNotification.targetAudience}
                      onValueChange={(value: any) => setNewNotification({ ...newNotification, targetAudience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users ({getRecipientCount("all").toLocaleString()})</SelectItem>
                        <SelectItem value="users">
                          Regular Users ({getRecipientCount("users").toLocaleString()})
                        </SelectItem>
                        <SelectItem value="admins">Admins ({getRecipientCount("admins").toLocaleString()})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Schedule (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newNotification.scheduledFor
                            ? format(newNotification.scheduledFor, "PPP")
                            : "Send immediately"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newNotification.scheduledFor}
                          onSelect={(date) => setNewNotification({ ...newNotification, scheduledFor: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateNotification} className="flex-1">
                      {newNotification.scheduledFor ? "Schedule" : "Send Now"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{notification.title}</h3>
                        {getStatusBadge(notification)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>To: {notification.targetAudience}</span>
                        <span>{notification.recipientCount.toLocaleString()} recipients</span>
                        {notification.status === "sent" && <span>{notification.readCount.toLocaleString()} read</span>}
                        <span>
                          {notification.sentAt
                            ? `Sent ${format(notification.sentAt, "MMM d, yyyy")}`
                            : notification.scheduledFor
                              ? `Scheduled for ${format(notification.scheduledFor, "MMM d, yyyy")}`
                              : "Draft"}
                        </span>
                        <span>By: {notification.sentBy.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
