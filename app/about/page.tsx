"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Code, 
  Heart, 
  Users, 
  MessageCircle, 
  Share2, 
  Bell, 
  Shield, 
  MapPin,
  Globe,
  Mail,
  Github,
  Linkedin
} from "lucide-react"

export default function AboutPage() {
  const features = [
    {
      icon: Users,
      title: "Friend Management",
      description: "Connect with friends, send requests, and build your network"
    },
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Chat with friends instantly with real-time messaging and group chats"
    },
    {
      icon: Share2,
      title: "Posts & Stories",
      description: "Share your moments with text, images, and videos"
    },
    {
      icon: MapPin,
      title: "Location-based Features",
      description: "Discover nearby friends and location-based posts"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Stay updated with real-time notifications for all activities"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Advanced privacy controls and secure authentication"
    }
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-4xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-3xl">L</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              LinkUp
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A modern social media platform designed to bring people together through meaningful connections and shared experiences.
            </p>
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Platform Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Developer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Developer & Founder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="/developer-avatar.png" alt="Allan R Muzimba" />
                  <AvatarFallback className="text-lg">AM</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Allan R Muzimba</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      Zimbabwe
                    </Badge>
                    <Badge variant="outline">Full-Stack Developer</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    A passionate Zimbabwean software developer with expertise in modern web technologies. 
                    Allan specializes in building scalable social platforms and real-time applications that 
                    connect people and communities across the globe.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-1" />
                      <span>allan@linkup.com</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Github className="h-4 w-4 mr-1" />
                      <span>@allanmuzimba</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Linkedin className="h-4 w-4 mr-1" />
                      <span>Allan Muzimba</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technology Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-medium mb-1">Frontend</div>
                  <div className="text-sm text-muted-foreground">Next.js, React, TypeScript</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-medium mb-1">Backend</div>
                  <div className="text-sm text-muted-foreground">Firebase, Firestore</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-medium mb-1">Styling</div>
                  <div className="text-sm text-muted-foreground">Tailwind CSS, shadcn/ui</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-medium mb-1">Real-time</div>
                  <div className="text-sm text-muted-foreground">Firebase Realtime</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsors & Partners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Sponsors & Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  We're actively seeking sponsors and partners to help grow the LinkUp community.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Interested in partnering with us? Get in touch!
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      partnerships@linkup.com
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>LinkUp v1.0.0 • Built with ❤️ in Zimbabwe</p>
            <p className="mt-1">© 2024 Allan R Muzimba. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  )
}