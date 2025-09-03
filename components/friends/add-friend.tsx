"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Mail, Phone, Search, Users } from "lucide-react"

interface AddFriendProps {
  onSendRequest: (identifier: string, message?: string) => void
}

// Mock suggested friends
const suggestedFriends = [
  {
    id: "1",
    name: "Alex Johnson",
    username: "alexj",
    avatar: "/professional-man-avatar.png",
    mutualFriends: 5,
    role: "Developer",
  },
  {
    id: "2",
    name: "Emma Davis",
    username: "emmad",
    avatar: "/professional-woman-avatar.png",
    mutualFriends: 3,
    role: "Designer",
  },
  {
    id: "3",
    name: "Michael Chen",
    username: "michaelc",
    avatar: "/diverse-user-avatars.png",
    mutualFriends: 8,
    role: "Product Manager",
  },
]

export function AddFriend({ onSendRequest }: AddFriendProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")

  const handleSendRequest = (identifier: string) => {
    onSendRequest(identifier, message.trim() || undefined)
    setEmail("")
    setPhone("")
    setMessage("")
    setIsOpen(false)
  }

  const filteredSuggestions = suggestedFriends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or username"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredSuggestions.map((friend) => (
                <Card key={friend.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{friend.name}</p>
                        <p className="text-xs text-muted-foreground">@{friend.username}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {friend.role}
                          </Badge>
                          {friend.mutualFriends > 0 && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Users className="h-3 w-3 mr-1" />
                              {friend.mutualFriends} mutual
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleSendRequest(friend.username)}>
                      Add
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Hi! I'd like to connect with you."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={() => handleSendRequest(email)} disabled={!email.trim()} className="w-full">
              Send Friend Request
            </Button>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-message">Message (Optional)</Label>
              <Textarea
                id="phone-message"
                placeholder="Hi! I'd like to connect with you."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={() => handleSendRequest(phone)} disabled={!phone.trim()} className="w-full">
              Send Friend Request
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
