/**
 * Dashboard Services for Role-Based Real-time Features
 * Handles dashboard-specific real-time operations based on user roles
 */

import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { UserRole } from '@/types/auth'

export interface DashboardStats {
  totalUsers?: number
  onlineUsers?: number
  newUsersToday?: number
  unreadNotifications: number
  onlineFriends?: number
  totalFriends?: number
}

export interface RecentActivity {
  id: string
  type: 'new_friend' | 'new_post' | 'post_engagement' | 'friend_post'
  title: string
  description: string
  timestamp: Date
  userId?: string
  userName?: string
  userAvatar?: string
  postId?: string
  postContent?: string
}

export class DashboardService {
  // Get role-based dashboard stats
  static subscribeToRoleBasedStats(
    userId: string, 
    userRole: UserRole, 
    callback: (stats: DashboardStats) => void
  ) {
    if (!db) return () => {}

    const unsubscribers: (() => void)[] = []
    let currentStats: DashboardStats = { unreadNotifications: 0 }

    const updateStats = (newStats: Partial<DashboardStats>) => {
      currentStats = { ...currentStats, ...newStats }
      callback(currentStats)
    }

    if (userRole === 'user') {
      // For regular users: show friends online and notifications
      const friendsUnsubscriber = this.subscribeToFriendsStats(userId, (friendsStats) => {
        updateStats({
          onlineFriends: friendsStats.onlineFriends,
          totalFriends: friendsStats.totalFriends
        })
      })
      unsubscribers.push(friendsUnsubscriber)
    } else {
      // For admin roles: show all user stats
      const adminStatsUnsubscriber = this.subscribeToAdminStats((adminStats) => {
        updateStats(adminStats)
      })
      unsubscribers.push(adminStatsUnsubscriber)
    }

    // Subscribe to notifications for all users
    const notificationsUnsubscriber = this.subscribeToNotificationCount(userId, (count) => {
      updateStats({ unreadNotifications: count })
    })
    unsubscribers.push(notificationsUnsubscriber)

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // Subscribe to friends stats for regular users
  private static subscribeToFriendsStats(
    userId: string, 
    callback: (stats: { onlineFriends: number; totalFriends: number }) => void
  ) {
    if (!db) return () => {}

    const friendshipsRef = collection(db, 'friendships')
    const friendsQuery1 = query(friendshipsRef, where('user1Id', '==', userId))
    const friendsQuery2 = query(friendshipsRef, where('user2Id', '==', userId))

    let allFriends: string[] = []
    let onlineFriends = 0

    const updateStats = async () => {
      if (allFriends.length === 0) {
        callback({ onlineFriends: 0, totalFriends: 0 })
        return
      }

      // Get online status of friends
      const usersRef = collection(db, 'users')
      const onlineFriendsQuery = query(
        usersRef,
        where('__name__', 'in', allFriends.slice(0, 10)), // Firestore 'in' limit
        where('isOnline', '==', true)
      )

      try {
        const onlineSnapshot = await getDocs(onlineFriendsQuery)
        onlineFriends = onlineSnapshot.size
        callback({ onlineFriends, totalFriends: allFriends.length })
      } catch (error) {
        console.error('Error getting online friends:', error)
        callback({ onlineFriends: 0, totalFriends: allFriends.length })
      }
    }

    const unsubscribe1 = onSnapshot(friendsQuery1, async (snapshot) => {
      const friends1 = snapshot.docs.map(doc => doc.data().user2Id)
      allFriends = [...new Set([...allFriends.filter(id => !friends1.includes(id)), ...friends1])]
      await updateStats()
    })

    const unsubscribe2 = onSnapshot(friendsQuery2, async (snapshot) => {
      const friends2 = snapshot.docs.map(doc => doc.data().user1Id)
      allFriends = [...new Set([...allFriends.filter(id => !friends2.includes(id)), ...friends2])]
      await updateStats()
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }

  // Subscribe to admin stats for admin roles
  private static subscribeToAdminStats(callback: (stats: DashboardStats) => void) {
    if (!db) return () => {}

    const usersRef = collection(db, 'users')
    return onSnapshot(usersRef, (snapshot) => {
      const totalUsers = snapshot.size
      const onlineUsers = snapshot.docs.filter(doc => doc.data().isOnline).length
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const newUsersToday = snapshot.docs.filter(doc => {
        const joinedDate = doc.data().joinedDate?.toDate()
        return joinedDate && joinedDate >= today
      }).length

      callback({
        totalUsers,
        onlineUsers,
        newUsersToday,
        unreadNotifications: 0 // Will be updated separately
      })
    })
  }

  // Subscribe to notification count
  private static subscribeToNotificationCount(userId: string, callback: (count: number) => void) {
    if (!db) return () => {}

    const notificationsRef = collection(db, 'notifications')
    const notificationsQuery = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    )

    return onSnapshot(notificationsQuery, (snapshot) => {
      callback(snapshot.size)
    })
  }

  // Subscribe to recent activities based on user role
  static subscribeToRecentActivities(
    userId: string,
    userRole: UserRole,
    callback: (activities: RecentActivity[]) => void
  ) {
    if (!db) return () => {}

    const unsubscribers: (() => void)[] = []

    if (userRole === 'user') {
      // For regular users: show friend activities and own activities
      const activitiesUnsubscriber = this.subscribeToUserActivities(userId, callback)
      unsubscribers.push(activitiesUnsubscriber)
    } else {
      // For admin roles: show all platform activities
      const adminActivitiesUnsubscriber = this.subscribeToAdminActivities(callback)
      unsubscribers.push(adminActivitiesUnsubscriber)
    }

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // Subscribe to user-specific activities (friends and own activities)
  private static subscribeToUserActivities(userId: string, callback: (activities: RecentActivity[]) => void) {
    if (!db) return () => {}

    const activities: RecentActivity[] = []
    const unsubscribers: (() => void)[] = []

    // Get user's friends first
    this.getUserFriends(userId).then(friendIds => {
      const allUserIds = [userId, ...friendIds]

      // Subscribe to new friendships
      const friendshipsRef = collection(db, 'friendships')
      const friendshipsQuery = query(
        friendshipsRef,
        where('user1Id', 'in', allUserIds),
        orderBy('createdAt', 'desc'),
        limit(10)
      )

      const friendshipsUnsubscriber = onSnapshot(friendshipsQuery, async (snapshot) => {
        const friendshipActivities = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data()
            const user1 = await this.getUserInfo(data.user1Id)
            const user2 = await this.getUserInfo(data.user2Id)
            
            return {
              id: `friendship_${doc.id}`,
              type: 'new_friend' as const,
              title: 'New Friendship',
              description: `${user1?.name} and ${user2?.name} are now friends`,
              timestamp: data.createdAt?.toDate() || new Date(),
              userId: data.user1Id,
              userName: user1?.name,
              userAvatar: user1?.avatar
            }
          })
        )

        // Update activities array
        activities.splice(0, activities.length, ...friendshipActivities)
        callback([...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10))
      })

      unsubscribers.push(friendshipsUnsubscriber)

      // Subscribe to posts from friends and user
      const postsRef = collection(db, 'posts')
      const postsQuery = query(
        postsRef,
        where('authorId', 'in', allUserIds),
        orderBy('createdAt', 'desc'),
        limit(10)
      )

      const postsUnsubscriber = onSnapshot(postsQuery, async (snapshot) => {
        const postActivities = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data()
            const author = await this.getUserInfo(data.authorId)
            
            return {
              id: `post_${doc.id}`,
              type: data.authorId === userId ? 'new_post' : 'friend_post' as const,
              title: data.authorId === userId ? 'You created a post' : 'Friend posted',
              description: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
              timestamp: data.createdAt?.toDate() || new Date(),
              userId: data.authorId,
              userName: author?.name,
              userAvatar: author?.avatar,
              postId: doc.id,
              postContent: data.content
            }
          })
        )

        // Merge with existing activities
        const allActivities = [...activities.filter(a => !a.type.includes('post')), ...postActivities]
        callback(allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10))
      })

      unsubscribers.push(postsUnsubscriber)
    })

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // Subscribe to admin activities (all platform activities)
  private static subscribeToAdminActivities(callback: (activities: RecentActivity[]) => void) {
    if (!db) return () => {}

    const activities: RecentActivity[] = []
    const unsubscribers: (() => void)[] = []

    // Subscribe to new users
    const usersRef = collection(db, 'users')
    const newUsersQuery = query(
      usersRef,
      orderBy('joinedDate', 'desc'),
      limit(5)
    )

    const usersUnsubscriber = onSnapshot(newUsersQuery, (snapshot) => {
      const userActivities = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: `user_${doc.id}`,
          type: 'new_friend' as const,
          title: 'New User Joined',
          description: `${data.name} joined LinkUp`,
          timestamp: data.joinedDate?.toDate() || new Date(),
          userId: doc.id,
          userName: data.name,
          userAvatar: data.avatar
        }
      })

      // Update activities
      const filteredActivities = activities.filter(a => !a.id.startsWith('user_'))
      activities.splice(0, activities.length, ...filteredActivities, ...userActivities)
      callback([...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10))
    })

    unsubscribers.push(usersUnsubscriber)

    // Subscribe to all posts
    const postsRef = collection(db, 'posts')
    const allPostsQuery = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(10)
    )

    const postsUnsubscriber = onSnapshot(allPostsQuery, async (snapshot) => {
      const postActivities = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data()
          const author = await this.getUserInfo(data.authorId)
          
          return {
            id: `post_${doc.id}`,
            type: 'new_post' as const,
            title: 'New Post Created',
            description: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
            timestamp: data.createdAt?.toDate() || new Date(),
            userId: data.authorId,
            userName: author?.name,
            userAvatar: author?.avatar,
            postId: doc.id,
            postContent: data.content
          }
        })
      )

      // Update activities
      const filteredActivities = activities.filter(a => !a.id.startsWith('post_'))
      activities.splice(0, activities.length, ...filteredActivities, ...postActivities)
      callback([...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10))
    })

    unsubscribers.push(postsUnsubscriber)

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }

  // Helper method to get user's friends
  private static async getUserFriends(userId: string): Promise<string[]> {
    if (!db) return []

    try {
      const friendshipsRef = collection(db, 'friendships')
      
      const query1 = query(friendshipsRef, where('user1Id', '==', userId))
      const query2 = query(friendshipsRef, where('user2Id', '==', userId))
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(query1),
        getDocs(query2)
      ])

      const friends1 = snapshot1.docs.map(doc => doc.data().user2Id)
      const friends2 = snapshot2.docs.map(doc => doc.data().user1Id)
      
      return [...new Set([...friends1, ...friends2])]
    } catch (error) {
      console.error('Error getting user friends:', error)
      return []
    }
  }

  // Helper method to get user info
  private static async getUserInfo(userId: string) {
    if (!db) return null

    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const userData = userSnap.data()
        return {
          id: userId,
          name: userData.name || 'Unknown User',
          avatar: userData.avatar,
          email: userData.email
        }
      }
      return null
    } catch (error) {
      console.error('Error getting user info:', error)
      return null
    }
  }

  // Get online friends for user role
  static subscribeToOnlineFriends(userId: string, callback: (friends: any[]) => void) {
    if (!db) return () => {}

    return this.subscribeToFriendsWithStatus(userId, (friends) => {
      const onlineFriends = friends.filter(friend => friend.isOnline)
      callback(onlineFriends)
    })
  }

  // Subscribe to friends with their online status
  private static subscribeToFriendsWithStatus(userId: string, callback: (friends: any[]) => void) {
    if (!db) return () => {}

    const friendshipsRef = collection(db, 'friendships')
    const query1 = query(friendshipsRef, where('user1Id', '==', userId))
    const query2 = query(friendshipsRef, where('user2Id', '==', userId))

    let allFriendIds: string[] = []

    const updateFriends = async () => {
      if (allFriendIds.length === 0) {
        callback([])
        return
      }

      try {
        // Get friend details in batches (Firestore 'in' limit is 10)
        const friendBatches = []
        for (let i = 0; i < allFriendIds.length; i += 10) {
          const batch = allFriendIds.slice(i, i + 10)
          const usersRef = collection(db, 'users')
          const friendsQuery = query(usersRef, where('__name__', 'in', batch))
          friendBatches.push(getDocs(friendsQuery))
        }

        const snapshots = await Promise.all(friendBatches)
        const friends = snapshots.flatMap(snapshot => 
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            lastSeen: doc.data().lastActive?.toDate() || new Date()
          }))
        )

        callback(friends)
      } catch (error) {
        console.error('Error getting friends with status:', error)
        callback([])
      }
    }

    const unsubscribe1 = onSnapshot(query1, async (snapshot) => {
      const friends1 = snapshot.docs.map(doc => doc.data().user2Id)
      allFriendIds = [...new Set([...allFriendIds.filter(id => !friends1.includes(id)), ...friends1])]
      await updateFriends()
    })

    const unsubscribe2 = onSnapshot(query2, async (snapshot) => {
      const friends2 = snapshot.docs.map(doc => doc.data().user1Id)
      allFriendIds = [...new Set([...allFriendIds.filter(id => !friends2.includes(id)), ...friends2])]
      await updateFriends()
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }
}