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
  Send, 
  Check, 
  X, 
  Clock,
  UserCheck,
  UserX,
  Mail,
  Phone,
  BookOpen
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
}

export function RealTimeFriends() {
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
  const [contactsPermission, setContactsPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  // Subscribe to friends list and friend requests
  useEffect(() => {
    if (!user) return

    const unsubscribeFriends = FriendService.subscribeToFriends(user.id, (friendsList) => {
      setFriends(friendsList)
    })

    const unsubscribeReceived = FriendService.subscribeToReceivedFriendRequests(user.id, (requests) => {
      setReceivedRequests(requests)
    })

    const unsubscribeSent = FriendService.subscribeToSentFriendRequests(user.id, (requests) => {
      setSentRequests(requests)
    })

    return () => {
      unsubscribeFriends()
      unsubscribeReceived()
      unsubscribeSent()
    }
  }, [user])

  // Access device contacts (simplified mock for now)
  const accessDeviceContacts = async () => {
    setIsLoadingContacts(true)
    try {
      // Mock contacts for demonstration
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
        },
        {
          name: 'David Miller',
          phoneNumbers: ['+1555666777'],
          emails: ['david@example.com'],
          isRegistered: false
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

  // Send friend request to contact (simplified)
  const sendFriendRequestToContact = async (contact: DeviceContact) => {
    if (!user || !contact.userId) return

    try {
      // Simulate sending the request
      toast.success(`Friend request sent to ${contact.name}! 🎉`)
      
      // Update contact status
      setDeviceContacts(prev => 
        prev.map(c => 
          c.name === contact.name 
            ? { ...c, requestSent: true }
            : c
        )
      )
      
      // Update friendship status
      setFriendshipStatuses(prev => ({ ...prev, [contact.userId!]: 'pending' }))
      
      // Add to sent requests
      const newRequest: FriendRequest = {
        id: `req_${Date.now()}`,
        fromUserId: user.id,
        toUserId: contact.userId!,
        fromUser: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          email: user.email
        },
        toUser: {
          id: contact.userId!,
          name: contact.name,
          avatar: '',
          email: contact.emails[0] || ''
        },
        status: 'pending',
        createdAt: new Date(),
        message: `Hi ${contact.name}! I found you in my contacts and would love to connect on LinkUp!`
      }
      
      setSentRequests(prev => [newRequest, ...prev])
      
    } catch (error) {
      toast.error("Failed to send friend request")
    }
  }

  // Send invite to unregistered contact
  const sendInviteToContact = async (contact: DeviceContact) => {
    try {
      // Simulate sending invite via SMS/Email
      const inviteMessage = `Hi ${contact.name}! I'm using LinkUp, a great social media app. Join me here: https://linkup.app/invite/${user?.id}`
      
      toast.success(`Invite sent to ${contact.name}! 📧`)
      
      // Update contact status
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
      await FriendService.acceptFriendRequest(requestId)
      toast.success("Friend request accepted!")
    } catch (error) {
      toast.error("Failed to accept friend request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendService.rejectFriendRequest(requestId)
      toast.success("Friend request rejected")
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
      // Get user's location for distance calculation
      let userLocation: { lat: number, lng: number } | undefined
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        } catch (error) {
          console.log("Could not get user location")
        }
      }

      const results = await UserService.searchUsers(query, user.id, userLocation)
      setSearchResults(results)
      
      // Check friendship status for each result
      const statuses: {[key: string]: string} = {}
      for (const result of results) {
        const status = await UserService.checkFriendshipStatus(user.id, result.id)
        statuses[result.id] = status
      }
      setFriendshipStatuses(statuses)
    } catch (error) {
      toast.error("Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }

  // Send friend request
  const sendFriendRequest = async (toUserId: string, toUserName?: string) => {
    if (!user) return

    try {
      await FriendService.sendFriendRequest(user.id, toUserId, `Hi! I'd like to connect with you on LinkUp.`)
      toast.success("Friend request sent! 🎉")
      
      // Update friendship status
      setFriendshipStatuses(prev => ({ ...prev, [toUserId]: 'request_sent' }))
      
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error("Failed to send friend request")
    }
  }

  // Start chat with friend
  const startChat = async (friendId: string) => {
    if (!user) return

    try {
      const chatId = await ChatService.createOrGetChat([user.id, friendId])
      // Navigate to chat (you can implement this based on your routing)
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
          <p className="text-muted-foreground">Connect with friends and discover new people</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isContactsDialogOpen} onOpenChange={setIsContactsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={accessDeviceContacts} disabled={isLoadingContacts}>
                {isLoadingContacts ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <BookOpen className="h-4 w-4 mr-2" />
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
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                            {contact.isRegistered && (
                              <Badge variant="secondary" className="mt-1">
                                LinkUp User
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          {contact.isRegistered ? (
                            <Button
                              size="sm"
                              onClick={() => sendFriendRequestToContact(contact)}
                              disabled={(contact as any).requestSent}
                            >
                              {(contact as any).requestSent ? (
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
                              disabled={(contact as any).inviteSent}
                            >
                              {(contact as any).inviteSent ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Invited
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Invite to LinkUp
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
                          <AvatarImage src={request.fromUser?.avatar || "/placeholder-user.jpg"} alt={request.fromUser?.name} />
                          <AvatarFallback>{request.fromUser?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.fromUser?.name}</p>
                          <p className="text-sm text-muted-foreground">@{request.fromUser?.username || request.fromUser?.email?.split('@')[0]}</p>
                          {request.message && (
                            <p className="text-sm text-muted-foreground italic mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {request.createdAt?.toLocaleDateString()} at {request.createdAt?.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
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
                          <AvatarImage src={request.toUser?.avatar || "/placeholder-user.jpg"} alt={request.toUser?.name} />
                          <AvatarFallback>{request.toUser?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.toUser?.name}</p>
                          <p className="text-sm text-muted-foreground">@{request.toUser?.username || request.toUser?.email?.split('@')[0]}</p>
                          {request.message && (
                            <p className="text-sm text-muted-foreground italic mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Sent {request.createdAt?.toLocaleDateString()} at {request.createdAt?.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
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
                        ) : friendshipStatuses[result.id] === 'request_sent' ? (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Request Sent
                          </Badge>
                        ) : friendshipStatuses[result.id] === 'request_received' ? (
                          <Badge variant="outline">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Request Received
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => sendFriendRequest(result.id, result.name)}
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

              {!searchQuery && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Search for Friends</h3>
                  <p className="text-muted-foreground">Enter a name, email, phone, or username to find friends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
