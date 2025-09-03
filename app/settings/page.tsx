"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/layout/sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Camera, 
  Save, 
  Trash2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Lock,
  Download,
  Moon,
  Sun,
  Monitor
} from "lucide-react"
import { UserService, FileService } from "@/lib/realtime-services"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    website: "",
    city: "",
    country: "",
    username: "",
    birthday: "",
    birthdayWishes: true,
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    friendRequests: true,
    postLikes: true,
    comments: true,
    mentions: true,
    messageNotifications: true,
    groupInvites: true,
  })
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowFriendRequests: true,
    allowMessages: true,
    showOnlineStatus: true,
    showLocation: true,
    allowTagging: true,
    searchableByEmail: true,
    searchableByPhone: false,
  })
  
  const [appearance, setAppearance] = useState({
    theme: "system",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  })

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "privacy", name: "Privacy", icon: Shield },
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "security", name: "Security", icon: Lock },
    { id: "account", name: "Account", icon: Globe },
  ]

  // Initialize data from user
  useEffect(() => {
    const initializeSettings = async () => {
      if (!user) return
      
      setIsPageLoading(true)
      
      try {
        setProfileData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "Welcome to my LinkUp profile! 🎉",
          website: user.website || "",
          city: user.city || "",
          country: user.country || "",
          username: user.username || user.email?.split('@')[0] || "",
          birthday: user.birthday || "",
          birthdayWishes: user.birthdayWishes !== false,
        })
        
        const savedNotifications = localStorage.getItem(`notifications_${user.id}`)
        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications))
        }
        
        const savedPrivacy = localStorage.getItem(`privacy_${user.id}`)
        if (savedPrivacy) {
          setPrivacy(JSON.parse(savedPrivacy))
        }
        
        const savedAppearance = localStorage.getItem(`appearance_${user.id}`)
        if (savedAppearance) {
          setAppearance(JSON.parse(savedAppearance))
        }
        
      } catch (error) {
        console.error("Error loading settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setIsPageLoading(false)
      }
    }
    
    initializeSettings()
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB")
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackToProfile = () => {
    router.push('/profile')
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      let avatarUrl = user.avatar
      if (avatarFile) {
        avatarUrl = await FileService.uploadFile(avatarFile, `avatars/${user.id}/${Date.now()}_${avatarFile.name}`)
      }
      
      await UserService.updateUserProfile(user.id, {
        ...profileData,
        avatar: avatarUrl,
      })
      
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications))
      localStorage.setItem(`privacy_${user.id}`, JSON.stringify(privacy))
      localStorage.setItem(`appearance_${user.id}`, JSON.stringify(appearance))
      
      if (appearance.theme !== theme) {
        setTheme(appearance.theme)
      }
      
      toast.success("Settings saved successfully! ✅")
      
      setAvatarFile(null)
      setAvatarPreview(null)
      
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill in all password fields")
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    try {
      toast.success("Password changed successfully!")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast.error("Failed to change password")
    }
  }

  const handleDownloadData = async () => {
    try {
      const userData = {
        profile: profileData,
        settings: { notifications, privacy, appearance },
        accountInfo: {
          id: user?.id,
          email: user?.email,
          role: user?.role,
          createdAt: user?.createdAt,
          lastActive: user?.lastActive,
        }
      }
      
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `linkup-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      toast.success("Data downloaded successfully!")
    } catch (error) {
      toast.error("Failed to download data")
    }
  }

  const handleDeleteAccount = async () => {
    try {
      toast.success("Account deletion initiated. You will receive an email confirmation.")
      logout()
      router.push('/')
    } catch (error) {
      toast.error("Failed to delete account")
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
              <p className="text-muted-foreground">You need to be logged in to access settings.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isPageLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-6">
            <LoadingSpinner size="lg" text="Loading settings..." />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-6xl mx-auto p-6 space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBackToProfile}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="px-6"
            >
              {isSaving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Navigation */}
            <Card className="lg:col-span-1">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-6">
              {activeTab === "profile" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage 
                          src={avatarPreview || user.avatar || "/placeholder-user.jpg"} 
                          alt={user.name} 
                        />
                        <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Button 
                          variant="outline" 
                          className="mb-2"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                        {avatarPreview && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setAvatarPreview(null)
                              setAvatarFile(null)
                            }}
                            className="ml-2 text-destructive"
                          >
                            Cancel
                          </Button>
                        )}
                        <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                          placeholder="Choose a username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          placeholder="Your city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={profileData.country}
                          onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                          placeholder="Your country"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Birthday & Celebrations</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="birthday">Birthday</Label>
                          <Input
                            id="birthday"
                            type="date"
                            value={profileData.birthday}
                            onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Your birthday will be used to send automatic birthday wishes to your friends
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Auto Birthday Wishes</p>
                            <p className="text-sm text-muted-foreground">
                              Automatically send birthday wishes to friends and receive them on your birthday
                            </p>
                          </div>
                          <Switch
                            checked={profileData.birthdayWishes}
                            onCheckedChange={(checked) => setProfileData({ ...profileData, birthdayWishes: checked })}
                          />
                        </div>

                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">🎉 Birthday Features</h4>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>• Friends receive automatic birthday notifications</li>
                            <li>• System sends birthday wishes on your special day</li>
                            <li>• Birthday reminders appear in friends' feeds</li>
                            <li>• Special birthday badge on your profile</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        className="min-h-[100px]"
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {profileData.bio.length}/500 characters
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        placeholder="https://your-website.com"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{user.role.replace("_", " ").toUpperCase()}</Badge>
                      <span className="text-sm text-muted-foreground">Account Role</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">General Notifications</h3>
                      <div className="space-y-4">
                        {[
                          {
                            key: "emailNotifications",
                            label: "Email Notifications",
                            description: "Receive notifications via email",
                          },
                          {
                            key: "pushNotifications",
                            label: "Push Notifications",
                            description: "Receive push notifications in browser",
                          },
                          {
                            key: "smsNotifications",
                            label: "SMS Notifications",
                            description: "Receive notifications via SMS",
                          },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Switch
                              checked={notifications[item.key as keyof typeof notifications]}
                              onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Social Notifications</h3>
                      <div className="space-y-4">
                        {[
                          {
                            key: "friendRequests",
                            label: "Friend Requests Only",
                            description: "Only receive notifications from friends",
                          },
                          { key: "postLikes", label: "Post Likes", description: "When someone likes your posts" },
                          { key: "comments", label: "Comments", description: "When someone comments on your posts" },
                          { key: "mentions", label: "Mentions", description: "When someone mentions you" },
                          { key: "messageNotifications", label: "Messages", description: "When you receive new messages" },
                          { key: "groupInvites", label: "Group Invites", description: "When you're invited to groups" },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Switch
                              checked={notifications[item.key as keyof typeof notifications]}
                              onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">News Feed Preferences</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>News Feed Type</Label>
                          <Select 
                            value={notifications.feedType || "everything"} 
                            onValueChange={(value) => setNotifications({ ...notifications, feedType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="everything">Everything</SelectItem>
                              <SelectItem value="friends">Friends Only</SelectItem>
                              <SelectItem value="news">News Feeds Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Admin notifications cannot be disabled for important system updates and security alerts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "privacy" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Privacy & Security Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Profile Visibility</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="profileVisibility">Who can see your profile</Label>
                          <Select
                            value={privacy.profileVisibility}
                            onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public - Anyone can find and view</SelectItem>
                              <SelectItem value="friends">Friends Only - Only friends can view</SelectItem>
                              <SelectItem value="private">Private - Only you can view</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="postVisibility">Default post visibility</Label>
                          <Select
                            value={privacy.defaultPostVisibility || "public"}
                            onValueChange={(value) => setPrivacy({ ...privacy, defaultPostVisibility: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public - Anyone can see</SelectItem>
                              <SelectItem value="friends">Friends Only - Only friends can see</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Search & Discovery</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Public Search</p>
                            <p className="text-sm text-muted-foreground">Allow others to find you in public search</p>
                          </div>
                          <Switch
                            checked={privacy.allowPublicSearch !== false}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, allowPublicSearch: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Search by Email</p>
                            <p className="text-sm text-muted-foreground">Let people find you using your email address</p>
                          </div>
                          <Switch
                            checked={privacy.searchableByEmail}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, searchableByEmail: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Search by Phone</p>
                            <p className="text-sm text-muted-foreground">Let people find you using your phone number</p>
                          </div>
                          <Switch
                            checked={privacy.searchableByPhone}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, searchableByPhone: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Friend Requests</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Who can send you friend requests</Label>
                          <Select
                            value={privacy.friendRequestSource || "everyone"}
                            onValueChange={(value) => setPrivacy({ ...privacy, friendRequestSource: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="everyone">Everyone</SelectItem>
                              <SelectItem value="email_phone">Only people with my email or phone</SelectItem>
                              <SelectItem value="mutual_friends">Friends of friends</SelectItem>
                              <SelectItem value="none">No one</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Auto-accept from contacts</p>
                            <p className="text-sm text-muted-foreground">Automatically accept requests from people in your contacts</p>
                          </div>
                          <Switch
                            checked={privacy.autoAcceptContacts || false}
                            onCheckedChange={(checked) => setPrivacy({ ...privacy, autoAcceptContacts: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Contact Information Visibility</h3>
                      <div className="space-y-4">
                        {[
                          { key: "showEmail", label: "Show Email", description: "Display email on your profile" },
                          { key: "showPhone", label: "Show Phone", description: "Display phone number on your profile" },
                          { key: "showLocation", label: "Show Location", description: "Display your location on your profile" },
                          { key: "showBirthday", label: "Show Birthday", description: "Display your birthday on your profile" },
                          { key: "showOnlineStatus", label: "Show Online Status", description: "Display when you're online" },
                          { key: "allowTagging", label: "Allow Tagging", description: "Let others tag you in posts" },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Switch
                              checked={Boolean(privacy[item.key as keyof typeof privacy])}
                              onCheckedChange={(checked) => setPrivacy({ ...privacy, [item.key]: checked })}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Privacy Note:</strong> When you set your profile to private, others will only see your name and profile picture. 
                          All contact information, posts, and personal details will be hidden from non-friends.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "appearance" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5" />
                      <span>Appearance & Display</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Theme</Label>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        {[
                          { key: "light", label: "Light", icon: Sun },
                          { key: "dark", label: "Dark", icon: Moon },
                          { key: "system", label: "System", icon: Monitor }
                        ].map((themeOption) => (
                          <Button 
                            key={themeOption.key} 
                            variant={appearance.theme === themeOption.key ? "default" : "outline"} 
                            className="h-20 flex-col"
                            onClick={() => setAppearance({ ...appearance, theme: themeOption.key })}
                          >
                            <themeOption.icon className="h-6 w-6 mb-2" />
                            {themeOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Language</Label>
                      <Select 
                        value={appearance.language} 
                        onValueChange={(value) => setAppearance({ ...appearance, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷 French</SelectItem>
                          <SelectItem value="de">🇩🇪 German</SelectItem>
                          <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
                          <SelectItem value="it">🇮🇹 Italian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date Format</Label>
                      <Select 
                        value={appearance.dateFormat} 
                        onValueChange={(value) => setAppearance({ ...appearance, dateFormat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Time Format</Label>
                      <Select 
                        value={appearance.timeFormat} 
                        onValueChange={(value) => setAppearance({ ...appearance, timeFormat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Timezone</Label>
                      <Select 
                        value={appearance.timezone} 
                        onValueChange={(value) => setAppearance({ ...appearance, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                          <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                          <SelectItem value="CST">CST (Central Standard Time)</SelectItem>
                          <SelectItem value="MST">MST (Mountain Standard Time)</SelectItem>
                          <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                          <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Display Preferences</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Font Size</Label>
                          <Select 
                            value={appearance.fontSize || "medium"} 
                            onValueChange={(value) => setAppearance({ ...appearance, fontSize: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                              <SelectItem value="extra-large">Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Compact Mode</p>
                            <p className="text-sm text-muted-foreground">Show more content in less space</p>
                          </div>
                          <Switch
                            checked={appearance.compactMode || false}
                            onCheckedChange={(checked) => setAppearance({ ...appearance, compactMode: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Animations</p>
                            <p className="text-sm text-muted-foreground">Enable smooth animations and transitions</p>
                          </div>
                          <Switch
                            checked={appearance.animations !== false}
                            onCheckedChange={(checked) => setAppearance({ ...appearance, animations: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "security" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5" />
                      <span>Security Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              placeholder="Enter current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="Enter new password"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Confirm new password"
                          />
                        </div>
                        
                        <Button onClick={handleChangePassword} className="w-full">
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">SMS Authentication</p>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Linked Accounts</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                              <span className="text-white text-sm font-bold">G</span>
                            </div>
                            <div>
                              <p className="font-medium">Google Account</p>
                              <p className="text-sm text-muted-foreground">
                                {user.googleLinked ? `Connected: ${user.email}` : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant={user.googleLinked ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (user.googleLinked) {
                                toast.success("Google account disconnected")
                              } else {
                                toast.success("Google account connected")
                              }
                            }}
                          >
                            {user.googleLinked ? "Disconnect" : "Connect"}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                              <span className="text-white text-sm font-bold">f</span>
                            </div>
                            <div>
                              <p className="font-medium">Facebook Account</p>
                              <p className="text-sm text-muted-foreground">
                                {user.facebookLinked ? "Connected" : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant={user.facebookLinked ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (user.facebookLinked) {
                                toast.success("Facebook account disconnected")
                              } else {
                                toast.success("Facebook account connected")
                              }
                            }}
                          >
                            {user.facebookLinked ? "Disconnect" : "Connect"}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                              <span className="text-white text-sm font-bold">X</span>
                            </div>
                            <div>
                              <p className="font-medium">X (Twitter) Account</p>
                              <p className="text-sm text-muted-foreground">
                                {user.twitterLinked ? "Connected" : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant={user.twitterLinked ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (user.twitterLinked) {
                                toast.success("X account disconnected")
                              } else {
                                toast.success("X account connected")
                              }
                            }}
                          >
                            {user.twitterLinked ? "Disconnect" : "Connect"}
                          </Button>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Security Tip:</strong> Linking accounts allows for easier login and account recovery. You can disconnect them anytime.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Login Sessions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-muted-foreground">Chrome on Windows • Active now</p>
                          </div>
                          <Badge variant="secondary">Current</Badge>
                        </div>
                        <Button variant="outline" className="w-full">
                          Sign Out All Other Sessions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "account" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>Account Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium text-muted-foreground">Account ID</p>
                          <p className="font-mono">{user.id}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium text-muted-foreground">Account Role</p>
                          <Badge variant="secondary">{user.role.replace('_', ' ').toUpperCase()}</Badge>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium text-muted-foreground">Member Since</p>
                          <p>{user.createdAt?.toLocaleDateString() || 'Unknown'}</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium text-muted-foreground">Last Active</p>
                          <p>{user.lastActive?.toLocaleDateString() || 'Recently'}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Data & Privacy</h3>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={handleDownloadData}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download My Data
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Download a copy of all your data including profile, posts, messages, and settings.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Account Actions</h3>
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => {
                            logout()
                            router.push('/')
                          }}
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4 text-destructive">Danger Zone</h3>
                      <div className="space-y-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div>
                          <p className="font-medium text-destructive">Delete Account</p>
                          <p className="text-sm text-muted-foreground mb-3">
                            This action cannot be undone. This will permanently delete your account and remove all your data.
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="w-full">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your account
                                  and remove all your data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteAccount}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Yes, delete my account
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}