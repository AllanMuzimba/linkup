"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Shield, 
  Users, 
  MessageCircle, 
  FileText, 
  BarChart3, 
  MapPin, 
  Search,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Settings,
  AlertTriangle,
  TrendingUp,
  Globe
} from "lucide-react"
import { AdminService } from "@/lib/admin-services"
import { toast } from "sonner"

export default function AdminDashboard() {
  const { user, hasPermission } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalChats: 0,
    reportsCount: 0
  })
  const [users, setUsers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [trafficData, setTrafficData] = useState<any[]>([])

  // Check if user has admin/developer access
  const hasAdminAccess = user?.role === 'super_admin' || user?.role === 'developer' || user?.role === 'level_admin'

  useEffect(() => {
    if (!user || !hasAdminAccess) return

    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        // Load dashboard statistics
        const dashboardStats = await AdminService.getDashboardStats()
        setStats(dashboardStats)

        // Load users
        const allUsers = await AdminService.getAllUsers()
        setUsers(allUsers)

        // Load posts for moderation
        const allPosts = await AdminService.getAllPosts()
        setPosts(allPosts)

        // Load chats for monitoring
        const allChats = await AdminService.getAllChats()
        setChats(allChats)

        // Load traffic data
        const traffic = await AdminService.getTrafficData()
        setTrafficData(traffic)

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        toast.error("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user, hasAdminAccess])

  // User management functions
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await AdminService.updateUserRole(userId, newRole)
      toast.success(`User role updated to ${newRole}`)
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
    } catch (error) {
      toast.error("Failed to update user role")
    }
  }

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await AdminService.blockUser(userId, isBlocked)
      toast.success(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully`)
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isBlocked } : u
      ))
    } catch (error) {
      toast.error(`Failed to ${isBlocked ? 'block' : 'unblock'} user`)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await AdminService.deletePost(postId)
      toast.success("Post deleted successfully")
      
      // Update local state
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (error) {
      toast.error("Failed to delete post")
    }
  }

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !selectedRole || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
              <p className="text-muted-foreground">You need to be logged in to access the admin dashboard.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <div className="text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-6xl mx-auto p-6">
            <LoadingSpinner size="lg" text="Loading admin dashboard..." />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Shield className="h-8 w-8 mr-3 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user.name} ({user.role.replace('_', ' ').toUpperCase()})
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {user.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} active today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPosts}</div>
                <p className="text-xs text-muted-foreground">
                  Content moderation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalChats}</div>
                <p className="text-xs text-muted-foreground">
                  Chat monitoring
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reportsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Pending review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Traffic</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12%</div>
                <p className="text-xs text-muted-foreground">
                  vs last week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="posts">Content Moderation</TabsTrigger>
              <TabsTrigger value="chats">Chat Monitoring</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="level_admin">Level Admin</SelectItem>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={user.role === 'super_admin' ? 'destructive' : 
                                           user.role === 'developer' ? 'default' : 
                                           user.role === 'level_admin' ? 'secondary' : 'outline'}>
                                {user.role.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {user.isBlocked && (
                                <Badge variant="destructive">Blocked</Badge>
                              )}
                              {user.isOnline && (
                                <Badge variant="secondary">Online</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleChangeUserRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="level_admin">Level Admin</SelectItem>
                              <SelectItem value="developer">Developer</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant={user.isBlocked ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleBlockUser(user.id, !user.isBlocked)}
                          >
                            {user.isBlocked ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Block
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Moderation Tab */}
            <TabsContent value="posts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Moderation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start space-x-3 flex-1">
                          <Avatar>
                            <AvatarImage src={post.author?.avatar || "/placeholder-user.jpg"} alt={post.author?.name} />
                            <AvatarFallback>{post.author?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{post.author?.name}</p>
                            <p className="text-sm text-muted-foreground mb-2">{post.createdAt?.toLocaleDateString()}</p>
                            <p className="text-sm">{post.content}</p>
                            {post.images && post.images.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {post.images.length} image(s) attached
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chat Monitoring Tab */}
            <TabsContent value="chats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chats.map((chat) => (
                      <div key={chat.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MessageCircle className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {chat.type === 'direct' ? 'Direct Chat' : `Group: ${chat.name}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {chat.participantCount} participants • Last active: {chat.lastActivity?.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Monitor
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic by Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trafficData.map((location, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{location.country}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${location.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{location.users}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Daily Active Users</span>
                        <span className="font-medium">{stats.activeUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Posts Today</span>
                        <span className="font-medium">127</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Messages Sent</span>
                        <span className="font-medium">1,234</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Registrations</span>
                        <span className="font-medium">23</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* System Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Platform Configuration</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">User Registration</p>
                            <p className="text-sm text-muted-foreground">Allow new users to register</p>
                          </div>
                          <Button variant="outline">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Content Moderation</p>
                            <p className="text-sm text-muted-foreground">Auto-moderation settings</p>
                          </div>
                          <Button variant="outline">Configure</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Notification Settings</p>
                            <p className="text-sm text-muted-foreground">System notification preferences</p>
                          </div>
                          <Button variant="outline">Configure</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}