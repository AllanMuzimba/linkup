"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share, Clock } from "lucide-react"

interface Activity {
  id: string
  type: "post" | "like" | "comment" | "share" | "follow"
  content: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
  }
}

interface ActivityFeedProps {
  activities: Activity[]
}

const activityIcons = {
  post: Clock,
  like: Heart,
  comment: MessageCircle,
  share: Share,
  follow: Clock,
}

const activityColors = {
  post: "text-primary",
  like: "text-red-500",
  comment: "text-blue-500",
  share: "text-green-500",
  follow: "text-purple-500",
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type]
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-muted ${activityColors[activity.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {activity.user && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                        <AvatarFallback className="text-xs">{activity.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <Badge variant="secondary" className="text-xs capitalize">
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{activity.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
