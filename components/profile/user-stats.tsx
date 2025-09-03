"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Share, MessageCircle, Eye, Play, TrendingUp } from "lucide-react"
import type { UserStats } from "@/types/user"

interface UserStatsProps {
  stats: UserStats
}

export function UserStatsCard({ stats }: UserStatsProps) {
  const statItems = [
    {
      title: "Total Likes",
      value: stats.totalLikes.toLocaleString(),
      icon: Heart,
      color: "text-red-500",
      change: "+12%",
    },
    {
      title: "Total Shares",
      value: stats.totalShares.toLocaleString(),
      icon: Share,
      color: "text-blue-500",
      change: "+8%",
    },
    {
      title: "Comments",
      value: stats.totalComments.toLocaleString(),
      icon: MessageCircle,
      color: "text-green-500",
      change: "+15%",
    },
    {
      title: "Profile Views",
      value: stats.profileViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-500",
      change: "+23%",
    },
    {
      title: "Stories Viewed",
      value: stats.storiesViewed.toLocaleString(),
      icon: Play,
      color: "text-orange-500",
      change: "+5%",
    },
    {
      title: "Engagement Rate",
      value: "4.2%",
      icon: TrendingUp,
      color: "text-primary",
      change: "+2%",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{item.change}</span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
