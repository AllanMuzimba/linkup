"use client"

import { useAuth } from "@/contexts/auth-context"
import { ContentModeration } from "@/components/admin/content-moderation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Server, Wifi, HardDrive, Activity, RefreshCw, AlertTriangle } from "lucide-react"

// Mock system stats
const systemStats = {
  serverHealth: "excellent" as const,
  uptime: "99.9%",
  responseTime: "45ms",
  activeConnections: 1247,
  databaseSize: "2.3 GB",
  storageUsed: 67,
  memoryUsage: 42,
  cpuUsage: 23,
  lastUpdated: new Date().toLocaleTimeString(),
}

export default function AdminSystemPage() {
  const { user, hasPermission } = useAuth()

  if (!user || !hasPermission("manage_system")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access system administration.</p>
        </div>
      </div>
    )
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "bg-green-500 text-white"
      case "good":
        return "bg-blue-500 text-white"
      case "warning":
        return "bg-yellow-500 text-white"
      case "critical":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getProgressColor = (value: number) => {
    if (value < 50) return "bg-green-500"
    if (value < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-muted-foreground">Monitor system health and manage content moderation</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="outline">Last updated: {systemStats.lastUpdated}</Badge>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={getHealthColor(systemStats.serverHealth)}>
                {systemStats.serverHealth.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Uptime: {systemStats.uptime}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.responseTime}</div>
            <p className="text-xs text-muted-foreground">Avg response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeConnections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Connected now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.storageUsed}%</div>
            <p className="text-xs text-muted-foreground">{systemStats.databaseSize} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">{systemStats.cpuUsage}%</span>
              </div>
              <Progress value={systemStats.cpuUsage} className="h-2" />
              {systemStats.cpuUsage > 80 && (
                <div className="flex items-center mt-1 text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span className="text-xs">High usage</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">{systemStats.memoryUsage}%</span>
              </div>
              <Progress value={systemStats.memoryUsage} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm text-muted-foreground">{systemStats.storageUsed}%</span>
              </div>
              <Progress value={systemStats.storageUsed} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: "info", message: "System backup completed successfully", time: "2 hours ago" },
              { type: "warning", message: "High memory usage detected on server-02", time: "4 hours ago" },
              { type: "success", message: "Database optimization completed", time: "1 day ago" },
            ].map((alert, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full ${
                    alert.type === "info" ? "bg-blue-500" : alert.type === "warning" ? "bg-yellow-500" : "bg-green-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Moderation */}
      <ContentModeration />
    </div>
  )
}
