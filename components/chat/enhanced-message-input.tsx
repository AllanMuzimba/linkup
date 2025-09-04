"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import {
  Smile,
  Paperclip,
  Send,
  Mic,
  MicOff,
  Video,
  Image as ImageIcon,
  File,
  X,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { toast } from 'sonner'
import { FileService } from '@/lib/realtime-services'

interface MediaFile {
  id: string
  file: File
  type: 'image' | 'video' | 'audio' | 'document'
  preview?: string
  size: number
  name: string
}

interface EnhancedMessageInputProps {
  value?: string
  onChange?: (value: string) => void
  onSend?: (content: string, mediaFiles?: MediaFile[]) => void
  onStartTyping?: () => void
  onStopTyping?: () => void
  placeholder?: string
  disabled?: boolean
  maxFileSize?: number // in MB
  maxFiles?: number
}

export function EnhancedMessageInput({
  value = '',
  onChange = () => {},
  onSend = () => {},
  onStartTyping = () => {},
  onStopTyping = () => {},
  placeholder = 'Type a message...',
  disabled = false,
  maxFileSize = 10, // 10MB default
  maxFiles = 5
}: EnhancedMessageInputProps) {
  const [isTyping, setIsTyping] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleSend = async () => {
    if (!value.trim() && mediaFiles.length === 0 && !audioBlob) return

    try {
      let uploadedFiles: MediaFile[] = []
      
      // Upload media files if any
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (mediaFile) => {
          const url = await FileService.uploadChatMedia(
            mediaFile.file, 
            currentChatId || 'general'
          )
          return { ...mediaFile, preview: url }
        })
        uploadedFiles = await Promise.all(uploadPromises)
      }

      // Upload audio recording if any
      if (audioBlob) {
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: 'audio/webm'
        })
        const audioUrl = await FileService.uploadFile(audioFile, 'voice', currentChatId || 'general')
        uploadedFiles.push({
          id: `audio_${Date.now()}`,
          file: audioFile,
          type: 'audio',
          preview: audioUrl,
          size: audioBlob.size,
          name: audioFile.name
        })
      }

      onSend(value.trim(), uploadedFiles)
      onChange('')
      setMediaFiles([])
      setAudioBlob(null)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.slice(0, start) + emoji + value.slice(end)
      onChange(newValue)

      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
        textarea.focus()
      }, 0)
    } else {
      onChange(value + emoji)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (mediaFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validFiles: MediaFile[] = []
    
    files.forEach((file) => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB`)
        return
      }

      // Determine file type
      let type: 'image' | 'video' | 'audio' | 'document' = 'document'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'audio'

      // Create preview for images
      let preview: string | undefined
      if (type === 'image') {
        preview = URL.createObjectURL(file)
      }

      validFiles.push({
        id: `${Date.now()}_${Math.random()}`,
        file,
        type,
        preview,
        size: file.size,
        name: file.name
      })
    })

    setMediaFiles([...mediaFiles, ...validFiles])
    
    // Clear input
    if (event.target) {
      event.target.value = ''
    }
  }

  const removeMediaFile = (id: string) => {
    setMediaFiles(mediaFiles.filter(f => f.id !== id))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Could not access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audioRef.current = audio
      
      audio.onended = () => setIsPlaying(false)
      audio.play()
      setIsPlaying(true)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const deleteAudioRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    stopAudio()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (!isTyping && newValue.length > 0) {
      setIsTyping(true)
      onStartTyping()
    } else if (isTyping && newValue.length === 0) {
      setIsTyping(false)
      onStopTyping()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3 p-4 border-t border-border bg-background">
      {/* Media Files Preview */}
      {mediaFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaFiles.map((file) => (
            <div key={file.id} className="relative group">
              <div className="flex items-center space-x-2 bg-muted p-2 rounded-lg">
                {file.type === 'image' && file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted-foreground/20 rounded flex items-center justify-center">
                    {file.type === 'video' && <Video className="h-6 w-6" />}
                    {file.type === 'audio' && <Mic className="h-6 w-6" />}
                    {file.type === 'document' && <File className="h-6 w-6" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMediaFile(file.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio Recording Preview */}
      {audioBlob && (
        <div className="flex items-center space-x-3 bg-muted p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? stopAudio : playAudio}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteAudioRecording}
            className="h-6 w-6 p-0 ml-auto"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center space-x-3 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Recording... {formatTime(recordingTime)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={stopRecording}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Square className="h-3 w-3 mr-1" />
            Stop
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="border rounded-lg bg-background">
        <div className="flex items-end space-x-2 p-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[40px] max-h-32 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
          </div>

          <div className="flex items-center space-x-1">
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || mediaFiles.length >= maxFiles}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Emoji Picker */}
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                  title="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              }
            />

            {/* Voice Recording */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-8 w-8 p-0 ${isRecording ? 'text-red-500' : ''}`}
              title={isRecording ? "Stop recording" : "Record voice message"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!value.trim() && mediaFiles.length === 0 && !audioBlob) || disabled}
            size="sm"
            className="h-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="px-3 pb-2">
            <div className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        )}
      </div>

      {/* File Limits Info */}
      {mediaFiles.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {mediaFiles.length}/{maxFiles} files • Max {maxFileSize}MB per file
        </div>
      )}
    </div>
  )
}