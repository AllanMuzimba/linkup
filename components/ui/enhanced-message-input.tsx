"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { FileAttachmentUpload } from '@/components/ui/file-attachment'
import {
  Smile,
  Paperclip,
  Send,
  Mic
} from 'lucide-react'
import type { FileAttachment } from '@/types/chat'

interface EnhancedMessageInputProps {
  value?: string
  onChange?: (value: string) => void
  onSend?: (content: string, attachments?: FileAttachment[]) => void
  onStartTyping?: () => void
  onStopTyping?: () => void
  placeholder?: string
  disabled?: boolean
}

export function EnhancedMessageInput({
  value = '',
  onChange = () => {},
  onSend = () => {},
  onStartTyping = () => {},
  onStopTyping = () => {},
  placeholder = 'Type a message...',
  disabled = false
}: EnhancedMessageInputProps) {
  const [isTyping, setIsTyping] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (value.trim() || attachments.length > 0) {
      onSend(value.trim(), attachments)
      onChange('')
      setAttachments([])
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.slice(0, start) + emoji + value.slice(end)
      onChange(newValue)

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
        textarea.focus()
      }, 0)
    } else {
      onChange(value + emoji)
    }
  }

  const handleAttachmentsChange = (newAttachments: FileAttachment[]) => {
    setAttachments(newAttachments)
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

  return (
    <div className="space-y-2">
      {/* File Attachments */}
      <FileAttachmentUpload
        attachments={attachments}
        onAttachmentsChange={handleAttachmentsChange}
        disabled={disabled}
      />

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
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              }
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 w-8 p-0"
              title="Voice message"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={(!value.trim() && attachments.length === 0) || disabled}
            size="sm"
            className="h-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {isTyping && (
          <div className="px-3 pb-2">
            <div className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
