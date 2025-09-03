"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ImageIcon, 
  MapPin, 
  Hash, 
  Globe, 
  Users, 
  Lock, 
  X, 
  Plus, 
  Video,
  Camera,
  Square,
  Music,
  Sparkles,
  RotateCcw
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { CreatePostData } from "@/types/post"

interface CreatePostProps {
  onCreatePost: (postData: CreatePostData) => void
  isOpen: boolean
  onClose: () => void
}

// Video effect types
type VideoEffect = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast'

export function CreatePost({ onCreatePost, isOpen, onClose }: CreatePostProps) {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public")
  const [location, setLocation] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [mediaMode, setMediaMode] = useState<"image" | "video" | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [currentEffect, setCurrentEffect] = useState<VideoEffect>('none')
  const [backgroundMusic, setBackgroundMusic] = useState<File | null>(null)
  const [showMusicOptions, setShowMusicOptions] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined)
  const [showCameraOptions, setShowCameraOptions] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  
  // Video effects
  const videoEffects: Record<VideoEffect, string> = {
    none: '',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    invert: 'invert(100%)',
    blur: 'blur(5px)',
    brightness: 'brightness(150%)',
    contrast: 'contrast(200%)'
  }

  // Sample music tracks (in a real app, these would come from an API)
  const musicTracks = [
    { id: '1', name: 'Upbeat Pop', url: '/music/upbeat-pop.mp3' },
    { id: '2', name: 'Chill Vibes', url: '/music/chill-vibes.mp3' },
    { id: '3', name: 'Energetic Rock', url: '/music/energetic-rock.mp3' },
    { id: '4', name: 'Hip Hop Beat', url: '/music/hip-hop-beat.mp3' }
  ]

  // Video recording functions
  const startCamera = async (deviceId?: string) => {
    try {
      // First stop any existing streams
      stopCamera();
      
      console.log("Starting camera initialization...");
      
      // Force permission prompt again to ensure we have the right permissions
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log("Camera permission status:", permissionStatus.state);
      
      // Request list of available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log("Available video devices:", videoDevices);
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length === 0) {
        console.error("No video devices found");
        toast.error("No cameras detected on your device");
        return;
      }
      
      // Set constraints based on available cameras and selected device
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      };
      
      // Add deviceId constraint if specified
      if (deviceId) {
        (constraints.video as MediaTrackConstraints).deviceId = { exact: deviceId };
      }
      
      console.log("Using video constraints:", constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Stream obtained successfully", stream.getVideoTracks());
      
      if (stream.getVideoTracks().length === 0) {
        console.error("No video tracks in the stream");
        toast.error("Camera stream has no video. Please try again.");
        return;
      }
      
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        console.log("Setting stream to video element");
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = 'block'; // Ensure video is visible
        
        // Wait for metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          if (videoRef.current) {
            // Add explicit play() call with proper error handling
            videoRef.current.play().catch(err => {
              console.error("Error playing video:", err);
              toast.error("Could not start camera preview. Please try reloading the page.");
            });
          }
        };
        
        // Add error handler
        videoRef.current.onerror = (err) => {
          console.error("Video element error:", err);
          toast.error("Error displaying video stream");
        };
      } else {
        console.error("Video ref is null");
        toast.error("Video element not found. Please try again.");
        return;
      }
      
      setMediaMode("video");
      console.log("Camera initialization complete");
    } catch (error: any) {
      console.error("Camera error:", error);
      // Provide more specific error messages based on the error
      if (error.name === 'NotAllowedError') {
        toast.error("Camera access denied. Please enable camera access in your browser settings.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No camera found. Please check your camera connection.");
      } else if (error.name === 'NotReadableError') {
        toast.error("Camera is already in use by another application.");
      } else if (error.name === 'OverconstrainedError') {
        toast.error("Camera doesn't meet the required constraints. Trying with basic settings...");
        // Try again with minimal constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.style.display = 'block';
            videoRef.current.play().catch(e => console.error("Play error:", e));
          }
          setMediaMode("video");
        } catch (retryError) {
          console.error("Retry camera error:", retryError);
          toast.error("Could not access camera even with minimal settings.");
        }
      } else {
        toast.error(`Camera error: ${error.message || "Unknown error"}`);
      }
    }
  }

  const startRecording = async () => {
    if (!mediaStreamRef.current) return
    
    recordedChunksRef.current = []
    
    try {
      // Create a MediaRecorder with audio mixing if background music is selected
      if (backgroundMusic && audioContextRef.current) {
        // In a real implementation, you would mix the microphone audio with background music
        // This is a simplified version for demonstration
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current)
      } else {
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current)
      }
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const videoFile = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' })
        setSelectedVideo(videoFile)
        stopCamera()
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      toast.error("Failed to start recording")
      console.error("Recording error:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const stopCamera = () => {
    console.log("Stopping camera...");
    if (mediaStreamRef.current) {
      console.log("Stopping media tracks");
      mediaStreamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      mediaStreamRef.current = null;
    } else {
      console.log("No media stream to stop");
    }
    if (videoRef.current) {
      console.log("Clearing video element");
      videoRef.current.srcObject = null;
    }
  }

  const applyEffect = (effect: VideoEffect) => {
    setCurrentEffect(effect)
    setShowEffects(false)
  }

  const handleMusicSelect = (track: { id: string; name: string; url: string }) => {
    // In a real implementation, you would load and play the selected track
    toast.success(`Selected music: ${track.name}`)
    setShowMusicOptions(false)
  }

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && !selectedVideo) return

    const postData: CreatePostData = {
      content: content.trim(),
      images: selectedImages.length > 0 ? selectedImages : undefined,
      video: selectedVideo || undefined,
      visibility,
      tags: tags.length > 0 ? tags : undefined,
      location: location.trim() || undefined,
    }

    try {
      onCreatePost(postData)
      
      // Show success notification
      toast.success("Post created successfully! 🎉")
      
      // Reset form
      setContent("")
      setVisibility("public")
      setLocation("")
      setTags([])
      setSelectedImages([])
      setSelectedVideo(null)
      setIsExpanded(false)
      setMediaMode(null)
      setCurrentEffect('none')
      setBackgroundMusic(null)
      stopCamera()
      
      // Close the dialog
      onClose()
    } catch (error) {
      toast.error("Failed to create post. Please try again.")
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages((prev) => [...prev, ...files].slice(0, 4)) // Max 4 images
    setMediaMode("image")
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeVideo = () => {
    setSelectedVideo(null)
    setMediaMode(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Add this useEffect to handle permission checking and cleanup
  useEffect(() => {
    if (isOpen && mediaMode === "video") {
      // Check if we have a stale stream
      if (mediaStreamRef.current) {
        const videoTracks = mediaStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0 && !videoTracks[0].enabled) {
          console.log("Detected stale video track, restarting camera");
          stopCamera();
          startCamera();
        }
      }
    }
    
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, mediaMode]);

  const visibilityIcons = {
    public: Globe,
    friends: Users,
    private: Lock,
  }

  const VisibilityIcon = visibilityIcons[visibility]

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Clean up when closing dialog
        stopCamera()
        setSelectedVideo(null)
        setSelectedImages([])
        setMediaMode(null)
        setCurrentEffect('none')
        setBackgroundMusic(null)
      }
      onClose()
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.name}</p>
                <div className="flex items-center space-x-2">
                  <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                    <SelectTrigger className="w-auto h-auto p-1 border-none">
                      <SelectValue>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <VisibilityIcon className="h-3 w-3" />
                          <span className="capitalize">{visibility}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>Public</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="friends">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Friends</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4" />
                          <span>Private</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="border-none resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0"
              rows={isExpanded ? 4 : 2}
            />

            {/* Video Recording Preview */}
            {mediaMode === "video" && (
              <div className="mt-4 relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  style={{ 
                    filter: videoEffects[currentEffect],
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  className="w-full h-64 rounded-lg bg-black"
                />
                
                {/* Fallback message if video fails to display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      stopCamera();
                      setTimeout(() => startCamera(), 500);
                    }}
                  >
                    Camera not showing? Click to retry
                  </Button>
                </div>

                {isRecording && (
                  <div className="absolute top-2 left-2 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-white text-sm font-medium">REC</span>
                  </div>
                )}
                
                {/* Video Controls */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => setShowEffects(!showEffects)}
                    >
                      <Sparkles className="h-4 w-4 text-white" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => setShowMusicOptions(!showMusicOptions)}
                    >
                      <Music className="h-4 w-4 text-white" />
                    </Button>

                    {/* Camera Switch Button */}
                    {availableCameras.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                        onClick={() => setShowCameraOptions(!showCameraOptions)}
                      >
                        <RotateCcw className="h-4 w-4 text-white" />
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                    onClick={() => {
                      stopCamera()
                      setMediaMode(null)
                      setSelectedVideo(null)
                    }}
                  >
                    <X className="h-4 w-4 text-white" />
                  </Button>
                </div>
                
                {/* Effects Panel */}
                {showEffects && (
                  <div className="absolute top-12 left-2 bg-black/70 rounded-lg p-2 flex space-x-2">
                    {Object.entries(videoEffects).map(([effect, _]) => (
                      <Button
                        key={effect}
                        size="sm"
                        variant={currentEffect === effect ? "default" : "secondary"}
                        className="h-8 text-xs"
                        onClick={() => applyEffect(effect as VideoEffect)}
                      >
                        {effect.charAt(0).toUpperCase() + effect.slice(1)}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Camera Selection Panel */}
                {showCameraOptions && (
                  <div className="absolute top-12 left-2 bg-black/70 rounded-lg p-2 w-48 max-h-40 overflow-y-auto">
                    <div className="text-white text-sm font-medium mb-2">Choose Camera</div>
                    {availableCameras.map((camera, index) => (
                      <Button
                        key={camera.deviceId}
                        variant="ghost"
                        className="w-full justify-start h-8 text-white text-xs hover:bg-white/20"
                        onClick={() => {
                          setSelectedCameraId(camera.deviceId);
                          startCamera(camera.deviceId);
                          setShowCameraOptions(false);
                        }}
                      >
                        <Camera className="h-3 w-3 mr-2" />
                        Camera {index + 1} {camera.label ? `(${camera.label})` : ''}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Music Panel */}
                {showMusicOptions && (
                  <div className="absolute top-12 right-2 bg-black/70 rounded-lg p-2 w-48 max-h-40 overflow-y-auto">
                    <div className="text-white text-sm font-medium mb-2">Background Music</div>
                    {musicTracks.map((track) => (
                      <Button
                        key={track.id}
                        variant="ghost"
                        className="w-full justify-start h-8 text-white text-xs hover:bg-white/20"
                        onClick={() => handleMusicSelect(track)}
                      >
                        <Music className="h-3 w-3 mr-2" />
                        {track.name}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-8 text-white text-xs hover:bg-white/20"
                      onClick={() => {
                        setBackgroundMusic(null)
                        setShowMusicOptions(false)
                      }}
                    >
                      <X className="h-3 w-3 mr-2" />
                      No Music
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Video Preview */}
            {selectedVideo && (
              <div className="mt-4 relative">
                <video 
                  src={URL.createObjectURL(selectedVideo)} 
                  controls 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={removeVideo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                    <Button size="sm" variant="ghost" className="h-auto w-auto p-0 ml-1" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Location */}
            {location && (
              <div className="flex items-center space-x-2 mt-4 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
                <Button size="sm" variant="ghost" className="h-auto w-auto p-0" onClick={() => setLocation("")}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                {/* Image Upload */}
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageSelect} 
                    disabled={mediaMode === "video" || !!selectedVideo}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground" 
                    disabled={mediaMode === "video" || !!selectedVideo}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo
                  </Button>
                </label>

                {/* Video Recording */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={mediaMode === "video" ? (isRecording ? stopRecording : startRecording) : startCamera}
                  disabled={selectedImages.length > 0 || !!selectedVideo}
                >
                  {mediaMode === "video" ? (
                    isRecording ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        {selectedVideo ? "Record Again" : "Record"}
                      </>
                    )
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </>
                  )}
                </Button>

                {/* Location */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Add Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Where are you?"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <Button onClick={() => {}} className="w-full">
                        Add Location
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Tags */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Hash className="h-4 w-4 mr-2" />
                      Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Add Tags</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addTag()}
                        />
                        <Button onClick={addTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              #{tag}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-auto w-auto p-0 ml-1"
                                onClick={() => removeTag(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Button onClick={handleSubmit} disabled={!content.trim() && selectedImages.length === 0 && !selectedVideo}>
                Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}