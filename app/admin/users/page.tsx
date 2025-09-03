"use client"

import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { UserManagement } from "@/components/admin/user-management"

export default function AdminUsersPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Please log in to access admin features.</div>
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
          <UserManagement />
        </div>
      </main>
    </div>
  )
}
