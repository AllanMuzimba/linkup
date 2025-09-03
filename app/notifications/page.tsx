"use client"

import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { BulkNotifications } from "@/components/admin/bulk-notifications"

export default function NotificationsPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Please log in to access notifications.</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Bulk Notifications</h1>
            <p className="text-muted-foreground">Send notifications to users and manage communication</p>
          </div>
          <BulkNotifications />
        </div>
      </main>
    </div>
  )
}
