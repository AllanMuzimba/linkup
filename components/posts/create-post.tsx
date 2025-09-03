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
  RotateCcw,
  Smile,
  Filter
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { CreatePostData } from "@/types/post"
import * as faceapi from 'face-api.js'

interface CreatePostProps {
  onCreatePost: (postData: CreatePostData) => void
  isOpen: boolean
  onClose: () => void
}

// Video effect types
type VideoEffect = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast'

// Face filter types
type FaceFilter = 'none' | 'dog-nose' | 'dog-ears' | 'sunglasses' | 'mustache' | 'flower'

// Emoji overlay interface
interface EmojiOverlay {
  id: string
  emoji: string
  x: number
  y: number
  size: number
}

export function CreatePost({ onCreatePost, isOpen, onClose }: CreatePostProps) {
  const { user } = useAuth()
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public")
  const [location, setLocation] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [mediaMode, setMediaMode] = useState<"image" | "video" | "camera" | "preview" | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [currentEffect, setCurrentEffect] = useState<VideoEffect>('none')
  const [backgroundMusic, setBackgroundMusic] = useState<File | null>(null)
  const [showMusicOptions, setShowMusicOptions] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined)
  const [showCameraOptions, setShowCameraOptions] = useState(false)
  // Face filter and emoji states
  const [showFaceFilters, setShowFaceFilters] = useState(false)
  const [currentFaceFilter, setCurrentFaceFilter] = useState<FaceFilter>('none')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiOverlays, setEmojiOverlays] = useState<EmojiOverlay[]>([])
  const [draggingEmojiId, setDraggingEmojiId] = useState<string | null>(null)
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  
  // Initialize face detection models
  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        // Check if we're in a browser environment and faceapi is available
        if (typeof window !== 'undefined' && (window as any).faceapi) {
          await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          await (window as any).faceapi.nets.faceLandmark68Net.loadFromUri('/models');
          console.log('Face detection models loaded successfully');
          setFaceApiLoaded(true);
        } else {
          console.log('face-api.js not available, face detection features disabled');
        }
      } catch (error) {
        console.error('Error loading face detection models:', error);
        // Don't show toast error as this is optional functionality
        console.log('Face detection features will be disabled due to missing models');
      }
    };
    
    loadFaceModels();
    
    return () => {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
    };
  }, []);
  
  // Start face detection
  const startFaceDetection = () => {
    // Only start if models are loaded
    if (!faceApiLoaded) {
      console.log('Face detection models not loaded, skipping face detection');
      return;
    }
    
    if (!videoRef.current) return;
    
    // Clear any existing interval
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
    }
    
    // Start detection interval
    faceDetectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          // Check if models are available before detection
          if (faceApiLoaded) {
            const detections = await (window as any).faceapi.detectAllFaces(
              videoRef.current, 
              new (window as any).faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks();
            
            // Render face filters if a filter is selected
            if (currentFaceFilter !== 'none' && detections.length > 0) {
              // In a real implementation, this would render the face filters
              console.log('Face detected with filter:', currentFaceFilter);
            }
          }
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }
    }, 100); // Run detection every 100ms
  };
  
  // Stop face detection
  const stopFaceDetection = () => {
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
  }
  
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

  // Face filters
  const faceFilters: Record<FaceFilter, string> = {
    none: 'No Filter',
    'dog-nose': 'Dog Nose',
    'dog-ears': 'Dog Ears',
    'sunglasses': 'Sunglasses',
    'mustache': 'Mustache',
    'flower': 'Flower'
  }

  // Sample music tracks (in a real app, these would come from an API)
  const musicTracks = [
    { id: '1', name: 'Upbeat Pop', url: '/music/upbeat-pop.mp3' },
    { id: '2', name: 'Chill Vibes', url: '/music/chill-vibes.mp3' },
    { id: '3', name: 'Energetic Rock', url: '/music/energetic-rock.mp3' },
    { id: '4', name: 'Hip Hop Beat', url: '/music/hip-hop-beat.mp3' }
  ]

  // Emoji categories for overlays
  const emojiCategories = {
    faces: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩"],
    hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💖", "💕", "💞", "💓", "💗"],
    objects: ["🔥", "⭐", "🌟", "✨", "💫", "⚡", "💥", "💯", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉"],
    animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵"]
  }

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
      
      if (videoDevices.length === 0) {
        toast.error("No camera found");
        return;
      }
      
      setAvailableCameras(videoDevices);
      
      // Use the specified device or the first available one
      const deviceIdToUse = deviceId || videoDevices[0].deviceId;
      setSelectedCameraId(deviceIdToUse);
      
      console.log("Requesting camera stream with device ID:", deviceIdToUse);
      
      // Request camera access with specific constraints
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceIdToUse ? { exact: deviceIdToUse } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("Camera started successfully");
        
        // Start face detection
        startFaceDetection();
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      toast.error("Failed to start camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    stopFaceDetection();
    stopRecording();
  };

  const startRecording = async () => {
    if (!mediaStreamRef.current) {
      toast.error("Camera not initialized");
      return;
    }
    
    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setSelectedVideo(url);
        setMediaMode('preview');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Recording stopped");
    }
  };

  const applyEffect = (effect: VideoEffect) => {
    setCurrentEffect(effect);
    if (videoRef.current) {
      videoRef.current.style.filter = videoEffects[effect];
    }
  };

  const applyFaceFilter = (filter: FaceFilter) => {
    // Check if face-api is available
    if (faceApiLoaded) {
      setCurrentFaceFilter(filter);
      // In a real implementation, this would apply the face filter
      toast.info(`Applied face filter: ${faceFilters[filter]}`);
    } else {
      toast.error("Face detection models not available. Feature disabled.");
    }
  };

  const addEmojiOverlay = (emoji: string) => {
    // Check if face-api is available
    if (faceApiLoaded) {
      const newOverlay: EmojiOverlay = {
        id: Math.random().toString(36).substr(2, 9),
        emoji,
        x: 50,
        y: 50,
        size: 40
      };
      setEmojiOverlays([...emojiOverlays, newOverlay]);
    } else {
      toast.error("Face detection models not available. Feature disabled.");
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !selectedVideo) {
      toast.error("Please add some content or media to your post");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare post data
      const postData: CreatePostData = {
        content: content.trim(),
        visibility,
        location: location || undefined,
        tags: tags.length > 0 ? tags : undefined,
        video: selectedVideo ? new File([], "recorded-video.webm", { type: 'video/webm' }) : undefined
      };
      
      await onCreatePost(postData);
      
      // Reset form
      setContent("");
      setTags([]);
      setSelectedVideo(null);
      setMediaMode(null);
      setEmojiOverlays([]);
      
      toast.success("Post created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (selectedVideo) {
        URL.revokeObjectURL(selectedVideo);
      }
    };
  }, [selectedVideo]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
              />
              
              {/* Tag Input */}
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button 
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="h-8 w-32 text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={handleAddTag} className="h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Media Preview Area */}
          <div className="relative border rounded-lg bg-muted aspect-video flex items-center justify-center min-h-[300px]">
            {!mediaMode && (
              <div className="text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-2" />
                <p>Add photos or videos to your post</p>
              </div>
            )}

            {/* Camera Mode */}
            {mediaMode === 'camera' && (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                  style={{ filter: videoEffects[currentEffect] }}
                />
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>REC</span>
                  </div>
                )}
                
                {/* Camera Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <Square className="h-6 w-6 text-white" />
                    ) : (
                      <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={() => setShowEffects(!showEffects)}
                  >
                    <Filter className="h-6 w-6 text-white" />
                  </Button>
                  
                  {/* Face filters button - disabled if models not loaded */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={() => {
                      if (faceApiLoaded) {
                        setShowFaceFilters(!showFaceFilters);
                      } else {
                        toast.error("Face detection models not available. Feature disabled.");
                      }
                    }}
                    disabled={!faceApiLoaded}
                  >
                    <Smile className="h-6 w-6 text-white" />
                  </Button>
                  
                  {/* Emoji picker button - disabled if models not loaded */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={() => {
                      if (faceApiLoaded) {
                        setShowEmojiPicker(!showEmojiPicker);
                      } else {
                        toast.error("Face detection models not available. Feature disabled.");
                      }
                    }}
                    disabled={!faceApiLoaded}
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={() => setShowMusicOptions(!showMusicOptions)}
                  >
                    <Music className="h-6 w-6 text-white" />
                  </Button>
                  
                  {/* Camera Switch Button */}
                  {availableCameras.length > 1 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70"
                      onClick={() => setShowCameraOptions(!showCameraOptions)}
                    >
                      <RotateCcw className="h-6 w-6 text-white" />
                    </Button>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-4 right-4 h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                  onClick={() => {
                    stopCamera()
                    setMediaMode(null)
                    setSelectedVideo(null)
                    setEmojiOverlays([]) // Clear emoji overlays when stopping camera
                  }}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
                
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
                
                {/* Face Filters Panel */}
                {showFaceFilters && (
                  <div className="absolute top-12 left-2 bg-black/70 rounded-lg p-2 flex space-x-2">
                    {Object.entries(faceFilters).map(([filter, name]) => (
                      <Button
                        key={filter}
                        size="sm"
                        variant={currentFaceFilter === filter ? "default" : "secondary"}
                        className="h-8 text-xs"
                        onClick={() => applyFaceFilter(filter as FaceFilter)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Emoji Picker Panel */}
                {showEmojiPicker && (
                  <div className="absolute top-12 right-2 bg-black/70 rounded-lg p-2 w-48 max-h-40 overflow-y-auto">
                    <div className="text-white text-sm font-medium mb-2">Add Emoji</div>
                    {Object.entries(emojiCategories).map(([category, emojis]) => (
                      <div key={category} className="mb-2">
                        <div className="text-xs text-gray-400 capitalize">{category}</div>
                        <div className="grid grid-cols-6 gap-1">
                          {emojis.map((emoji, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              className="h-8 w-8 p-0 text-lg hover:bg-white/20"
                              onClick={() => addEmojiOverlay(emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
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
                    <div className="text-xs text-gray-300 mb-2">No music selected</div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full h-8 text-xs bg-white/10 hover:bg-white/20"
                      onClick={() => {
                        setShowMusicOptions(false);
                        // In a real implementation, this would open a music selection dialog
                        toast.info("Music selection would be implemented here");
                      }}
                    >
                      Select Music
                    </Button>
                  </div>
                )}
                
                {/* Recording Controls */}
                {isRecording && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 rounded-full w-4 h-4 animate-pulse"></div>
                )}
              </div>
            )}
            
            {/* Preview Mode */}
            {mediaMode === 'preview' && selectedVideo && (
              <div className="relative w-full h-full">
                <video
                  ref={previewRef}
                  src={selectedVideo}
                  className="w-full h-full object-cover rounded-lg"
                  controls
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                  onClick={() => {
                    setMediaMode('camera');
                    if (availableCameras.length > 0) {
                      startCamera(selectedCameraId);
                    }
                  }}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  if (!mediaMode) {
                    setMediaMode('image');
                    // In a real implementation, this would open image selection
                    toast.info("Image selection would be implemented here");
                  }
                }}
              >
                <ImageIcon className="h-4 w-4" />
                <span className="sr-only">Add image</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  if (!mediaMode) {
                    // Check if we have camera access
                    navigator.mediaDevices.enumerateDevices()
                      .then(devices => {
                        const videoDevices = devices.filter(device => device.kind === 'videoinput');
                        if (videoDevices.length > 0) {
                          setMediaMode('camera');
                          setAvailableCameras(videoDevices);
                          startCamera(videoDevices[0].deviceId);
                        } else {
                          toast.error("No camera found");
                        }
                      })
                      .catch(err => {
                        console.error("Error accessing camera:", err);
                        toast.error("Camera access denied");
                      });
                  }
                }}
              >
                <Video className="h-4 w-4" />
                <span className="sr-only">Record video</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  // In a real implementation, this would open location selection
                  toast.info("Location tagging would be implemented here");
                }}
              >
                <MapPin className="h-4 w-4" />
                <span className="sr-only">Add location</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  // In a real implementation, this would open hashtag input
                  toast.info("Hashtag input would be implemented here");
                }}
              >
                <Hash className="h-4 w-4" />
                <span className="sr-only">Add hashtag</span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select 
                value={visibility} 
                onValueChange={(value: "public" | "friends" | "private") => setVisibility(value)}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <span className="flex items-center">
                    {visibility === 'public' && <Globe className="h-3 w-3 mr-1" />}
                    {visibility === 'friends' && <Users className="h-3 w-3 mr-1" />}
                    {visibility === 'private' && <Lock className="h-3 w-3 mr-1" />}
                    {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center">
                      <Globe className="h-3 w-3 mr-2" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-2" />
                      Friends
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center">
                      <Lock className="h-3 w-3 mr-2" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                size="sm" 
                onClick={handleCreatePost}
                disabled={isSubmitting || (!content.trim() && !selectedVideo)}
                className="h-8"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}