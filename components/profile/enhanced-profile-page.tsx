"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { 
  MapPin, Calendar, Users, MessageCircle, Heart, Edit, Camera, 
  Upload, Save, Gift, Eye, Share2, ThumbsUp, Clock, Globe,
  Lock, Users as UsersIcon, Navigation, Search, X
} from "lucide-react"
import { UserService, FileService, FriendService } from "@/lib/realtime-services"
import { ImageCropper } from "./image-cropper"
import { toast } from "sonner"

interface UserPost {
  id: string
  content: string
  mediaUrls?: string[]
  createdAt: Date
  likesCount: number
  commentsCount: number
  sharesCount: number
  visibility: 'public' | 'friends' | 'private'
  isLiked: boolean
}

interface UserProfile {
  id: string
  name: string
  username: string
  email: string
  bio?: string
  avatar?: string
  coverImage?: string
  phone?: string
  location?: string
  website?: string
  birthDate?: Date
  joinedDate: Date
  followersCount: number
  followingCount: number
  postsCount: number
  isVerified: boolean
  isPrivate: boolean
  lastActive: Date
  isOnline: boolean
}

export function EnhancedProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [likedPosts, setLikedPosts] = useState<UserPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  
  // Image upload states
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [coverPictureFile, setCoverPictureFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  
  // Image editing states
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [editingImageType, setEditingImageType] = useState<'profile' | 'cover' | null>(null)
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null)
  
  // Form data
  const [editData, setEditData] = useState({
    name: "",
    bio: "",
    phone: "",
    location: "",
    website: "",
    birthDate: "",
    isPrivate: false
  })

  // Friends/Followers data
  const [friends, setFriends] = useState<any[]>([])
  const [friendsCount, setFriendsCount] = useState(0)

  // Location-related states
  const [locationInput, setLocationInput] = useState("")
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string
    lat: number
    lng: number
    city?: string
    country?: string
  } | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // File input refs
  const profileFileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    loadUserProfile()
    loadUserPosts()
    loadLikedPosts()
    loadFriends()
    
    // Cleanup function
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [user])

  const loadFriends = () => {
    if (!user) return

    const unsubscribe = FriendService.subscribeToFriends(user.id, (friendsList) => {
      setFriends(friendsList)
      setFriendsCount(friendsList.length)
    })

    return unsubscribe
  }

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const userProfile = await UserService.getUserById(user.id)
      if (userProfile) {
        setProfile(userProfile as UserProfile)
        setEditData({
          name: userProfile.name || "",
          bio: userProfile.bio || "",
          phone: userProfile.phone || "",
          location: userProfile.location || "",
          website: userProfile.website || "",
          birthDate: userProfile.birthDate ? new Date(userProfile.birthDate).toISOString().split('T')[0] : "",
          isPrivate: userProfile.isPrivate || false
        })
        
        // Set location input from existing location
        if (userProfile.locationAddress) {
          setLocationInput(userProfile.locationAddress)
        } else if (userProfile.location && typeof userProfile.location === 'string') {
          setLocationInput(userProfile.location)
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserPosts = () => {
    if (!user) return

    const unsubscribe = UserService.subscribeToUserPosts(user.id, (posts) => {
      setUserPosts(posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })

    return unsubscribe
  }

  const loadLikedPosts = () => {
    if (!user) return

    const unsubscribe = UserService.subscribeToLikedPosts(user.id, (posts) => {
      setLikedPosts(posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })

    return unsubscribe
  }

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Profile picture must be less than 5MB")
        return
      }
      
      // Open image cropper instead of direct preview
      setOriginalImageFile(file)
      setEditingImageType('profile')
      setIsImageEditorOpen(true)
    }
  }

  const handleCoverPictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Cover image must be less than 10MB")
        return
      }
      
      // Open image cropper instead of direct preview
      setOriginalImageFile(file)
      setEditingImageType('cover')
      setIsImageEditorOpen(true)
    }
  }

  const handleCroppedImage = (croppedBlob: Blob) => {
    // Convert blob to file
    const file = new File([croppedBlob], `${editingImageType}_image.jpg`, { type: 'image/jpeg' })
    
    if (editingImageType === 'profile') {
      setProfilePictureFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else if (editingImageType === 'cover') {
      setCoverPictureFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    
    // Reset cropper states
    setIsImageEditorOpen(false)
    setEditingImageType(null)
    setOriginalImageFile(null)
    setCroppedImageBlob(null)
  }

  // Geolocation functions with debounce
  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([])
      return
    }

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(async () => {
      setIsGeolocating(true)
      try {
        // Using OpenStreetMap Nominatim API (free alternative to Google Places)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        )
        const data = await response.json()
        
        const suggestions = data.map((item: any) => ({
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          city: item.address?.city || item.address?.town || item.address?.village,
          country: item.address?.country,
          placeId: item.place_id
        }))
        
        setLocationSuggestions(suggestions)
      } catch (error) {
        console.error("Error searching location:", error)
        toast.error("Failed to search location")
      } finally {
        setIsGeolocating(false)
      }
    }, 500) // 500ms debounce

    setSearchTimeout(timeout)
  }

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location)
    setLocationInput(location.address)
    setLocationSuggestions([])
    setEditData(prev => ({ ...prev, location: location.address }))
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser")
      return
    }

    setIsGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          const data = await response.json()
          
          const location = {
            address: data.display_name,
            lat: latitude,
            lng: longitude,
            city: data.address?.city || data.address?.town || data.address?.village,
            country: data.address?.country
          }
          
          handleLocationSelect(location)
          toast.success("Current location detected!")
        } catch (error) {
          console.error("Error getting address:", error)
          toast.error("Failed to get address for current location")
        } finally {
          setIsGeolocating(false)
        }
      },
      (error) => {
        console.error("Error getting location:", error)
        toast.error("Failed to get current location")
        setIsGeolocating(false)
      }
    )
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      let profileImageUrl = profile?.avatar
      let coverImageUrl = profile?.coverImage

      // Upload profile picture if changed
      if (profilePictureFile) {
        profileImageUrl = await FileService.uploadAvatar(profilePictureFile)
      }

      // Upload cover picture if changed
      if (coverPictureFile) {
        coverImageUrl = await FileService.uploadCover(coverPictureFile)
      }

      // Prepare location data
      let locationData = editData.location
      let locationCoordinates = null
      let locationAddress = editData.location

      if (selectedLocation) {
        locationCoordinates = {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        }
        locationAddress = selectedLocation.address
      }

      // Update user profile
      const updateData = {
        ...editData,
        avatar: profileImageUrl,
        coverImage: coverImageUrl,
        location: locationCoordinates || editData.location,
        locationAddress: locationAddress,
        city: selectedLocation?.city || editData.location,
        country: selectedLocation?.country,
        birthDate: editData.birthDate ? new Date(editData.birthDate) : null
      }

      await UserService.updateUserProfile(user.id, updateData)
      
      // Refresh profile data
      await loadUserProfile()
      
      // Reset form states
      setProfilePictureFile(null)
      setCoverPictureFile(null)
      setProfilePreview(null)
      setCoverPreview(null)
      setSelectedLocation(null)
      setLocationSuggestions([])
      setIsEditDialogOpen(false)
      
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (date: Date | string | any) => {
    try {
      // Handle Firebase Timestamp objects
      if (date && typeof date === 'object' && date.toDate) {
        return date.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      // Handle regular dates and strings
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />
      case 'friends':
        return <UsersIcon className="h-4 w-4 text-blue-500" />
      case 'private':
        return <Lock className="h-4 w-4 text-gray-500" />
      default:
        return <Globe className="h-4 w-4 text-green-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Profile not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Cover Image and Profile Header */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Cover Image */}
          <div 
            className="h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/10 relative"
            style={{
              backgroundImage: coverPreview || profile.coverImage ? 
                `url(${coverPreview || profile.coverImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => coverFileRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Change Cover
            </Button>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16 md:-mt-20">
              {/* Profile Picture */}
              <div className="relative">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background">
                  <AvatarImage 
                    src={profilePreview || profile.avatar || "/placeholder-user.jpg"} 
                    alt={profile.name} 
                  />
                  <AvatarFallback className="text-2xl md:text-3xl">
                    {profile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2 rounded-full p-2"
                  onClick={() => profileFileRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              {/* User Info */}
              <div className="flex-1 mt-4 md:mt-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    {profile.bio && (
                      <p className="mt-2 text-sm max-w-md">{profile.bio}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    {profile.isVerified && (
                      <Badge variant="secondary">Verified</Badge>
                    )}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={editData.name}
                              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              value={editData.bio}
                              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                              placeholder="Tell us about yourself..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={editData.phone}
                              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                              <div className="flex space-x-2">
                                <div className="relative flex-1">
                                  <Input
                                    id="location"
                                    value={locationInput}
                                    onChange={(e) => {
                                      setLocationInput(e.target.value)
                                      searchLocation(e.target.value)
                                    }}
                                    placeholder="Enter your address or city"
                                    className="pr-10"
                                  />
                                  {isGeolocating && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    </div>
                                  )}
                                  {!isGeolocating && locationInput && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                      onClick={() => {
                                        setLocationInput("")
                                        setSelectedLocation(null)
                                        setLocationSuggestions([])
                                        setEditData(prev => ({ ...prev, location: "" }))
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={getCurrentLocation}
                                  disabled={isGeolocating}
                                  className="flex items-center space-x-1"
                                >
                                  <Navigation className="h-4 w-4" />
                                  <span className="hidden sm:inline">Current</span>
                                </Button>
                              </div>
                              
                              {/* Location Suggestions Dropdown */}
                              {locationSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  {locationSuggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      className="w-full px-3 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                                      onClick={() => handleLocationSelect(suggestion)}
                                    >
                                      <div className="flex items-start space-x-2">
                                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{suggestion.address}</p>
                                          {suggestion.city && suggestion.country && (
                                            <p className="text-xs text-muted-foreground">
                                              {suggestion.city}, {suggestion.country}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedLocation ? 
                                `📍 Coordinates: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` :
                                "Start typing to search for your location or use current location"
                              }
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              value={editData.website}
                              onChange={(e) => setEditData(prev => ({ ...prev, website: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="birthDate">Birth Date</Label>
                            <Input
                              id="birthDate"
                              type="date"
                              value={editData.birthDate}
                              onChange={(e) => setEditData(prev => ({ ...prev, birthDate: e.target.value }))}
                            />
                          </div>
                          <Button 
                            onClick={handleSaveProfile} 
                            disabled={isSaving}
                            className="w-full"
                          >
                            {isSaving ? (
                              <>
                                <LoadingSpinner className="mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="flex items-center space-x-6 mt-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">{userPosts.length}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{friendsCount}</div>
                    <div className="text-sm text-muted-foreground">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{likedPosts.length}</div>
                    <div className="text-sm text-muted-foreground">Liked</div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                  {(profile.locationAddress || profile.location) && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.locationAddress || 
                       (typeof profile.location === 'string' ? profile.location : 
                        profile.location?._lat ? `${profile.location._lat}, ${profile.location._long}` : 
                        'Location set')}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {typeof profile.joinedDate === 'string' ? 
                            new Date(profile.joinedDate).toLocaleDateString() : 
                            formatDate(profile.joinedDate)}
                  </div>
                  {profile.birthDate && (
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 mr-1" />
                      Born {typeof profile.birthDate === 'string' ? 
                            new Date(profile.birthDate).toLocaleDateString() : 
                            formatDate(profile.birthDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">My Posts</TabsTrigger>
          <TabsTrigger value="liked">Liked Posts</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* My Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Posts ({userPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No posts yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Share your first post to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <Card key={post.id} className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar || "/placeholder-user.jpg"} alt={profile.name} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{profile.name}</span>
                              <span className="text-muted-foreground">@{profile.username}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground text-sm">
                                {post.createdAt ? formatDate(post.createdAt) : 'Recently'}
                              </span>
                              {getVisibilityIcon(post.visibility)}
                            </div>
                            <p className="mt-2">{post.content}</p>
                            
                            {/* Post Media */}
                            {post.mediaUrls && post.mediaUrls.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {post.mediaUrls.map((url, index) => (
                                  <img
                                    key={index}
                                    src={url}
                                    alt="Post media"
                                    className="rounded-lg object-cover h-32 w-full"
                                  />
                                ))}
                              </div>
                            )}

                            {/* Post Stats */}
                            <div className="flex items-center space-x-6 mt-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Heart className={`h-4 w-4 ${post.isLiked ? 'text-red-500 fill-current' : ''}`} />
                                <span>{post.likesCount}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.commentsCount}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Share2 className="h-4 w-4" />
                                <span>{post.sharesCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liked Posts Tab */}
        <TabsContent value="liked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posts You've Engaged With ({likedPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {likedPosts.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No liked posts yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Posts you like will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {likedPosts.map((post) => (
                    <Card key={post.id} className="border-border/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder-user.jpg" alt="Author" />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Author Name</span>
                              <span className="text-muted-foreground">@username</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground text-sm">
                                {post.createdAt ? formatDate(post.createdAt) : 'Recently'}
                              </span>
                            </div>
                            <p className="mt-2">{post.content}</p>
                            
                            <div className="flex items-center space-x-6 mt-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Heart className="h-4 w-4 text-red-500 fill-current" />
                                <span>{post.likesCount}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.commentsCount}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Share2 className="h-4 w-4" />
                                <span>{post.sharesCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Friends ({friendsCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No friends yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect with people to build your network!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {friends.map((friend) => (
                    <Card key={friend.id} className="border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <div className="relative mb-3">
                          <Avatar className="h-16 w-16 mx-auto">
                            <AvatarImage src={friend.avatar || "/placeholder-user.jpg"} alt={friend.name} />
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {friend.isOnline && (
                            <div className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                          )}
                        </div>
                        <h3 className="font-medium text-sm truncate">{friend.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">@{friend.username || friend.email?.split('@')[0]}</p>
                        <div className="flex space-x-1 mt-3">
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About {profile.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.bio ? (
                <div>
                  <h3 className="font-medium mb-2">Bio</h3>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bio added yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add a bio to tell people about yourself
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.phone && (
                  <div>
                    <h3 className="font-medium mb-2">Phone</h3>
                    <p className="text-muted-foreground">{profile.phone}</p>
                  </div>
                )}
                
                {profile.website && (
                  <div>
                    <h3 className="font-medium mb-2">Website</h3>
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2">Member Since</h3>
                  <p className="text-muted-foreground">
                    {typeof profile.joinedDate === 'string' ? 
                      new Date(profile.joinedDate).toLocaleDateString() : 
                      formatDate(profile.joinedDate)}
                  </p>
                </div>

                {profile.birthDate && (
                  <div>
                    <h3 className="font-medium mb-2">Birthday</h3>
                    <p className="text-muted-foreground">
                      {typeof profile.birthDate === 'string' ? 
                        new Date(profile.birthDate).toLocaleDateString() : 
                        formatDate(profile.birthDate)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Cropper */}
      <ImageCropper
        isOpen={isImageEditorOpen}
        onClose={() => {
          setIsImageEditorOpen(false)
          setEditingImageType(null)
          setOriginalImageFile(null)
        }}
        imageFile={originalImageFile}
        imageType={editingImageType || 'profile'}
        onSave={handleCroppedImage}
      />

      {/* Hidden file inputs */}
      <input
        ref={profileFileRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePictureChange}
        className="hidden"
      />
      <input
        ref={coverFileRef}
        type="file"
        accept="image/*"
        onChange={handleCoverPictureChange}
        className="hidden"
      />
    </div>
  )
}