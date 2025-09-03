"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Users, MessageSquare, Eye, Heart, Download } from "lucide-react"
import { useState } from "react"

export default function AnalyticsPage() {
  const { user, hasPermission } = useAuth()
  const [timeRange, setTimeRange] = useState("7d")

  if (!user || !hasPermission("view_analytics")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view analytics.</p>
        </div>
      </div>
    )
  }

  const analyticsData = {
    "7d": {
      totalUsers: 1247,
      activeUsers: 892,
      newUsers: 156,
      totalPosts: 3421,
      totalShares: 2847,
      engagement: 18.7,
      growth: 12.5,
    },
    "30d": {
      totalUsers: 1247,
      activeUsers: 1089,
      newUsers: 423,
      totalPosts: 12847,
      totalShares: 9234,
      engagement: 22.3,
      growth: 8.9,
    },
    "90d": {
      totalUsers: 1247,
      activeUsers: 1156,
      newUsers: 789,
      totalPosts: 34521,
      totalShares: 23456,
      engagement: 19.8,
      growth: 15.2,
    },
  }

  const currentData = analyticsData[timeRange as keyof typeof analyticsData]

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track platform performance and user engagement</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{currentData.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+{currentData.growth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{currentData.activeUsers.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+8.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{currentData.totalPosts.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+15.7%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">{currentData.engagement}%</p>
              </div>
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+5.2%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">New Users</span>
                <Badge variant="secondary">{currentData.newUsers}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Returning Users</span>
                <Badge variant="secondary">{currentData.activeUsers - currentData.newUsers}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Posts Created</span>
                <Badge variant="secondary">{currentData.totalPosts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Shares</span>
                <Badge variant="secondary">{currentData.totalShares}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. Engagement</span>
                <Badge variant="secondary">{currentData.engagement}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Content */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: "Platform Update Announcement", engagement: "24.5%", shares: 342, likes: 1247 },
              { title: "Community Guidelines Update", engagement: "18.7%", shares: 198, likes: 892 },
              { title: "New Feature Preview", engagement: "22.1%", shares: 267, likes: 1034 },
            ].map((post, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{post.title}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <span>Engagement: {post.engagement}</span>
                    <span>Shares: {post.shares}</span>
                    <span>Likes: {post.likes}</span>
                  </div>
                </div>
                <Badge variant="outline">#{index + 1}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
