"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Edit, MapPin, Link, Calendar, Shield, Users, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { UserProfile } from "@/types/user"

interface ProfileHeaderProps {
  profile: UserProfile
  isOwnProfile?: boolean
  onProfileUpdate?: (profile: Partial<UserProfile>) => void
}

export function ProfileHeader({ profile, isOwnProfile = false, onProfileUpdate }: ProfileHeaderProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: profile.name,
    username: profile.username,
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
  })

  const handleSave = () => {
    onProfileUpdate?.(editForm)
    setIsEditing(false)
  }

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

  return (
    <Card className="relative overflow-hidden">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
        {profile.coverImage && (
          <img src={profile.coverImage || "/placeholder.svg"} alt="Cover" className="w-full h-full object-cover" />
        )}
        {isOwnProfile && (
          <Button size="sm" variant="secondary" className="absolute top-4 right-4">
            <Camera className="h-4 w-4 mr-2" />
            Edit Cover
          </Button>
        )}
      </div>

      <CardContent className="relative pt-0">
        {/* Profile Picture */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16 relative z-10">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
              <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <Button size="sm" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0">
                <Camera className="h-4 w-4" />
              </Button>
            )}
            {profile.isOnline && (
              <div className="absolute bottom-2 right-2 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>

          <div className="flex-1 mt-4 sm:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  {profile.isVerified && <Shield className="h-5 w-5 text-primary" />}
                  {user && <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              <div className="flex space-x-2 mt-4 sm:mt-0">
                {isOwnProfile ? (
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
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
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            placeholder="Where are you located?"
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={editForm.website}
                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSave}>Save Changes</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <>
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Follow
                    </Button>
                    <Button>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio and Info */}
            <div className="mt-4 space-y-2">
              {profile.bio && <p className="text-sm">{profile.bio}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center">
                    <Link className="h-4 w-4 mr-1" />
                    <a
                      href={profile.website}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {profile.joinedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
              </div>

              {/* Stats */}
              <div className="flex space-x-6 text-sm pt-2">
                <div>
                  <span className="font-semibold">{profile.followingCount}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
                <div>
                  <span className="font-semibold">{profile.followersCount}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{profile.postsCount}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
