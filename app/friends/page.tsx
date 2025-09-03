"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { RealTimeFriends } from "@/components/friends/real-time-friends"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/auth-context"

export default function FriendsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (!user) {
    return <div>Please log in to view friends</div>
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <LoadingSpinner size="lg" text="Loading friends..." />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold">Friends & Connections</h1>
          <RealTimeFriends />
        </div>
      </main>
    </div>
  )
}