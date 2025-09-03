"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Headphones, 
  AlertTriangle, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Send,
  Flag,
  User,
  Mail,
  Phone
} from "lucide-react"
import { SupportService } from "@/lib/support-services"
import { toast } from "sonner"

interface SupportTicket {
  id: string
  userId: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  subject: string
  description: string
  category: 'bug' | 'feature' | 'account' | 'content' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  messages: SupportMessage[]
}

interface SupportMessage {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  createdAt: Date
}

export default function SupportDashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")
  const [replyMessage, setReplyMessage] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Check if user has support access
  const hasSupportAccess = user?.role === 'support' || user?.role === 'level_admin' || user?.role === 'developer' || user?.role === 'super_admin'

  useEffect(() => {
    if (!user || !hasSupportAccess) return

    const loadSupportData = async () => {
      setIsLoading(true)
      try {
        // Load support tickets
        const supportTickets = await SupportService.getAllTickets()
        setTickets(supportTickets)
      } catch (error) {
        console.error('Error loading support data:', error)
        toast.error("Failed to load support tickets")
      } finally {
        setIsLoading(false)
      }
    }

    loadSupportData()
  }, [user, hasSupportAccess])

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || ticket.status === statusFilter
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Handle ticket actions
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await SupportService.updateTicketStatus(ticketId, newStatus)
      toast.success(`Ticket ${newStatus}`)
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus as any } : ticket
      ))
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null)
      }
    } catch (error) {
      toast.error("Failed to update ticket status")
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !user) return

    try {
      const newMessage: SupportMessage = {
        id: `msg_${Date.now()}`,
        ticketId: selectedTicket.id,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message: replyMessage,
        createdAt: new Date()
      }

      await SupportService.addMessageToTicket(selectedTicket.id, newMessage)
      
      // Update local state
      setSelectedTicket(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage],
        status: 'in_progress'
      } : null)
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, messages: [...ticket.messages, newMessage], status: 'in_progress' }
          : ticket
      ))

      setReplyMessage("")
      toast.success("Reply sent successfully")
    } catch (error) {
      toast.error("Failed to send reply")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive'
      case 'in_progress': return 'default'
      case 'resolved': return 'secondary'
      case 'closed': return 'outline'
      default: return 'outline'
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
              <p className="text-muted-foreground">You need to be logged in to access the support dashboard.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!hasSupportAccess) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <div className="text-center">
              <Headphones className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-muted-foreground">You don't have permission to access the support dashboard.</p>
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
            <LoadingSpinner size="lg" text="Loading support dashboard..." />
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
                <Headphones className="h-8 w-8 mr-3 text-primary" />
                Support Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage user support tickets and provide assistance
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {user.role.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {tickets.filter(t => t.status === 'open').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {tickets.filter(t => t.status === 'in_progress').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {tickets.filter(t => t.status === 'resolved').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets by subject, user name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                    <p className="text-muted-foreground">No support tickets match your current filters</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar>
                          <AvatarImage src={ticket.user.avatar || "/placeholder-user.jpg"} alt={ticket.user.name} />
                          <AvatarFallback>{ticket.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium">{ticket.subject}</p>
                            <Badge variant={getPriorityColor(ticket.priority)}>
                              {ticket.priority.toUpperCase()}
                            </Badge>
                            <Badge variant={getStatusColor(ticket.status)}>
                              {ticket.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ticket.user.name} • {ticket.user.email} • {ticket.createdAt.toLocaleDateString()}
                          </p>
                          <p className="text-sm mt-1 line-clamp-2">{ticket.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog open={isDialogOpen && selectedTicket?.id === ticket.id} onOpenChange={(open) => {
                          setIsDialogOpen(open)
                          if (open) setSelectedTicket(ticket)
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center space-x-2">
                                <span>Support Ticket #{ticket.id.slice(-6)}</span>
                                <Badge variant={getPriorityColor(ticket.priority)}>
                                  {ticket.priority.toUpperCase()}
                                </Badge>
                                <Badge variant={getStatusColor(ticket.status)}>
                                  {ticket.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Ticket Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-medium mb-2">User Information</h3>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <User className="h-4 w-4" />
                                      <span>{ticket.user.name}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Mail className="h-4 w-4" />
                                      <span>{ticket.user.email}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-medium mb-2">Ticket Information</h3>
                                  <div className="space-y-2 text-sm">
                                    <p><strong>Subject:</strong> {ticket.subject}</p>
                                    <p><strong>Category:</strong> {ticket.category}</p>
                                    <p><strong>Created:</strong> {ticket.createdAt.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Original Message */}
                              <div>
                                <h3 className="font-medium mb-2">Original Message</h3>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{ticket.description}</p>
                                </div>
                              </div>

                              {/* Conversation */}
                              {ticket.messages.length > 0 && (
                                <div>
                                  <h3 className="font-medium mb-2">Conversation</h3>
                                  <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {ticket.messages.map((message) => (
                                      <div key={message.id} className={`flex ${message.senderRole === 'user' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-xs p-3 rounded-lg ${
                                          message.senderRole === 'user' 
                                            ? 'bg-muted' 
                                            : 'bg-primary text-primary-foreground'
                                        }`}>
                                          <p className="text-sm font-medium">{message.senderName}</p>
                                          <p className="text-sm">{message.message}</p>
                                          <p className="text-xs opacity-70 mt-1">
                                            {message.createdAt.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Reply Section */}
                              <div>
                                <h3 className="font-medium mb-2">Send Reply</h3>
                                <div className="space-y-3">
                                  <Textarea
                                    placeholder="Type your reply here..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Select
                                        value={ticket.status}
                                        onValueChange={(newStatus) => handleUpdateTicketStatus(ticket.id, newStatus)}
                                      >
                                        <SelectTrigger className="w-40">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="open">Open</SelectItem>
                                          <SelectItem value="in_progress">In Progress</SelectItem>
                                          <SelectItem value="resolved">Resolved</SelectItem>
                                          <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Reply
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Select
                          value={ticket.status}
                          onValueChange={(newStatus) => handleUpdateTicketStatus(ticket.id, newStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}