"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { EnhancedProfilePage } from "@/components/profile/enhanced-profile-page"

export default function ProfilePage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <EnhancedProfilePage />
      </main>
    </div>
  )
}