"use client"

import React from 'react'

// Simple test page for messaging functionality
export default function TestMessagingPage() {
  const [message, setMessage] = React.useState('')
  const [attachments, setAttachments] = React.useState<any[]>([])
  
  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message)
      console.log('With attachments:', attachments)
      setMessage('')
      setAttachments([])
      alert(`Message sent: ${message}`)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const fileList = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }))
      setAttachments(prev => [...prev, ...fileList])
      console.log('Files attached:', fileList)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji)
  }

  const commonEmojis = ['😀', '😊', '😍', '🥰', '😎', '🤩', '😢', '😭', '😡', '🤔', '👍', '👎', '❤️', '🔥', '⭐']

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Kubatana Messaging Test</h1>
      
      {/* Message Input Area */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <h2>Enhanced Message Input Test</h2>
        
        {/* Text Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          style={{ 
            width: '100%', 
            minHeight: '80px', 
            padding: '8px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            marginBottom: '12px',
            resize: 'vertical'
          }}
        />
        
        {/* Quick Emoji Buttons */}
        <div style={{ marginBottom: '12px' }}>
          <strong>Quick Emojis: </strong>
          {commonEmojis.map((emoji, index) => (
            <button 
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              style={{ 
                margin: '2px', 
                padding: '4px 8px', 
                border: 'none', 
                background: '#f0f0f0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* File Upload */}
        <div style={{ marginBottom: '12px' }}>
          <label>
            <strong>Attach Files: </strong>
            <input 
              type="file" 
              multiple 
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              style={{ marginLeft: '8px' }}
            />
          </label>
        </div>
        
        {/* Show Attachments */}
        {attachments.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <strong>Attached Files:</strong>
            <ul style={{ margin: '8px 0', padding: '0 20px' }}>
              {attachments.map((file, index) => (
                <li key={index} style={{ margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    {file.name} ({Math.round(file.size / 1024)}KB) - {file.type}
                  </span>
                  <button 
                    onClick={() => removeAttachment(index)}
                    style={{ 
                      marginLeft: '8px', 
                      padding: '2px 6px', 
                      background: '#ff4444', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Send Button */}
        <button 
          onClick={handleSendMessage}
          disabled={!message.trim()}
          style={{ 
            padding: '8px 16px', 
            background: message.trim() ? '#0066cc' : '#ccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: message.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Send Message
        </button>
      </div>

      {/* Audio/Video Call Tests */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <h2>Call Functionality Test</h2>
        <button 
          onClick={() => {
            console.log('Initiating audio call...')
            alert('Audio call initiated! (This is a simulation)')
          }}
          style={{ 
            padding: '8px 16px', 
            background: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '8px',
            cursor: 'pointer'
          }}
        >
          📞 Start Audio Call
        </button>
        
        <button 
          onClick={() => {
            console.log('Initiating video call...')
            alert('Video call initiated! (This is a simulation)')
          }}
          style={{ 
            padding: '8px 16px', 
            background: '#17a2b8', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📹 Start Video Call
        </button>
      </div>

      {/* Emoji Picker Test */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
        <h2>Emoji Categories Test</h2>
        <p>Test different emoji categories by clicking the emojis above to add them to your message.</p>
        
        <div>
          <h3>Recent Usage Simulation</h3>
          <p>In a full implementation, recently used emojis would appear here based on localStorage.</p>
          
          <h3>Search Functionality</h3>
          <p>A search box would filter emojis by typing keywords.</p>
          
          <h3>Categories Available</h3>
          <ul>
            <li>😀 Faces & Expressions</li>
            <li>❤️ Hearts & Love</li>
            <li>👍 Hands & Gestures</li>
            <li>🔥 Activities & Objects</li>
            <li>⭐ Symbols & Misc</li>
          </ul>
        </div>
      </div>
    </div>
  )
}