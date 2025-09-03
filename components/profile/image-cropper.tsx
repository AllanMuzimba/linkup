"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RotateCw, ZoomIn, ZoomOut, Move, Crop, Save, X } from "lucide-react"
import { toast } from "sonner"

// Simple Slider component since it might not be available
const Slider = ({ value, onValueChange, min, max, step, className }: {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step: number
  className?: string
}) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange([parseFloat(e.target.value)])}
    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
  />
)

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  imageType: 'profile' | 'cover'
  onSave: (croppedBlob: Blob) => void
}

export function ImageCropper({ isOpen, onClose, imageFile, imageType, onSave }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Image dimensions based on type
  const cropDimensions = imageType === 'profile' 
    ? { width: 400, height: 400 } // Square for profile
    : { width: 800, height: 300 } // Wide for cover

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = cropDimensions.width
    canvas.height = cropDimensions.height

    setImageLoaded(true)
    drawImage()
  }, [cropDimensions])

  const drawImage = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !imageLoaded) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imageRef.current
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Save context
    ctx.save()
    
    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2)
    
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180)
    
    // Apply scale and position
    ctx.scale(scale, scale)
    ctx.translate(position.x, position.y)
    
    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    
    // Restore context
    ctx.restore()

    // Draw crop overlay
    drawCropOverlay(ctx)
  }, [imageLoaded, scale, rotation, position])

  const drawCropOverlay = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out'
    if (imageType === 'profile') {
      // Circular crop for profile
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 20, 0, 2 * Math.PI)
      ctx.fill()
    } else {
      // Rectangular crop for cover
      const cropWidth = canvas.width - 40
      const cropHeight = canvas.height - 40
      ctx.fillRect(20, 20, cropWidth, cropHeight)
    }
    
    ctx.globalCompositeOperation = 'source-over'
    
    // Crop border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    if (imageType === 'profile') {
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 20, 0, 2 * Math.PI)
      ctx.stroke()
    } else {
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)
    }
  }

  // Load image when file changes
  useEffect(() => {
    if (imageFile && isOpen) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [imageFile, isOpen])

  // Redraw when parameters change
  useEffect(() => {
    drawImage()
  }, [drawImage])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const deltaX = (e.clientX - dragStart.x) / scale
    const deltaY = (e.clientY - dragStart.y) / scale
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
    
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSave = async () => {
    if (!canvasRef.current) return
    
    try {
      // Create final crop canvas
      const finalCanvas = document.createElement('canvas')
      const finalCtx = finalCanvas.getContext('2d')
      if (!finalCtx || !imageRef.current) return

      if (imageType === 'profile') {
        finalCanvas.width = 400
        finalCanvas.height = 400
        
        // Create circular mask
        finalCtx.beginPath()
        finalCtx.arc(200, 200, 200, 0, 2 * Math.PI)
        finalCtx.clip()
      } else {
        finalCanvas.width = 800
        finalCanvas.height = 300
      }

      // Draw the cropped image
      finalCtx.save()
      finalCtx.translate(finalCanvas.width / 2, finalCanvas.height / 2)
      finalCtx.rotate((rotation * Math.PI) / 180)
      finalCtx.scale(scale, scale)
      finalCtx.translate(position.x, position.y)
      finalCtx.drawImage(imageRef.current, -imageRef.current.width / 2, -imageRef.current.height / 2)
      finalCtx.restore()

      // Convert to blob
      finalCanvas.toBlob((blob) => {
        if (blob) {
          onSave(blob)
          onClose()
          toast.success("Image cropped successfully!")
        }
      }, 'image/jpeg', 0.9)
      
    } catch (error) {
      console.error('Error cropping image:', error)
      toast.error("Failed to crop image")
    }
  }

  const resetTransform = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Crop {imageType === 'profile' ? 'Profile' : 'Cover'} Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Canvas for image editing */}
          <div className="flex justify-center">
            <div className="relative border border-border rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={cropDimensions.width}
                height={cropDimensions.height}
                className="cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Hidden image element */}
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              onLoad={handleImageLoad}
              className="hidden"
              alt="Crop source"
            />
          )}

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Zoom */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <ZoomIn className="h-4 w-4 mr-2" />
                Zoom: {scale.toFixed(1)}x
              </Label>
              <Slider
                value={[scale]}
                onValueChange={(value) => setScale(value[0])}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <RotateCw className="h-4 w-4 mr-2" />
                Rotation: {rotation}°
              </Label>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Move className="h-4 w-4 mr-2" />
                Position
              </Label>
              <div className="text-sm text-muted-foreground">
                X: {position.x.toFixed(0)}, Y: {position.y.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetTransform}>
              Reset
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Crop
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Drag the image to reposition it</li>
              <li>Use the zoom slider to scale the image</li>
              <li>Rotate the image using the rotation slider</li>
              <li>The {imageType === 'profile' ? 'circular' : 'rectangular'} area will be your final crop</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}