"use client"

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Paperclip, 
  Image, 
  Video, 
  Mic, 
  FileText, 
  AlertCircle,
  X,
  Upload
} from "lucide-react"

export interface FileAttachment {
  id: string
  name: string
  type: "image" | "video" | "audio" | "document"
  size: number
  url: string
  mimeType: string
  duration?: number
}

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024, // 50MB
  document: 10 * 1024 * 1024, // 10MB
}

const SUPPORTED_FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"] as const,
  video: ["video/mp4", "video/webm", "video/quicktime"] as const,
  audio: ["audio/mp3", "audio/wav", "audio/ogg", "audio/m4a"] as const,
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ] as const,
}

type SupportedFileType = typeof SUPPORTED_FILE_TYPES[keyof typeof SUPPORTED_FILE_TYPES][number]

interface FileAttachmentComponentProps {
  onFilesSelect?: (files: FileAttachment[]) => void
  maxFiles?: number
  disabled?: boolean
}

interface UploadingFile {
  id: string
  file: File
  progress: number
}

export function FileAttachmentComponent({
  onFilesSelect = () => {},
  maxFiles = 5,
  disabled = false
}: FileAttachmentComponentProps) {
  const [error, setError] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): "image" | "video" | "audio" | "document" | null => {
    const supportedTypes = Object.values(SUPPORTED_FILE_TYPES).flat()
    if (!supportedTypes.includes(file.type as SupportedFileType)) return null
    
    if (SUPPORTED_FILE_TYPES.image.includes(file.type as any)) return "image"
    if (SUPPORTED_FILE_TYPES.video.includes(file.type as any)) return "video" 
    if (SUPPORTED_FILE_TYPES.audio.includes(file.type as any)) return "audio"
    if (SUPPORTED_FILE_TYPES.document.includes(file.type as any)) return "document"
    return null
  }

  const validateFile = (file: File): string | null => {
    const fileType = getFileType(file)
    if (!fileType) {
      return `File type "${file.type}" is not supported`
    }

    const sizeLimit = FILE_SIZE_LIMITS[fileType]
    if (file.size > sizeLimit) {
      return `File size exceeds ${formatFileSize(sizeLimit)} limit for ${fileType} files`
    }

    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const triggerFileInput = (accept?: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || ""
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return

    setError(null)
    const files = Array.from(fileList)

    if (attachedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validFiles: File[] = []
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        setError(error)
        return
      }
      validFiles.push(file)
    }

    // Start upload simulation
    validFiles.forEach(file => {
      const uploadingFile: UploadingFile = {
        id: Date.now().toString() + Math.random(),
        file,
        progress: 0
      }

      setUploadingFiles(prev => [...prev, uploadingFile])

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        )
      }, 200)

      // Complete upload after 2 seconds
      setTimeout(() => {
        clearInterval(interval)
        
        const fileAttachment: FileAttachment = {
          id: uploadingFile.id,
          name: file.name,
          type: getFileType(file)!,
          size: file.size,
          url: URL.createObjectURL(file),
          mimeType: file.type,
        }

        setAttachedFiles(prev => [...prev, fileAttachment])
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id))
      }, 2000)
    })
  }

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id))
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleSendFiles = () => {
    if (attachedFiles.length > 0) {
      onFilesSelect(attachedFiles)
      setAttachedFiles([])
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return Image
      case "video": return Video  
      case "audio": return Mic
      case "document": return FileText
      default: return FileText
    }
  }

  return (
    <div className="space-y-3">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      {/* Attachment Options */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => triggerFileInput()}
          disabled={disabled}
          title="Attach any file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => triggerFileInput("image/*")}
          disabled={disabled}
          title="Attach image"
        >
          <Image className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => triggerFileInput("video/*")}
          disabled={disabled}
          title="Attach video"
        >
          <Video className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => triggerFileInput("audio/*")}
          disabled={disabled}
          title="Attach audio"
        >
          <Mic className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => triggerFileInput(".pdf,.doc,.docx,.txt,.xls,.xlsx")}
          disabled={disabled}
          title="Attach document"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploading Files */}
      {uploadingFiles.map((file) => {
        const Icon = getFileIcon(getFileType(file.file) || "document")
        return (
          <Card key={file.id} className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file.size)} • Uploading...
                  </p>
                  <Progress value={file.progress} className="mt-2 h-1" />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Attached Files */}
      {attachedFiles.map((file) => {
        const Icon = getFileIcon(file.type)
        return (
          <Card key={file.id} className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                    {file.duration && ` • ${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Send Files Button */}
      {attachedFiles.length > 0 && (
        <Button
          onClick={handleSendFiles}
          disabled={uploadingFiles.length > 0}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Send {attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''}
        </Button>
      )}
    </div>
  )
}

// Simplified component for message input integration
interface FileAttachmentUploadProps {
  attachments: FileAttachment[]
  onAttachmentsChange: (attachments: FileAttachment[]) => void
  disabled?: boolean
}

export function FileAttachmentUpload({
  attachments,
  onAttachmentsChange,
  disabled = false
}: FileAttachmentUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): "image" | "video" | "audio" | "document" | null => {
    const supportedTypes = Object.values(SUPPORTED_FILE_TYPES).flat()
    if (!supportedTypes.includes(file.type as SupportedFileType)) return null

    if (SUPPORTED_FILE_TYPES.image.includes(file.type as any)) return "image"
    if (SUPPORTED_FILE_TYPES.video.includes(file.type as any)) return "video"
    if (SUPPORTED_FILE_TYPES.audio.includes(file.type as any)) return "audio"
    if (SUPPORTED_FILE_TYPES.document.includes(file.type as any)) return "document"
    return null
  }

  const validateFile = (file: File): string | null => {
    const fileType = getFileType(file)
    if (!fileType) {
      return `File type "${file.type}" is not supported`
    }

    const sizeLimit = FILE_SIZE_LIMITS[fileType]
    if (file.size > sizeLimit) {
      return `File size exceeds ${formatFileSize(sizeLimit)} limit for ${fileType} files`
    }

    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return

    setError(null)
    const files = Array.from(fileList)

    const validFiles: File[] = []
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        setError(error)
        return
      }
      validFiles.push(file)
    }

    // Start upload simulation
    validFiles.forEach(file => {
      const uploadingFile: UploadingFile = {
        id: Date.now().toString() + Math.random(),
        file,
        progress: 0
      }

      setUploadingFiles(prev => [...prev, uploadingFile])

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === uploadingFile.id
              ? { ...f, progress: Math.min(f.progress + 20, 100) }
              : f
          )
        )
      }, 100)

      // Complete upload after 1 second
      setTimeout(() => {
        clearInterval(interval)

        const fileAttachment: FileAttachment = {
          id: uploadingFile.id,
          name: file.name,
          type: getFileType(file)!,
          size: file.size,
          url: URL.createObjectURL(file),
          mimeType: file.type,
        }

        const newAttachments = [...attachments, fileAttachment]
        onAttachmentsChange(newAttachments)
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id))
      }, 1000)
    })
  }

  const removeAttachment = (id: string) => {
    const newAttachments = attachments.filter(f => f.id !== id)
    onAttachmentsChange(newAttachments)
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image": return Image
      case "video": return Video
      case "audio": return Mic
      case "document": return FileText
      default: return FileText
    }
  }

  if (attachments.length === 0 && uploadingFiles.length === 0 && !error) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={triggerFileInput}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
      </>
    )
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploading Files */}
      {uploadingFiles.map((file) => {
        const Icon = getFileIcon(getFileType(file.file) || "document")
        return (
          <Card key={file.id} className="border-primary/20">
            <CardContent className="p-2">
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.file.name}</p>
                  <Progress value={file.progress} className="mt-1 h-1" />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAttachment(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Attached Files */}
      {attachments.map((file) => {
        const Icon = getFileIcon(file.type)
        return (
          <Card key={file.id} className="border-primary/20">
            <CardContent className="p-2">
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAttachment(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Add more files button */}
      <Button
        size="sm"
        variant="outline"
        onClick={triggerFileInput}
        disabled={disabled}
        className="w-full h-8"
      >
        <Paperclip className="h-3 w-3 mr-1" />
        Add files
      </Button>
    </div>
  )
}
