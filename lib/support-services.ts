import { db } from './firebase'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, orderBy, serverTimestamp, getDoc } from 'firebase/firestore'

interface SupportTicket {
  id: string
  userId: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  subject: string
  description: string
  category: 'bug' | 'feature' | 'account' | 'content' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  messages: SupportMessage[]
}

interface SupportMessage {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderRole: string
  message: string
  createdAt: Date
}

export class SupportService {
  // Get all support tickets
  static async getAllTickets(): Promise<SupportTicket[]> {
    if (!db) return []

    try {
      // For now, return mock data - in a real app this would come from Firestore
      const mockTickets: SupportTicket[] = [
        {
          id: 'ticket_001',
          userId: 'user_001',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            avatar: '/placeholder-user.jpg'
          },
          subject: 'Unable to upload profile picture',
          description: 'I am trying to upload a new profile picture but it keeps failing. The error message says "Upload failed" but doesn\'t give any more details.',
          category: 'bug',
          priority: 'medium',
          status: 'open',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          messages: []
        },
        {
          id: 'ticket_002',
          userId: 'user_002',
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            avatar: '/placeholder-user.jpg'
          },
          subject: 'Feature request: Dark mode',
          description: 'It would be great to have a dark mode option for the application. Many users prefer dark themes, especially when using the app at night.',
          category: 'feature',
          priority: 'low',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          messages: [
            {
              id: 'msg_001',
              ticketId: 'ticket_002',
              senderId: 'support_001',
              senderName: 'Support Agent',
              senderRole: 'support',
              message: 'Thank you for your suggestion! We are currently working on implementing dark mode. It should be available in the next update.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
          ]
        },
        {
          id: 'ticket_003',
          userId: 'user_003',
          user: {
            name: 'Bob Johnson',
            email: 'bob@example.com',
            avatar: '/placeholder-user.jpg'
          },
          subject: 'Account locked after password reset',
          description: 'I tried to reset my password but now my account seems to be locked. I can\'t log in with either my old or new password.',
          category: 'account',
          priority: 'high',
          status: 'resolved',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          messages: [
            {
              id: 'msg_002',
              ticketId: 'ticket_003',
              senderId: 'support_002',
              senderName: 'Support Manager',
              senderRole: 'support',
              message: 'I have unlocked your account and reset your password. Please check your email for the new temporary password.',
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
            },
            {
              id: 'msg_003',
              ticketId: 'ticket_003',
              senderId: 'user_003',
              senderName: 'Bob Johnson',
              senderRole: 'user',
              message: 'Thank you! I was able to log in successfully with the new password.',
              createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
            }
          ]
        },
        {
          id: 'ticket_004',
          userId: 'user_004',
          user: {
            name: 'Alice Wilson',
            email: 'alice@example.com',
            avatar: '/placeholder-user.jpg'
          },
          subject: 'Inappropriate content reported',
          description: 'There is a user posting inappropriate content in the general feed. The posts contain offensive language and should be removed.',
          category: 'content',
          priority: 'urgent',
          status: 'open',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          messages: []
        },
        {
          id: 'ticket_005',
          userId: 'user_005',
          user: {
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            avatar: '/placeholder-user.jpg'
          },
          subject: 'App crashes when sending messages',
          description: 'The mobile app crashes every time I try to send a message. This started happening after the latest update.',
          category: 'bug',
          priority: 'high',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          messages: [
            {
              id: 'msg_004',
              ticketId: 'ticket_005',
              senderId: 'support_003',
              senderName: 'Tech Support',
              senderRole: 'support',
              message: 'We are investigating this issue. Can you please tell us which device and operating system version you are using?',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
          ]
        }
      ]

      return mockTickets
    } catch (error) {
      console.error('Error getting support tickets:', error)
      return []
    }
  }

  // Update ticket status
  static async updateTicketStatus(ticketId: string, newStatus: string) {
    if (!db) return

    try {
      // In a real app, this would update Firestore
      console.log(`Updating ticket ${ticketId} status to ${newStatus}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error updating ticket status:', error)
      throw error
    }
  }

  // Add message to ticket
  static async addMessageToTicket(ticketId: string, message: any) {
    if (!db) return

    try {
      // In a real app, this would add to Firestore
      console.log(`Adding message to ticket ${ticketId}:`, message)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error adding message to ticket:', error)
      throw error
    }
  }

  // Create new support ticket
  static async createTicket(ticketData: Partial<SupportTicket>) {
    if (!db) return

    try {
      // In a real app, this would create in Firestore
      const newTicket = {
        ...ticketData,
        id: `ticket_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'open',
        messages: []
      }

      console.log('Creating new ticket:', newTicket)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return newTicket
    } catch (error) {
      console.error('Error creating ticket:', error)
      throw error
    }
  }

  // Assign ticket to support agent
  static async assignTicket(ticketId: string, agentId: string) {
    if (!db) return

    try {
      // In a real app, this would update Firestore
      console.log(`Assigning ticket ${ticketId} to agent ${agentId}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error assigning ticket:', error)
      throw error
    }
  }
}