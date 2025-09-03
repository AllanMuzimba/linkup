export interface SocialPlatform {
  id: string
  name: string
  icon: string
  color: string
  shareUrl: string
  enabled: boolean
}

export interface ShareOptions {
  url: string
  title: string
  description: string
  image?: string
  hashtags?: string[]
}

export interface ShareAnalytics {
  platform: string
  shares: number
  clicks: number
  engagement: number
}
