"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Share, BarChart3, Clock } from "lucide-react"

interface BulkSharePanelProps {
  userRole: string
}

const socialPlatforms = [
  { id: "twitter", name: "Twitter", icon: "🐦", enabled: true },
  { id: "facebook", name: "Facebook", icon: "📘", enabled: true },
  { id: "linkedin", name: "LinkedIn", icon: "💼", enabled: true },
  { id: "instagram", name: "Instagram", icon: "📷", enabled: false },
]

const targetAudiences = [
  { id: "all", name: "All Users", count: 1247 },
  { id: "admins", name: "Admin Users", count: 12 },
  { id: "active", name: "Active Users (30 days)", count: 892 },
  { id: "new", name: "New Users (7 days)", count: 156 },
]

export function BulkSharePanel({ userRole }: BulkSharePanelProps) {
  const [message, setMessage] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedAudience, setSelectedAudience] = useState("all")
  const [scheduleTime, setScheduleTime] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)

  const canUseBulkShare = ["Super Admin", "Developer", "Level Admin"].includes(userRole)

  if (!canUseBulkShare) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Share className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Bulk sharing is only available for admin users.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId],
    )
  }

  const handleBulkShare = () => {
    // Simulate bulk sharing
    console.log("[v0] Bulk sharing:", {
      message,
      platforms: selectedPlatforms,
      audience: selectedAudience,
      scheduled: isScheduled,
      scheduleTime,
    })

    // Reset form
    setMessage("")
    setSelectedPlatforms([])
    setSelectedAudience("all")
    setIsScheduled(false)
    setScheduleTime("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Share className="h-5 w-5" />
          <span>Bulk Social Media Sharing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Message */}
        <div>
          <label className="text-sm font-medium mb-2 block">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to share across platforms..."
            className="min-h-[100px]"
          />
        </div>

        {/* Platform Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Select Platforms</label>
          <div className="grid grid-cols-2 gap-3">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.id}
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => handlePlatformToggle(platform.id)}
                  disabled={!platform.enabled}
                />
                <label htmlFor={platform.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                  <span>{platform.icon}</span>
                  <span>{platform.name}</span>
                  {!platform.enabled && (
                    <Badge variant="secondary" className="text-xs">
                      Soon
                    </Badge>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Target Audience */}
        <div>
          <label className="text-sm font-medium mb-2 block">Target Audience</label>
          <Select value={selectedAudience} onValueChange={setSelectedAudience}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targetAudiences.map((audience) => (
                <SelectItem key={audience.id} value={audience.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{audience.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {audience.count}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Schedule Option */}
        <div className="flex items-center space-x-2">
          <Checkbox id="schedule" checked={isScheduled} onCheckedChange={(checked) => setIsScheduled(checked === true)} />
          <label htmlFor="schedule" className="text-sm font-medium cursor-pointer">
            Schedule for later
          </label>
        </div>

        {isScheduled && (
          <div>
            <label className="text-sm font-medium mb-2 block">Schedule Time</label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm"
            />
          </div>
        )}

        <Separator />

        {/* Action Button */}
        <Button
          onClick={handleBulkShare}
          disabled={!message.trim() || selectedPlatforms.length === 0}
          className="w-full"
        >
          {isScheduled ? (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Schedule Share
            </>
          ) : (
            <>
              <Share className="h-4 w-4 mr-2" />
              Share Now
            </>
          )}
        </Button>

        {/* Analytics Preview */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Expected Reach</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {targetAudiences.find((a) => a.id === selectedAudience)?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Users</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">{selectedPlatforms.length}</div>
              <div className="text-xs text-muted-foreground">Platforms</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
