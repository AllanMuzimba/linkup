"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check, X, Users } from "lucide-react"
import type { FriendRequest } from "@/types/chat"

interface FriendRequestsProps {
  requests: FriendRequest[]
  onAccept: (requestId: string) => void
  onDecline: (requestId: string) => void
}

export function FriendRequests({ requests, onAccept, onDecline }: FriendRequestsProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No pending friend requests</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Friend Requests
          <Badge variant="secondary" className="ml-2">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={request.fromUser.avatar || "/placeholder.svg"} alt={request.fromUser.name} />
                <AvatarFallback>{request.fromUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{request.fromUser.name}</p>
                <p className="text-sm text-muted-foreground">@{request.fromUser.username}</p>
                {request.fromUser.mutualFriends > 0 && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {request.fromUser.mutualFriends} mutual friends
                  </div>
                )}
                {request.message && <p className="text-sm mt-2 text-muted-foreground italic">"{request.message}"</p>}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => onAccept(request.id)}>
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDecline(request.id)}>
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
