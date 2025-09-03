"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Bell, 
  Moon, 
  Sun, 
  Monitor,
  ChevronDown
} from "lucide-react"
import { useTheme } from "next-themes"
import { UserProfile } from "./user-profile"

export function UserMenu() {
  const { user, logout, hasPermission } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showProfile, setShowProfile] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-3 h-auto p-3 w-full justify-start">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar || ""} alt={user.name} />
              <AvatarFallback className="text-sm">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={user.role === 'super_admin' ? 'destructive' : user.role === 'level_admin' ? 'secondary' : 'default'}
                className="text-xs"
              >
                {user.role === 'super_admin' ? 'Admin' : user.role === 'level_admin' ? 'Mod' : 'User'}
              </Badge>
              <ChevronDown className="w-4 h-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge 
                  variant={user.role === 'super_admin' ? 'destructive' : user.role === 'level_admin' ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {user.role.replace('_', ' ').toUpperCase()}
                </Badge>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-muted-foreground">
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowProfile(true)} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
          
          {hasPermission('admin_access') && (
            <DropdownMenuItem className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Theme Selector */}
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Theme</p>
            <div className="flex space-x-1">
              <Button
                variant={theme === 'light' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1 h-8"
              >
                <Sun className="w-3 h-3" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1 h-8"
              >
                <Moon className="w-3 h-3" />
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('system')}
                className="flex-1 h-8"
              >
                <Monitor className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Manage your profile information and account settings
            </DialogDescription>
          </DialogHeader>
          <UserProfile />
        </DialogContent>
      </Dialog>
    </>
  )
}
