"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, BarChart3 } from "lucide-react"
import type { Post } from "@/types/post"
import type { SocialPlatform, ShareOptions } from "@/types/sharing"

interface SocialShareModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: "twitter",
    name: "Twitter",
    icon: "🐦",
    color: "bg-blue-500",
    shareUrl: "https://twitter.com/intent/tweet",
    enabled: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    color: "bg-blue-600",
    shareUrl: "https://www.facebook.com/sharer/sharer.php",
    enabled: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "bg-blue-700",
    shareUrl: "https://www.linkedin.com/sharing/share-offsite/",
    enabled: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📷",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    shareUrl: "",
    enabled: false, // Instagram doesn't support direct URL sharing
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "💬",
    color: "bg-green-500",
    shareUrl: "https://wa.me/",
    enabled: true,
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    color: "bg-blue-400",
    shareUrl: "https://t.me/share/url",
    enabled: true,
  },
]

export function SocialShareModal({ isOpen, onClose, post }: SocialShareModalProps) {
  const [customMessage, setCustomMessage] = useState(post.content)
  const [shareUrl] = useState(`${window.location.origin}/posts/${post.id}`)
  const [copied, setCopied] = useState(false)

  const handleShare = (platform: SocialPlatform) => {
    // Default invite message
    const inviteMessage = "Join me on Kubatana - the ultimate social platform! 🌐"
    const fullMessage = `${customMessage}\n\n${inviteMessage}\n${shareUrl}`
    
    const shareOptions: ShareOptions = {
      url: shareUrl,
      title: `${post.author.name}'s Post on Kubatana`,
      description: fullMessage,
      image: post.mediaUrls?.[0],
      hashtags: post.tags,
    }

    let finalUrl = ""

    switch (platform.id) {
      case "twitter":
        finalUrl = `${platform.shareUrl}?text=${encodeURIComponent(fullMessage)}&url=${encodeURIComponent(shareUrl)}&hashtags=${post.tags?.join(",") || ""}`
        break
      case "facebook":
        finalUrl = `${platform.shareUrl}?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(fullMessage)}`
        break
      case "linkedin":
        finalUrl = `${platform.shareUrl}?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareOptions.title)}&summary=${encodeURIComponent(fullMessage)}`
        break
      case "whatsapp":
        finalUrl = `${platform.shareUrl}?text=${encodeURIComponent(fullMessage)}`
        break
      case "telegram":
        finalUrl = `${platform.shareUrl}?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(fullMessage)}`
        break
    }

    if (finalUrl) {
      window.open(finalUrl, "_blank", "width=600,height=400")
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post Preview */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-sm">{post.author.name}</span>
              <Badge variant="outline" className="text-xs">
                {post.author.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
            {post.mediaUrls && post.mediaUrls.length > 0 && post.type === 'image' && (
              <img
                src={post.mediaUrls[0] || "/placeholder.svg"}
                alt="Post preview"
                className="w-full h-32 object-cover rounded mt-2"
              />
            )}
          </div>

          {/* Custom Message */}
          <div>
            <label className="text-sm font-medium mb-2 block">Custom Message</label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add your own message..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              An invite message will be automatically added when sharing to external platforms.
            </p>
          </div>

          <Separator />

          {/* Social Platforms */}
          <div>
            <label className="text-sm font-medium mb-3 block">Share to Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {socialPlatforms.map((platform) => (
                <Button
                  key={platform.id}
                  variant="outline"
                  onClick={() => handleShare(platform)}
                  disabled={!platform.enabled}
                  className="flex items-center justify-start space-x-2 h-12"
                >
                  <span className="text-lg">{platform.icon}</span>
                  <span className="text-sm">{platform.name}</span>
                  {!platform.enabled && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      Soon
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Direct Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Direct Link</label>
            <div className="flex space-x-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Analytics Preview */}
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Share Analytics</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">{post.sharesCount || 0}</div>
                <div className="text-xs text-muted-foreground">Total Shares</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">{Math.floor(Math.random() * 50) + 10}</div>
                <div className="text-xs text-muted-foreground">Clicks</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">{Math.floor(Math.random() * 20) + 5}%</div>
                <div className="text-xs text-muted-foreground">Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}