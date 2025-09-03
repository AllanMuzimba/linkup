/**
 * Unread Message Service for LinkUp Social Media Platform
 * Handles tracking and managing unread message counts
 */

import { doc, updateDoc, getDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore'
import { db } from './firebase'

export interface UnreadMessageData {
  chatId: string
  unreadCount: number
  lastMessageId: string
  lastMessageTime: Date
  lastSenderId: string
}

export class UnreadMessageService {
  private static unreadCounts: Map<string, number> = new Map()
  private static listeners: Map<string, () => void> = new Map()

  // Get unread count for a specific chat
  static getUnreadCount(chatId: string): number {
    return this.unreadCounts.get(chatId) || 0
  }

  // Get total unread count across all chats
  static getTotalUnreadCount(): number {
    let total = 0
    this.unreadCounts.forEach(count => total += count)
    return total
  }

  // Subscribe to unread messages for a user
  static subscribeToUnreadMessages(userId: string, callback: (unreadData: UnreadMessageData[]) => void) {
    if (!db) return () => {}

    // Get user's chats first
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', userId)
    )

    return onSnapshot(chatsQuery, async (chatsSnapshot) => {
      const unreadData: UnreadMessageData[] = []
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data()
        const chatId = chatDoc.id

        // Get messages for this chat
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatId', '==', chatId),
          orderBy('timestamp', 'desc')
        )

        const messagesSnapshot = await getDocs(messagesQuery)
        let unreadCount = 0
        let lastMessageId = ''
        let lastMessageTime = new Date()
        let lastSenderId = ''

        // Count unread messages (messages not sent by current user and not read)
        for (const messageDoc of messagesSnapshot.docs) {
          const messageData = messageDoc.data()
          
          if (messageData.senderId !== userId) {
            // Check if message is read by current user
            const readBy = messageData.readBy || []
            if (!readBy.includes(userId)) {
              unreadCount++
            }
          }

          // Get last message info
          if (!lastMessageId) {
            lastMessageId = messageDoc.id
            lastMessageTime = messageData.timestamp?.toDate() || new Date()
            lastSenderId = messageData.senderId
          }
        }

        // Update local cache
        this.unreadCounts.set(chatId, unreadCount)

        if (unreadCount > 0 || lastMessageId) {
          unreadData.push({
            chatId,
            unreadCount,
            lastMessageId,
            lastMessageTime,
            lastSenderId
          })
        }
      }

      callback(unreadData)
    })
  }

  // Mark messages as read for a specific chat
  static async markChatAsRead(chatId: string, userId: string) {
    if (!db) return

    try {
      // Get all unread messages in this chat
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('senderId', '!=', userId)
      )

      const messagesSnapshot = await getDocs(messagesQuery)
      
      // Update each message to mark as read by current user
      const updatePromises = messagesSnapshot.docs.map(async (messageDoc) => {
        const messageData = messageDoc.data()
        const readBy = messageData.readBy || []
        
        if (!readBy.includes(userId)) {
          readBy.push(userId)
          await updateDoc(doc(db, 'messages', messageDoc.id), {
            readBy,
            readAt: new Date()
          })
        }
      })

      await Promise.all(updatePromises)
      
      // Update local cache
      this.unreadCounts.set(chatId, 0)
      
    } catch (error) {
      console.error('Error marking chat as read:', error)
    }
  }

  // Get unread message info for chat list display
  static getUnreadInfo(chatId: string) {
    const count = this.getUnreadCount(chatId)
    return {
      hasUnread: count > 0,
      count: count > 99 ? '99+' : count.toString(),
      shouldShowBold: count > 0
    }
  }

  // Clear all unread counts (for testing/debugging)
  static clearAllUnread() {
    this.unreadCounts.clear()
  }
}

// Helper function to get docs (since it's not imported)
async function getDocs(query: any) {
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(query, (snapshot) => {
      unsubscribe()
      resolve(snapshot)
    }, reject)
  })
}