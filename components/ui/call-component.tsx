"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from "lucide-react"
import { type CallState } from "@/types/chat"

interface CallComponentProps {
  callState: CallState | null
  onStartCall: (type: "audio" | "video", participantId: string) => void
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  participantName?: string
  participantAvatar?: string
  participantId?: string
}

interface IncomingCallProps {
  callerName: string
  callerAvatar?: string
  callType: "audio" | "video"
  onAccept: () => void
  onDecline: () => void
}

function IncomingCall({ callerName, callerAvatar, callType, onAccept, onDecline }: IncomingCallProps) {
  const [isRinging, setIsRinging] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRinging(prev => !prev)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 bg-card/95 backdrop-blur-lg border-primary/20 shadow-2xl">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="relative">
            <Avatar className={`h-20 w-20 mx-auto ${isRinging ? 'ring-4 ring-primary/50' : ''} transition-all`}>
              <AvatarImage src={callerAvatar} alt={callerName} />
              <AvatarFallback className="text-lg font-semibold">
                {callerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {callType === "video" && (
              <Badge className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-primary">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">{callerName}</h3>
            <p className="text-muted-foreground">
              Incoming {callType} call...
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              variant="destructive"
              onClick={onDecline}
              className="rounded-full h-14 w-14"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              onClick={onAccept}
              className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ActiveCallProps {
  callState: CallState
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
}

function ActiveCall({ callState, onEndCall, onToggleMute, onToggleVideo }: ActiveCallProps) {
  const [callDuration, setCallDuration] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (callState.status === "connected" && callState.startTime) {
      const interval = setInterval(() => {
        const now = new Date()
        const start = new Date(callState.startTime!)
        const duration = Math.floor((now.getTime() - start.getTime()) / 1000)
        setCallDuration(duration)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [callState.status, callState.startTime])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusText = () => {
    switch (callState.status) {
      case "calling": return "Calling..."
      case "ringing": return "Ringing..."
      case "connected": return formatDuration(callDuration)
      default: return ""
    }
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 z-50 w-64 bg-card/95 backdrop-blur-lg border-primary/20">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {callState.participantName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{callState.participantName}</p>
                <p className="text-xs text-muted-foreground">{getStatusText()}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onEndCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 bg-card/95 backdrop-blur-lg border-primary/20 shadow-2xl">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="relative">
            <Avatar className="h-32 w-32 mx-auto ring-4 ring-primary/20">
              <AvatarFallback className="text-3xl font-semibold">
                {callState.participantName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {callState.type === "video" && (
              <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary">
                <Video className="h-3 w-3 mr-1" />
                Video Call
              </Badge>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-xl">{callState.participantName}</h3>
            <p className="text-muted-foreground">{getStatusText()}</p>
          </div>

          {/* Video call area - placeholder */}
          {callState.type === "video" && callState.status === "connected" && (
            <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
              <p className="text-muted-foreground">Video call interface</p>
            </div>
          )}

          {/* Call Controls */}
          <div className="flex justify-center space-x-3">
            <Button
              size="lg"
              variant={callState.isMuted ? "destructive" : "secondary"}
              onClick={onToggleMute}
              className="rounded-full h-12 w-12"
              title={callState.isMuted ? "Unmute" : "Mute"}
            >
              {callState.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {callState.type === "video" && (
              <Button
                size="lg"
                variant={callState.isVideoEnabled ? "secondary" : "destructive"}
                onClick={onToggleVideo}
                className="rounded-full h-12 w-12"
                title={callState.isVideoEnabled ? "Turn off video" : "Turn on video"}
              >
                {callState.isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            )}

            <Button
              size="lg"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
              className="rounded-full h-12 w-12"
              title="Minimize"
            >
              <Minimize className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={onEndCall}
              className="rounded-full h-12 w-12"
              title="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CallComponent({ 
  callState, 
  onStartCall, 
  onEndCall, 
  onToggleMute, 
  onToggleVideo,
  participantName = "Unknown",
  participantAvatar,
  participantId = ""
}: CallComponentProps) {
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string
    callerAvatar?: string
    callType: "audio" | "video"
  } | null>(null)

  // Simulate incoming call (this would come from your real-time communication system)
  const simulateIncomingCall = (type: "audio" | "video") => {
    setIncomingCall({
      callerName: participantName,
      callerAvatar: participantAvatar,
      callType: type
    })
  }

  const handleAcceptCall = () => {
    if (incomingCall) {
      onStartCall(incomingCall.callType, participantId)
      setIncomingCall(null)
    }
  }

  const handleDeclineCall = () => {
    setIncomingCall(null)
  }



  return (
    <>
      {/* Incoming call overlay */}
      {incomingCall && (
        <IncomingCall
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Active call overlay */}
      {callState?.isActive && (
        <ActiveCall
          callState={callState}
          onEndCall={onEndCall}
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleVideo}
        />
      )}
    </>
  )
}