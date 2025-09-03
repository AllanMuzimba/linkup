"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, MoreHorizontal, Shield, Ban, AlertTriangle, CheckCircle, Users, UserCheck, UserX } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PERMISSIONS } from "@/types/auth"
import type { AdminUser } from "@/types/admin"

// Mock data
const mockUsers: AdminUser[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    avatar: "/diverse-user-avatars.png",
    isActive: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    postsCount: 45,
    friendsCount: 123,
    reportsCount: 0,
  },
  {
    id: "2",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "level_admin",
    avatar: "/professional-woman-avatar.png",
    isActive: true,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    postsCount: 78,
    friendsCount: 89,
    reportsCount: 1,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "developer",
    avatar: "/professional-man-avatar.png",
    isActive: false,
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
    postsCount: 23,
    friendsCount: 56,
    reportsCount: 0,
  },
]

interface UserManagementProps {
  users?: AdminUser[]
}

export function UserManagement({ users = mockUsers }: UserManagementProps) {
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_ALL_USERS) || hasPermission(PERMISSIONS.MANAGE_LEVEL_USERS)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.isActive : !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const roleColors = {
    super_admin: "bg-destructive text-destructive-foreground",
    developer: "bg-primary text-primary-foreground",
    level_admin: "bg-secondary text-secondary-foreground",
    user: "bg-muted text-muted-foreground",
  }

  const roleLabels = {
    super_admin: "Super Admin",
    developer: "Developer",
    level_admin: "Level Admin",
    user: "User",
  }

  const formatLastLogin = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const handleUserAction = (userId: string, action: string) => {
    console.log(`Performing ${action} on user ${userId}`)
    // TODO: Implement user actions
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to manage users.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => !u.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reported Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.reportsCount > 0).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="level_admin">Level Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{user.name}</p>
                      <Badge className={`text-xs ${roleColors[user.role]}`}>{roleLabels[user.role]}</Badge>
                      {user.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Ban className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                      <span>Last login: {formatLastLogin(user.lastLogin)}</span>
                      <span>{user.postsCount} posts</span>
                      <span>{user.friendsCount} friends</span>
                      {user.reportsCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {user.reportsCount} reports
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage User: {user.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => handleUserAction(user.id, user.isActive ? "suspend" : "activate")}
                        >
                          {user.isActive ? "Suspend User" : "Activate User"}
                        </Button>
                        <Button variant="outline" onClick={() => handleUserAction(user.id, "reset_password")}>
                          Reset Password
                        </Button>
                        <Button variant="outline" onClick={() => handleUserAction(user.id, "view_activity")}>
                          View Activity
                        </Button>
                        <Button variant="destructive" onClick={() => handleUserAction(user.id, "ban")}>
                          Ban User
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
