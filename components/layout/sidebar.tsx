"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/auth/user-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { NotificationBell } from "@/components/notifications/notification-bell"
import {
  Home,
  Users,
  MessageCircle,
  Settings,
  Bell,
  BarChart3,
  Shield,
  Code,
  Plus,
  User,
  Share,
} from "lucide-react"
import { PERMISSIONS } from "@/types/auth"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, permission: null },
  { name: "Profile", href: "/profile", icon: User, permission: null },
  { name: "Posts & Stories", href: "/posts", icon: Plus, permission: PERMISSIONS.CREATE_POSTS },
  { name: "Messages", href: "/messages", icon: MessageCircle, permission: PERMISSIONS.CHAT_WITH_USERS },
  { name: "Friends", href: "/friends", icon: Users, permission: PERMISSIONS.MANAGE_FRIENDS },
  { name: "Notifications", href: "/notifications", icon: Bell, permission: PERMISSIONS.SEND_BULK_NOTIFICATIONS },
  { name: "Admin Dashboard", href: "/admin/dashboard", icon: Shield, permission: PERMISSIONS.MANAGE_ALL_USERS },
  { name: "Support Center", href: "/support/dashboard", icon: MessageCircle, permission: PERMISSIONS.SEND_BULK_NOTIFICATIONS },
  { name: "Analytics", href: "/analytics", icon: BarChart3, permission: PERMISSIONS.VIEW_ANALYTICS },
  { name: "Settings", href: "/settings", icon: Settings, permission: null },
]

const roleColors = {
  super_admin: "bg-destructive text-destructive-foreground",
  developer: "bg-primary text-primary-foreground",
  level_admin: "bg-secondary text-secondary-foreground",
  user: "bg-muted text-muted-foreground",
}

const roleLabels = {
  super_admin: "Super Admin",
  developer: "Developer",
  level_admin: "Level Admin",
  user: "User",
}

export function Sidebar() {
  const { user, logout, hasPermission } = useAuth()
  const pathname = usePathname()
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  if (!user) return null

  const visibleNavigation = navigation.filter((item) => !item.permission || hasPermission(item.permission))

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setLoadingPath(href)
      // Clear loading state after navigation
      setTimeout(() => setLoadingPath(null), 1000)
    }
  }

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-light rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              LinkUp
            </h1>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-sidebar-border">
        <UserMenu />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href
            const isLoading = loadingPath === item.href
            
            return (
              <li key={item.name}>
                <Link href={item.href} onClick={() => handleNavClick(item.href)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" className="mr-3" />
                    ) : (
                      <item.icon className="mr-3 h-4 w-4" />
                    )}
                    {item.name}
                    {isLoading && (
                      <span className="ml-auto text-xs text-muted-foreground">Loading...</span>
                    )}
                  </Button>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Credits and About Section */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link href="/about">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Code className="mr-3 h-4 w-4" />
            About
          </Button>
        </Link>
        <div className="text-xs text-muted-foreground px-3 py-2">
          <p className="font-medium mb-1">LinkUp v1.0</p>
          <p className="mb-2">Developed by Allan R Muzimba</p>
          <p className="text-[10px] leading-tight">
            A Zimbabwean software developer passionate about connecting people through technology.
          </p>
        </div>
      </div>
    </div>
  )
}
