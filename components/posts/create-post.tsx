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
  // Face filter and emoji states
  const [showFaceFilters, setShowFaceFilters] = useState(false)
  const [currentFaceFilter, setCurrentFaceFilter] = useState<FaceFilter>('none')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiOverlays, setEmojiOverlays] = useState<EmojiOverlay[]>([])
  const [draggingEmojiId, setDraggingEmojiId] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize face detection models
  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        console.log('Face detection models loaded')
      } catch (error) {
        console.error('Error loading face detection models:', error)
        toast.error('Failed to load face detection models')
      }
    }
    
    loadFaceModels()
    
    return () => {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current)
      }
    }
  }, [])
  
  // Start face detection
  const startFaceDetection = () => {
    if (!videoRef.current) return
    
    // Clear any existing interval
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current)
    }
    
    // Start detection interval
    faceDetectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceLandmarks()
          
          // Render face filters if a filter is selected
          if (currentFaceFilter !== 'none' && detections.length > 0) {
            renderFaceFilter(detections);
          }
        } catch (error) {
          console.error('Face detection error:', error)
        }
      }
    }, 100) // Run detection every 100ms
  }
  
  // Stop face detection
  const stopFaceDetection = () => {
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current)
      faceDetectionIntervalRef.current = null
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
            
            // Start face detection
            startFaceDetection();
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
            startFaceDetection(); // Start face detection
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
    
    // Stop face detection
    stopFaceDetection();
  }

  const applyEffect = (effect: VideoEffect) => {
    setCurrentEffect(effect)
    setShowEffects(false)
  }

  // Apply face filter
  const applyFaceFilter = (filter: FaceFilter) => {
    setCurrentFaceFilter(filter)
    setShowFaceFilters(false)
    
    // If a filter is selected and camera is active, start face detection
    if (filter !== 'none' && mediaStreamRef.current) {
      startFaceDetection()
    } else if (filter === 'none') {
      // Clear canvas if no filter is selected
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  }

  // Add emoji overlay
  const addEmojiOverlay = (emoji: string) => {
    const newEmoji: EmojiOverlay = {
      id: Date.now().toString(),
      emoji,
      x: 50,
      y: 50,
      size: 40
    }
    setEmojiOverlays([...emojiOverlays, newEmoji])
    setShowEmojiPicker(false)
  }

  // Remove emoji overlay
  const removeEmojiOverlay = (id: string) => {
    setEmojiOverlays(emojiOverlays.filter(emoji => emoji.id !== id))
  }

  // Start dragging emoji
  const startDraggingEmoji = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingEmojiId(id)
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingEmojiId || !videoRef.current) return
    
    const videoRect = videoRef.current.getBoundingClientRect()
    const x = ((e.clientX - videoRect.left) / videoRect.width) * 100
    const y = ((e.clientY - videoRect.top) / videoRect.height) * 100
    
    setEmojiOverlays(emojiOverlays.map(emoji => 
      emoji.id === draggingEmojiId 
        ? { ...emoji, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } 
        : emoji
    ))
  }

  // Stop dragging
  const stopDragging = () => {
    setDraggingEmojiId(null)
  }

  // Render face filter on canvas
  const renderFaceFilter = (detections: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>[]) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };
    
    faceapi.matchDimensions(canvas, displaySize);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw face filter based on current selection
      resizedDetections.forEach(detection => {
        const landmarks = detection.landmarks;
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const mouth = landmarks.getMouth();
        
        switch (currentFaceFilter) {
          case 'dog-nose':
            // Draw dog nose filter
            if (nose.length > 0) {
              const noseTip = nose[Math.floor(nose.length / 2)];
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.arc(noseTip.x, noseTip.y, 10, 0, Math.PI * 2);
              ctx.fill();
              
              // Draw nostrils
              ctx.beginPath();
              ctx.arc(noseTip.x - 5, noseTip.y, 3, 0, Math.PI * 2);
              ctx.arc(noseTip.x + 5, noseTip.y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
            
          case 'dog-ears':
            // Draw dog ears filter
            if (leftEye.length > 0 && rightEye.length > 0) {
              const leftEarX = leftEye[0].x - 20;
              const leftEarY = leftEye[0].y - 40;
              const rightEarX = rightEye[rightEye.length - 1].x + 20;
              const rightEarY = rightEye[rightEye.length - 1].y - 40;
              
              // Draw left ear
              ctx.fillStyle = '#8B4513';
              ctx.beginPath();
              ctx.moveTo(leftEarX, leftEarY);
              ctx.lineTo(leftEarX - 15, leftEarY - 30);
              ctx.lineTo(leftEarX + 10, leftEarY);
              ctx.fill();
              
              // Draw right ear
              ctx.beginPath();
              ctx.moveTo(rightEarX, rightEarY);
              ctx.lineTo(rightEarX + 15, rightEarY - 30);
              ctx.lineTo(rightEarX - 10, rightEarY);
              ctx.fill();
            }
            break;
            
          case 'sunglasses':
            // Draw sunglasses filter
            if (leftEye.length > 0 && rightEye.length > 0) {
              const leftEyeBounds = {
                x: Math.min(...leftEye.map(p => p.x)),
                y: Math.min(...leftEye.map(p => p.y)),
                width: Math.max(...leftEye.map(p => p.x)) - Math.min(...leftEye.map(p => p.x)),
                height: Math.max(...leftEye.map(p => p.y)) - Math.min(...leftEye.map(p => p.y))
              };
              
              const rightEyeBounds = {
                x: Math.min(...rightEye.map(p => p.x)),
                y: Math.min(...rightEye.map(p => p.y)),
                width: Math.max(...rightEye.map(p => p.x)) - Math.min(...rightEye.map(p => p.y)),
                height: Math.max(...rightEye.map(p => p.y)) - Math.min(...rightEye.map(p => p.y))
              };
              
              // Draw sunglasses
              ctx.fillStyle = '#000';
              ctx.fillRect(
                leftEyeBounds.x - 10, 
                leftEyeBounds.y - 10, 
                (rightEyeBounds.x + rightEyeBounds.width + 10) - (leftEyeBounds.x - 10), 
                Math.max(leftEyeBounds.height, rightEyeBounds.height) + 20
              );
              
              // Draw bridge
              ctx.fillRect(
                leftEyeBounds.x + leftEyeBounds.width - 5,
                leftEyeBounds.y - 10,
                (rightEyeBounds.x - (leftEyeBounds.x + leftEyeBounds.width)) + 10,
                10
              );
            }
            break;
            
          case 'mustache':
            // Draw mustache filter
            if (mouth.length > 0) {
              const upperLip = mouth.slice(0, 6);
              const centerX = upperLip.reduce((sum, point) => sum + point.x, 0) / upperLip.length;
              const centerY = upperLip.reduce((sum, point) => sum + point.y, 0) / upperLip.length;
              
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.ellipse(centerX, centerY + 10, 30, 10, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
            
          case 'flower':
            // Draw flower filter on nose
            if (nose.length > 0) {
              const noseTip = nose[Math.floor(nose.length / 2)];
              ctx.fillStyle = '#FF69B4';
              ctx.beginPath();
              ctx.arc(noseTip.x, noseTip.y - 20, 15, 0, Math.PI * 2);
              ctx.fill();
              
              // Draw flower center
              ctx.fillStyle = '#FFD700';
              ctx.beginPath();
              ctx.arc(noseTip.x, noseTip.y - 20, 5, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
        }
      });
    }
  };

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
        setEmojiOverlays([]); // Clear emoji overlays when closing
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
        setEmojiOverlays([]) // Clear emoji overlays
        setCurrentFaceFilter('none') // Reset face filter
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
                  onMouseMove={handleMouseMove}
                  onMouseUp={stopDragging}
                  onMouseLeave={stopDragging}
                />
                
                {/* Canvas for face filters */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-64 rounded-lg"
                  style={{ zIndex: 5 }}
                />
                
                {/* Emoji overlays */}
                {emojiOverlays.map((emoji) => (
                  <div
                    key={emoji.id}
                    className="absolute cursor-move"
                    style={{
                      left: `${emoji.x}%`,
                      top: `${emoji.y}%`,
                      fontSize: `${emoji.size}px`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                      touchAction: 'none'
                    }}
                    onMouseDown={(e) => startDraggingEmoji(emoji.id, e)}
                  >
                    <div className="relative">
                      {emoji.emoji}
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeEmojiOverlay(emoji.id)
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                
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
                    
                    {/* Face Filters Button */}
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => setShowFaceFilters(!showFaceFilters)}
                    >
                      <Filter className="h-4 w-4 text-white" />
                    </Button>
                    
                    {/* Emoji Picker Button */}
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="h-4 w-4 text-white" />
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
                      setEmojiOverlays([]) // Clear emoji overlays when stopping camera
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
                    <div className="text-white text-sm font-medium mb-2">Background