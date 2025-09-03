/**
 * Sound Service for LinkUp Social Media Platform
 * Handles notification sounds and audio feedback
 */

export class SoundService {
  private static incomingSound: HTMLAudioElement | null = null
  private static outgoingSound: HTMLAudioElement | null = null
  private static isInitialized = false

  // Initialize audio elements
  static initialize() {
    if (typeof window === 'undefined' || this.isInitialized) return

    try {
      this.incomingSound = new Audio('/sounds/income.wav')
      this.outgoingSound = new Audio('/sounds/outgoing.wav')
      
      // Preload audio files
      this.incomingSound.preload = 'auto'
      this.outgoingSound.preload = 'auto'
      
      // Set volume
      this.incomingSound.volume = 0.7
      this.outgoingSound.volume = 0.5
      
      this.isInitialized = true
    } catch (error) {
      console.warn('Could not initialize sound service:', error)
    }
  }

  // Play incoming message sound
  static playIncomingSound() {
    if (!this.isInitialized) this.initialize()
    
    try {
      if (this.incomingSound) {
        this.incomingSound.currentTime = 0
        this.incomingSound.play().catch(error => {
          console.warn('Could not play incoming sound:', error)
        })
      }
    } catch (error) {
      console.warn('Error playing incoming sound:', error)
    }
  }

  // Play outgoing message sound
  static playOutgoingSound() {
    if (!this.isInitialized) this.initialize()
    
    try {
      if (this.outgoingSound) {
        this.outgoingSound.currentTime = 0
        this.outgoingSound.play().catch(error => {
          console.warn('Could not play outgoing sound:', error)
        })
      }
    } catch (error) {
      console.warn('Error playing outgoing sound:', error)
    }
  }

  // Check if user has muted notifications for a specific chat
  static isChatMuted(chatId: string): boolean {
    try {
      const mutedChats = JSON.parse(localStorage.getItem('linkup-muted-chats') || '[]')
      return mutedChats.includes(chatId)
    } catch (error) {
      console.warn('Error checking muted chats:', error)
      return false
    }
  }

  // Mute/unmute chat notifications
  static toggleChatMute(chatId: string): boolean {
    try {
      const mutedChats = JSON.parse(localStorage.getItem('linkup-muted-chats') || '[]')
      const isMuted = mutedChats.includes(chatId)
      
      if (isMuted) {
        // Unmute
        const updated = mutedChats.filter((id: string) => id !== chatId)
        localStorage.setItem('linkup-muted-chats', JSON.stringify(updated))
        return false
      } else {
        // Mute
        mutedChats.push(chatId)
        localStorage.setItem('linkup-muted-chats', JSON.stringify(mutedChats))
        return true
      }
    } catch (error) {
      console.warn('Error toggling chat mute:', error)
      return false
    }
  }

  // Get all muted chats
  static getMutedChats(): string[] {
    try {
      return JSON.parse(localStorage.getItem('linkup-muted-chats') || '[]')
    } catch (error) {
      console.warn('Error getting muted chats:', error)
      return []
    }
  }

  // Play sound for incoming message (with mute check)
  static playIncomingMessageSound(chatId: string) {
    if (!this.isChatMuted(chatId)) {
      this.playIncomingSound()
    }
  }
}