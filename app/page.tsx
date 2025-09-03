"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { Sidebar } from "@/components/layout/sidebar"
import { RoleBasedDashboard } from "@/components/dashboard/role-based-dashboard"

function Dashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <RoleBasedDashboard />
        </div>
      </main>
    </div>
  )
}

export default function HomePage() {
  const { user, isLoading } = useAuth()

  // Debug logging
  console.log('HomePage render:', { user: !!user, isLoading, userEmail: user?.email })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl font-bold text-white linkup-animate">L</div>
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-2xl animate-ping mx-auto" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              LinkUp
            </h2>
            <p className="text-muted-foreground mt-2">Connecting you to your community...</p>
          </div>
        </div>
      </div>
    )
  }

  // If user exists but we're still loading (edge case), show loading state
  if (user && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl font-bold text-white linkup-animate">L</div>
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-2xl animate-ping mx-auto" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              LinkUp
            </h2>
            <p className="text-muted-foreground mt-2">Setting up your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <Dashboard />
}