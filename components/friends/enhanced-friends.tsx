"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { 
  Search, 
  MessageCircle, 
  UserPlus, 
  Users, 
  MapPin, 
  Contacts, 
  Send, 
  Check, 
  X, 
  Clock,
  UserCheck,
  UserX,
  Mail,
  Phone
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { FriendService, UserService, ChatService } from "@/lib/realtime-services"
import { toast } from "sonner"

interface Friend {
  id: string
  name: string
  username?: string
  avatar?: string
  isOnline: boolean
  lastActive: Date
  city?: string
  country?: string
  distance?: number
}

interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUser: {
    id: string
    name: string
    avatar?: string
    email: string
  }
  toUser: {
    id: string
    name: string
    avatar?: string
    email: string
  }
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
  message?: string
}

interface DeviceContact {
  name: string
  phoneNumbers: string[]
  emails: string[]
  isRegistered?: boolean
  userId?: string
  requestSent?: boolean
  inviteSent?: boolean
}

export function EnhancedFriends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [friendshipStatuses, setFriendshipStatuses] = useState<{[key: string]: string}>({})
  
  // Friend Requests
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  
  // Device Contacts
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isContactsDialogOpen, setIsContactsDialogOpen] = useState(false)

  // Subscribe to friends list and friend requests
  useEffect(() => {
    if (!user) return

    const unsubscribeFriends = FriendService.subscribeToFriends(user.id, (friendsList) => {
      setFriends(friendsList)
    })

    // Mock friend requests for now - in real app these would come from Firebase
    setSentRequests([
      {
        id: '1',
        fromUserId: user.id,
        toUserId: '2',
        fromUser: { id: user.id, name: user.name, avatar: user.avatar, email: user.email },
        toUser: { id: '2', name: 'John Doe', avatar: '', email: 'john@example.com' },
        status: 'pending',
        createdAt: new Date(),
        message: 'Hi! Would love to connect!'
      }
    ])

    setReceivedRequests([
      {
        id: '2',
        fromUserId: '3',
        toUserId: user.id,
        fromUser: { id: '3', name: 'Jane Smith', avatar: '', email: 'jane@example.com' },
        toUser: { id: user.id, name: user.name, avatar: user.avatar, email: user.email },
        status: 'pending',
        createdAt: new Date(),
        message: 'Hello! I found you through mutual friends.'
      }
    ])

    return unsubscribeFriends
  }, [user])

  // Access device contacts
  const accessDeviceContacts = async () => {
    setIsLoadingContacts(true)
    try {
      // Mock contacts for demo - in real app this would use Contacts API
      const mockContacts: DeviceContact[] = [
        {
          name: 'Alice Johnson',
          phoneNumbers: ['+1234567890'],
          emails: ['alice@example.com'],
          isRegistered: true,
          userId: 'alice123'
        },
        {
          name: 'Bob Wilson',
          phoneNumbers: ['+1987654321'],
          emails: ['bob@example.com'],
          isRegistered: false
        },
        {
          name: 'Carol Brown',
          phoneNumbers: ['+1122334455'],
          emails: ['carol@example.com'],
          isRegistered: true,
          userId: 'carol456'
        }
      ]

      setDeviceContacts(mockContacts)
      setIsContactsDialogOpen(true)
      toast.success("Contacts loaded successfully!")
    } catch (error) {
      toast.error("Failed to access contacts")
    } finally {
      setIsLoadingContacts(false)
    }
  }

  // Send friend request to contact
  const sendFriendRequestToContact = async (contact: DeviceContact) => {
    if (!user || !contact.userId) return

    try {
      // In real app: await FriendService.sendFriendRequest(user.id, contact.userId, message)
      toast.success(`Friend request sent to ${contact.name}!`)
      
      setDeviceContacts(prev => 
        prev.map(c => 
          c.name === contact.name 
            ? { ...c, requestSent: true }
            : c
        )
      )
    } catch (error) {
      toast.error("Failed to send friend request")
    }
  }

  // Send invite to unregistered contact
  const sendInviteToContact = async (contact: DeviceContact) => {
    try {
      toast.success(`Invite sent to ${contact.name}!`)
      
      setDeviceContacts(prev => 
        prev.map(c => 
          c.name === contact.name 
            ? { ...c, inviteSent: true }
            : c
        )
      )
    } catch (error) {
      toast.error("Failed to send invite")
    }
  }

  // Handle friend request actions
  const handleAcceptRequest = async (requestId: string) => {
    try {
      // In real app: await FriendService.acceptFriendRequest(requestId)
      toast.success("Friend request accepted!")
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId))
    } catch (error) {
      toast.error("Failed to accept friend request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      // In real app: await FriendService.rejectFriendRequest(requestId)
      toast.success("Friend request rejected")
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId))
    } catch (error) {
      toast.error("Failed to reject friend request")
    }
  }

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim() || !user) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await UserService.searchUsers(query, user.id)
      setSearchResults(results)
      
      // Check friendship status for each result
      const statuses: {[key: string]: string} = {}
      for (const result of results) {
        const status = await UserService.checkFriendshipStatus(user.id, result.id)
        statuses[result.id] = status
      }
      setFriendshipStatuses(statuses)
    } catch (error) {
      console.error('Search error:', error)
      toast.error("Search failed")
    } finally {
      setIsSearching(false)
    }
  }

  // Send friend request
  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return

    try {
      await FriendService.sendFriendRequest(user.id, targetUserId)
      toast.success("Friend request sent!")
      setFriendshipStatuses(prev => ({ ...prev, [targetUserId]: 'pending' }))
    } catch (error) {
      toast.error("Failed to send friend request")
    }
  }

  // Start chat with friend
  const startChat = async (friendId: string) => {
    if (!user) return

    try {
      const chatId = await ChatService.createOrGetChat([user.id, friendId])
      toast.success("Chat opened!")
    } catch (error) {
      toast.error("Failed to start chat")
    }
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Friends & Connections</h2>
          <p className="text-muted-foreground">Connect with friends and discover new people</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isContactsDialogOpen} onOpenChange={setIsContactsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={accessDeviceContacts} disabled={isLoadingContacts}>
                {isLoadingContacts ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Contacts className="h-4 w-4 mr-2" />
                )}
                Add from Contacts
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Friends from Contacts</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {deviceContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Contacts className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No contacts found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deviceContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              {contact.emails[0] && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span>{contact.emails[0]}</span>
                                </div>
                              )}
                              {contact.phoneNumbers[0] && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <span>{contact.phoneNumbers[0]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          {contact.isRegistered ? (
                            <Button
                              size="sm"
                              onClick={() => sendFriendRequestToContact(contact)}
                              disabled={contact.requestSent}
                            >
                              {contact.requestSent ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Sent
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Add Friend
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendInviteToContact(contact)}
                              disabled={contact.inviteSent}
                            >
                              {contact.inviteSent ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Invited
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Invite
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>My Friends ({friends.length})</span>
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>Received ({receivedRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Sent ({sentRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Find Friends</span>
          </TabsTrigger>
        </TabsList>

        {/* My Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Friends ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No friends yet</h3>
                  <p className="text-muted-foreground mb-4">Start connecting with people!</p>
                  <Button onClick={() => {
                    const searchTab = document.querySelector('[value="search"]') as HTMLElement
                    searchTab?.click()
                  }}>
                    <Search className="h-4 w-4 mr-2" />
                    Find Friends
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={friend.avatar || "/placeholder-user.jpg"} alt={friend.name} />
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {friend.isOnline && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{friend.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {friend.isOnline ? "Online" : `Last seen ${formatLastSeen(friend.lastActive)}`}
                          </p>
                          {friend.city && friend.country && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{friend.city}, {friend.country}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => startChat(friend.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Received Requests Tab */}
        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests Received ({receivedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {receivedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">Friend requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.fromUser.avatar || "/placeholder-user.jpg"} alt={request.fromUser.name} />
                          <AvatarFallback>{request.fromUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.fromUser.name}</p>
                          <p className="text-sm text-muted-foreground">{request.fromUser.email}</p>
                          {request.message && (
                            <p className="text-sm text-muted-foreground italic mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {request.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests Sent ({sentRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {sentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">Friend requests you send will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.toUser.avatar || "/placeholder-user.jpg"} alt={request.toUser.name} />
                          <AvatarFallback>{request.toUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.toUser.name}</p>
                          <p className="text-sm text-muted-foreground">{request.toUser.email}</p>
                          {request.message && (
                            <p className="text-sm text-muted-foreground italic mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Sent {request.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, or username..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isSearching && (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" text="Searching..." />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={result.avatar || "/placeholder-user.jpg"} alt={result.name} />
                          <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-muted-foreground">@{result.username || result.email?.split('@')[0]}</p>
                          {result.city && result.country && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{result.city}, {result.country}</span>
                              {result.distance && <span className="ml-2">({result.distance}km away)</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        {friendshipStatuses[result.id] === 'friends' ? (
                          <Badge variant="secondary">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Friends
                          </Badge>
                        ) : friendshipStatuses[result.id] === 'pending' ? (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => sendFriendRequest(result.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Friend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground">Try searching with different keywords</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}