import { db } from './firebase'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, limit, serverTimestamp, getDoc } from 'firebase/firestore'

export class AdminService {
  // Get dashboard statistics
  static async getDashboardStats() {
    if (!db) return {
      totalUsers: 0,
      activeUsers: 0,
      totalPosts: 0,
      totalChats: 0,
      reportsCount: 0
    }

    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const totalUsers = usersSnapshot.size

      // Get active users (online in last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', yesterday)
      )
      const activeUsersSnapshot = await getDocs(activeUsersQuery)
      const activeUsers = activeUsersSnapshot.size

      // Get total posts
      const postsSnapshot = await getDocs(collection(db, 'posts'))
      const totalPosts = postsSnapshot.size

      // Get total chats
      const chatsSnapshot = await getDocs(collection(db, 'chats'))
      const totalChats = chatsSnapshot.size

      // Get reports count
      const reportsSnapshot = await getDocs(collection(db, 'reports'))
      const reportsCount = reportsSnapshot.size

      return {
        totalUsers,
        activeUsers,
        totalPosts,
        totalChats,
        reportsCount
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPosts: 0,
        totalChats: 0,
        reportsCount: 0
      }
    }
  }

  // Get all users for management
  static async getAllUsers() {
    if (!db) return []

    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      )
      const usersSnapshot = await getDocs(usersQuery)
      
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActive: doc.data().lastActive?.toDate(),
      }))
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  }

  // Get all posts for moderation
  static async getAllPosts() {
    if (!db) return []

    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const postsSnapshot = await getDocs(postsQuery)
      
      const posts = []
      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data()
        
        // Get author information
        let author = null
        if (postData.authorId) {
          const authorDoc = await getDoc(doc(db, 'users', postData.authorId))
          if (authorDoc.exists()) {
            author = {
              id: authorDoc.id,
              name: authorDoc.data().name,
              avatar: authorDoc.data().avatar,
              email: authorDoc.data().email
            }
          }
        }

        posts.push({
          id: postDoc.id,
          ...postData,
          author,
          createdAt: postData.createdAt?.toDate(),
        })
      }

      return posts
    } catch (error) {
      console.error('Error getting all posts:', error)
      return []
    }
  }

  // Get all chats for monitoring
  static async getAllChats() {
    if (!db) return []

    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        orderBy('updatedAt', 'desc'),
        limit(50)
      )
      const chatsSnapshot = await getDocs(chatsQuery)
      
      return chatsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          participantCount: data.participantIds?.length || 0,
          lastActivity: data.updatedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        }
      })
    } catch (error) {
      console.error('Error getting all chats:', error)
      return []
    }
  }

  // Get traffic data by location
  static async getTrafficData() {
    // Mock data for now - in a real app this would come from analytics
    return [
      { country: 'United States', users: 1234, percentage: 35 },
      { country: 'United Kingdom', users: 856, percentage: 24 },
      { country: 'Canada', users: 642, percentage: 18 },
      { country: 'Australia', users: 428, percentage: 12 },
      { country: 'Germany', users: 285, percentage: 8 },
      { country: 'Others', users: 156, percentage: 3 }
    ]
  }

  // Update user role
  static async updateUserRole(userId: string, newRole: string) {
    if (!db) return

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating user role:', error)
      throw error
    }
  }

  // Block/unblock user
  static async blockUser(userId: string, isBlocked: boolean) {
    if (!db) return

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        isBlocked,
        blockedAt: isBlocked ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error blocking/unblocking user:', error)
      throw error
    }
  }

  // Delete post
  static async deletePost(postId: string) {
    if (!db) return

    try {
      const postRef = doc(db, 'posts', postId)
      await deleteDoc(postRef)
    } catch (error) {
      console.error('Error deleting post:', error)
      throw error
    }
  }

  // Update user to admin role by email
  static async updateUserRoleByEmail(email: string, newRole: string) {
    if (!db) return

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      )
      const usersSnapshot = await getDocs(usersQuery)
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0]
        const userRef = doc(db, 'users', userDoc.id)
        await updateDoc(userRef, {
          role: newRole,
          updatedAt: serverTimestamp()
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating user role by email:', error)
      throw error
    }
  }

  // Search users by email, name, or username
  static async searchUsers(searchTerm: string) {
    if (!db) return []

    try {
      // This is a simplified search - in production you'd want to use a proper search service
      const usersSnapshot = await getDocs(collection(db, 'users'))
      
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  // Get user reports
  static async getUserReports() {
    if (!db) return []

    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      )
      const reportsSnapshot = await getDocs(reportsQuery)
      
      return reportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
    } catch (error) {
      console.error('Error getting user reports:', error)
      return []
    }
  }
}