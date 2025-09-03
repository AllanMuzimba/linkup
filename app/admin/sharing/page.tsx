"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { RealTimeBulkNotifications } from "@/components/admin/real-time-bulk-notifications"
import { useAuth } from "@/contexts/auth-context"

export default function AdminSharingPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Please log in to access admin features</div>
  }

  if (user.role !== 'super_admin') {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-muted-foreground">
                Only super administrators can access bulk notifications.
              </p>
            </div>
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Bulk Notifications</h1>
            <p className="text-muted-foreground">
              Send notifications to all users or specific groups across the LinkUp platform.
            </p>
          </div>
          
          <RealTimeBulkNotifications />
        </div>
      </main>
    </div>
  )
}