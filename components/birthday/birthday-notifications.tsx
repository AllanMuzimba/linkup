"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { BirthdayService } from "@/lib/birthday-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Gift, Calendar, Heart } from "lucide-react"
import { toast } from "sonner"

export function BirthdayNotifications() {
  const { user } = useAuth()
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUpcomingBirthdays = async () => {
      if (!user) return
      
      setIsLoading(true)
      try {
        const birthdays = await BirthdayService.getUpcomingBirthdays(user.id)
        setUpcomingBirthdays(birthdays)
      } catch (error) {
        console.error('Error loading birthdays:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUpcomingBirthdays()
  }, [user])

  const handleSendWish = async (friendId: string, friendName: string) => {
    if (!user) return

    try {
      await BirthdayService.sendBirthdayWish(user.id, friendId)
      toast.success(`Birthday wish sent to ${friendName}! 🎉`)
    } catch (error) {
      toast.error("Failed to send birthday wish")
    }
  }

  if (isLoading || upcomingBirthdays.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gift className="h-5 w-5 text-pink-500" />
          <span>Upcoming Birthdays</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingBirthdays.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={friend.avatar || "/placeholder-user.jpg"} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{friend.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {friend.daysUntil === 0 ? "Today!" : 
                       friend.daysUntil === 1 ? "Tomorrow" : 
                       `In ${friend.daysUntil} days`}
                    </span>
                    {friend.daysUntil === 0 && (
                      <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                        🎂 Birthday!
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSendWish(friend.id, friend.name)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none hover:from-pink-600 hover:to-purple-600"
              >
                <Heart className="h-3 w-3 mr-1" />
                Send Wish
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}