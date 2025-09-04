/**
 * Real-time Services for LinkUp Social Media Platform
 * Handles all Firebase real-time operations
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  GeoPoint,
  Timestamp,
  setDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from './firebase'

// Helper function to check if user is authenticated
const isAuthenticated = () => {
  return !!auth && !!auth.currentUser
}

// Real-time User Management
export class UserService {
  // Get real-time user stats
  static subscribeToUserStats(callback: (stats: any) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    const usersRef = collection(db, 'users')
    return onSnapshot(usersRef, (snapshot) => {
      const totalUsers = snapshot.size
      const onlineUsers = snapshot.docs.filter(doc => doc.data().isOnline).length
      
      callback({
        totalUsers,
        onlineUsers,
        newUsersToday: snapshot.docs.filter(doc => {
          const joinedDate = doc.data().joinedDate?.toDate()
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return joinedDate && joinedDate >= today
        }).length
      })
    })
  }

  // Search users by name, email, phone, or username
  static async searchUsers(searchTerm: string, currentUserId: string, location?: { lat: number, lng: number }) {
    if (!db || !isAuthenticated()) return []
    
    const usersRef = collection(db, 'users')
    const searchLower = searchTerm.toLowerCase()
    
    // Get all users and filter client-side for more flexible search
    const snapshot = await getDocs(usersRef)
    
    return snapshot.docs
      .filter(doc => {
        if (doc.id === currentUserId) return false
        
        const data = doc.data()
        const name = (data.name || '').toLowerCase()
        const email = (data.email || '').toLowerCase()
        const phone = (data.phone || '').toLowerCase()
        const username = (data.username || '').toLowerCase()
        
        return name.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower) ||
               username.includes(searchLower)
      })
      .slice(0, 20) // Limit results
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        distance: location && doc.data().location ? 
          this.calculateDistance(location, doc.data().location) : null
      }))
  }

  // Check if users are friends
  static async checkFriendshipStatus(userId1: string, userId2: string) {
    if (!db || !isAuthenticated()) return 'none'
    
    // Check for existing friendship
    const friendshipId = [userId1, userId2].sort().join('_')
    if (db) {
      const friendshipRef = doc(db, 'friendships', friendshipId)
      const friendshipSnap = await getDoc(friendshipRef)
      
      if (friendshipSnap.exists()) {
        return 'friends'
      }
    }
    
    // Check for pending friend request
    if (db) {
      const requestsRef = collection(db, 'friendRequests')
      const pendingQuery = query(
        requestsRef,
        where('fromUserId', '==', userId1),
        where('toUserId', '==', userId2),
        where('status', '==', 'pending')
      )
      
      const pendingSnap = await getDocs(pendingQuery)
      if (!pendingSnap.empty) {
        return 'request_sent'
      }
      
      // Check for incoming friend request
      const incomingQuery = query(
        requestsRef,
        where('fromUserId', '==', userId2),
        where('toUserId', '==', userId1),
        where('status', '==', 'pending')
      )
      
      const incomingSnap = await getDocs(incomingQuery)
      if (!incomingSnap.empty) {
        return 'request_received'
      }
    }
    
    return 'none'
  }

  // Calculate distance between two coordinates
  static calculateDistance(pos1: {lat: number, lng: number}, pos2: GeoPoint) {
    const R = 6371 // Earth's radius in km
    const dLat = (pos2.latitude - pos1.lat) * Math.PI / 180
    const dLon = (pos2.longitude - pos1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Update user location
  static async updateUserLocation(userId: string, location: { lat: number, lng: number, city?: string, country?: string }) {
    if (!db || !isAuthenticated()) return
    
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      location: new GeoPoint(location.lat, location.lng),
      city: location.city || '',
      country: location.country || '',
      locationUpdatedAt: serverTimestamp()
    })
  }

  // Set user online status
  static async setUserOnlineStatus(userId: string, isOnline: boolean) {
    if (!db || !isAuthenticated()) return
    
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      isOnline,
      lastActive: serverTimestamp()
    })
  }

  // Update user profile
  static async updateUserProfile(userId: string, profileData: any) {
    if (!db || !isAuthenticated()) return
    
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    })
  }

  // Get user's own posts
  static subscribeToUserPosts(userId: string, callback: (posts: any[]) => void) {
    if (!db) return () => {} // Allow access to user posts for all users
    
    const postsRef = collection(db, 'posts')
    const userPostsQuery = query(
      postsRef,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    return onSnapshot(userPostsQuery, async (snapshot) => {
      const posts = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data()
          
          // Check if user liked this post (only if authenticated)
          let isLiked = false;
          if (isAuthenticated() && db) {
            const likeRef = doc(db, 'likes', `${auth?.currentUser?.uid}_${postDoc.id}`)
            const likeSnap = await getDoc(likeRef)
            isLiked = likeSnap.exists()
          }
          
          return {
            id: postDoc.id,
            ...postData,
            isLiked,
            createdAt: postData.createdAt?.toDate(),
            updatedAt: postData.updatedAt?.toDate()
          }
        })
      )
      
      callback(posts.filter(Boolean))
    })
  }

  // Get posts user has liked/engaged with
  static subscribeToLikedPosts(userId: string, callback: (posts: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {} // This should only be accessible to authenticated users
    
    const likesRef = collection(db, 'likes')
    const userLikesQuery = query(
      likesRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    return onSnapshot(userLikesQuery, async (snapshot) => {
      const posts = await Promise.all(
        snapshot.docs.map(async (likeDoc) => {
          const likeData = likeDoc.data()
          
          // Get the actual post
          if (db) {
            const postRef = doc(db, 'posts', likeData.postId)
            const postSnap = await getDoc(postRef)
            
            if (postSnap.exists()) {
              const postData = postSnap.data()
              
              // Get author info
              const authorRef = doc(db, 'users', postData.authorId)
              const authorSnap = await getDoc(authorRef)
              const authorData = authorSnap.exists() ? authorSnap.data() : null
              
              return {
                id: postSnap.id,
                ...postData,
                author: authorData,
                isLiked: true,
                likedAt: likeData.createdAt?.toDate(),
                createdAt: postData.createdAt?.toDate(),
                updatedAt: postData.updatedAt?.toDate()
              }
            }
          }
          return null
        })
      )
      
      callback(posts.filter(Boolean))
    })
  }

  // Get user by ID
  static async getUserById(userId: string) {
    if (!db) return null // Allow access to user profiles for all users
    
    try {
      const userRef = doc(db, 'users', userId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        return {
          id: userSnap.id,
          ...userSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }

  // Find user by email or phone
  static async findUserByEmailOrPhone(email?: string, phone?: string) {
    if (!db || (!email && !phone)) return null // Allow access but require email or phone
    
    try {
      const usersRef = collection(db, 'users')
      let userQuery
      
      if (email) {
        userQuery = query(usersRef, where('email', '==', email))
      } else if (phone) {
        userQuery = query(usersRef, where('phone', '==', phone))
      }
      
      if (userQuery && db) {
        const querySnapshot = await getDocs(userQuery)
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]
          return {
            id: userDoc.id,
            ...userDoc.data()
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding user:', error)
      return null
    }
  }
}

// Real-time Posts Management
export class PostService {
  // Create a new post
  static async createPost(
    authorId: string, 
    content: string, 
    type: 'text' | 'image' | 'video', 
    mediaUrls?: string[],
    visibility?: "public" | "friends" | "private",
    tags?: string[],
    location?: string
  ) {
    if (!db || !isAuthenticated()) return null
    
    const postData = {
      authorId,
      content,
      type,
      mediaUrls: mediaUrls || [],
      visibility: visibility || 'public',
      tags: tags || [],
      location: location || null,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'posts'), postData)
    
    // Update user's post count
    const userRef = doc(db, 'users', authorId)
    await updateDoc(userRef, {
      postsCount: increment(1)
    })
    
    return docRef.id
  }

  // Add a comment to a post - Allow all users to comment (like Facebook)
  static async addComment(postId: string, userId: string, content: string) {
    if (!db) return null
    
    // Get user info
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    const userData = userSnap.exists() ? userSnap.data() : null
    
    if (!userData) return null
    
    const commentData = {
      postId,
      authorId: userId,
      author: {
        name: userData.name || 'Anonymous',
        username: userData.username || 'user',
        avatar: userData.avatar || null
      },
      content,
      likesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'comments'), commentData)
    
    // Update post's comment count
    const postRef = doc(db, 'posts', postId)
    await updateDoc(postRef, {
      commentsCount: increment(1)
    })
    
    return docRef.id
  }

  // Subscribe to comments for a post
  static subscribeToPostComments(postId: string, callback: (comments: any[]) => void) {
    if (!db) return () => {} // Allow access to comments for all users
    
    const commentsRef = collection(db, 'comments')
    const commentsQuery = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    )
    
    return onSnapshot(commentsQuery, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      callback(comments)
    })
  }

  // Save/Unsave a post
  static async togglePostSave(postId: string, userId: string) {
    if (!db || !isAuthenticated()) return false
    
    const saveRef = doc(db, 'savedPosts', `${userId}_${postId}`)
    const saveSnap = await getDoc(saveRef)
    const postRef = doc(db, 'posts', postId)
    
    if (saveSnap.exists()) {
      // Unsave
      await deleteDoc(saveRef)
      return false
    } else {
      // Save
      await setDoc(saveRef, {
        userId,
        postId,
        savedAt: serverTimestamp()
      })
      return true
    }
  }

  // Get real-time posts feed
  static subscribeToPostsFeed(
    callback: (posts: any[]) => void, 
    options?: { 
      location?: { lat: number, lng: number, radius?: number },
      friendsOnly?: boolean,
      authorId?: string
    }
  ) {
    if (!db) return () => {} // Removed isAuthenticated() check to make posts accessible to all
    
    const postsRef = collection(db, 'posts')
    
    // Build query based on options
    let postsQuery: any = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    // If friendsOnly filter is specified, we need user authentication
    // We only need to check authentication for friend-specific filtering
    if (options?.friendsOnly && !isAuthenticated()) {
      callback([])
      return () => {}
    }
    
    return onSnapshot(postsQuery, async (snapshot: any) => {
      // Create a Set to track unique author IDs
      const authorIds = new Set<string>()
      
      // First, collect all unique author IDs from posts
      snapshot.docs.forEach((postDoc: any) => {
        const postData = postDoc.data()
        if (postData.authorId) {
          authorIds.add(postData.authorId)
        }
      })
      
      // Fetch all author data in a single batch
      const authorsMap: {[key: string]: any} = {}
      await Promise.all(
        Array.from(authorIds).map(async (authorId) => {
          if (db) {
            try {
              const authorRef = doc(db, 'users', authorId)
              const authorSnap = await getDoc(authorRef)
              if (authorSnap.exists()) {
                const userData = authorSnap.data()
                authorsMap[authorId] = {
                  name: userData.name || 'Unknown User',
                  username: userData.username || authorId.substring(0, 8),
                  avatar: userData.avatar || null,
                  role: userData.role || 'user'
                }
              }
            } catch (error) {
              console.warn('Error fetching author data:', authorId, error)
            }
          }
        })
      )
      
      // Process posts with author data
      let posts = snapshot.docs.map((postDoc: any) => {
        const postData = postDoc.data()
        const authorId = postData.authorId
        
        // Get author from our pre-fetched map or create default
        const author = authorsMap[authorId] || {
          name: 'Unknown User',
          username: authorId ? authorId.substring(0, 8) : 'unknown',
          role: 'user'
        }
        
        // Calculate distance if location provided
        let distance = null
        if (options?.location && postData.location) {
          distance = UserService.calculateDistance(options.location, postData.location)
        }
        
        return {
          id: postDoc.id,
          ...postData,
          author,
          distance,
          createdAt: postData.createdAt?.toDate(),
          updatedAt: postData.updatedAt?.toDate()
        }
      })
      
      // Apply filters
      if (options?.friendsOnly && options?.authorId) {
        // This would require a friends list lookup
        // For now, we'll filter by authorId as an example
        posts = posts.filter((post: any) => post && post.authorId === options.authorId)
      } else if (options?.authorId) {
        // Only filter by authorId if specifically requested
        posts = posts.filter((post: any) => post && post.authorId === options.authorId)
      }
      
      // Filter by location if specified
      if (options?.location && options.location.radius) {
        posts = posts.filter((post: any) => {
          const p = post as any
          return !p.distance || p.distance <= (options.location?.radius || 50)
        })
      }
      
      callback(posts.filter(Boolean))
    })
  }

  // Get saved posts for a user
  static async getSavedPosts(userId: string) {
    if (!db || !isAuthenticated()) return []
    
    try {
      // Get saved post references
      const savedPostsRef = collection(db, 'savedPosts')
      const savedPostsQuery = query(
        savedPostsRef,
        where('userId', '==', userId),
        orderBy('savedAt', 'desc')
      )
      
      const savedPostsSnapshot = await getDocs(savedPostsQuery)
      const savedPostIds = savedPostsSnapshot.docs.map(doc => doc.data().postId)
      
      if (savedPostIds.length === 0) return []
      
      // Get the actual posts
      const posts = []
      const authorIds = new Set<string>()
      const postsData = []
      
      // First, get all posts and collect author IDs
      for (const postId of savedPostIds) {
        if (!db) continue
        const postRef = doc(db, 'posts', postId)
        const postSnap = await getDoc(postRef)
        
        if (postSnap.exists()) {
          const postData = postSnap.data()
          if (postData.authorId) {
            authorIds.add(postData.authorId)
          }
          postsData.push({
            id: postSnap.id,
            ...postData,
            isSaved: true
          })
        }
      }
      
      // Fetch all author data in batch
      const authorsMap: {[key: string]: any} = {}
      await Promise.all(
        Array.from(authorIds).map(async (authorId) => {
          if (db) {
            try {
              const authorRef = doc(db, 'users', authorId)
              const authorSnap = await getDoc(authorRef)
              if (authorSnap.exists()) {
                const userData = authorSnap.data()
                authorsMap[authorId] = {
                  name: userData.name || 'Unknown User',
                  username: userData.username || authorId.substring(0, 8),
                  avatar: userData.avatar || null,
                  role: userData.role || 'user'
                }
              }
            } catch (error) {
              console.warn('Error fetching author data:', authorId, error)
            }
          }
        })
      )
      
      // Combine posts with author data
      for (const post of postsData) {
        const postData: any = post;
        const authorId = postData.authorId
        const author = authorsMap[authorId] || {
          name: 'Unknown User',
          username: authorId ? authorId.substring(0, 8) : 'unknown',
          role: 'user'
        }
        
        posts.push({
          ...postData,
          author,
          createdAt: postData.createdAt?.toDate(),
          updatedAt: postData.updatedAt?.toDate()
        })
      }
      
      return posts
    } catch (error) {
      console.error('Error fetching saved posts:', error)
      return []
    }
  }

  // Subscribe to saved posts for a user
  static subscribeToSavedPosts(userId: string, callback: (posts: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    // First, get saved posts references
    const savedPostsRef = collection(db, 'savedPosts')
    const savedPostsQuery = query(
      savedPostsRef,
      where('userId', '==', userId),
      orderBy('savedAt', 'desc')
    )
    
    return onSnapshot(savedPostsQuery, async (snapshot) => {
      const savedPostIds = snapshot.docs.map(doc => doc.data().postId)
      
      if (savedPostIds.length === 0) {
        callback([])
        return
      }
      
      // Fetch all posts first
      const postsData = []
      const authorIds = new Set<string>()
      
      for (const postId of savedPostIds) {
        if (!db) continue
        const postRef = doc(db, 'posts', postId)
        const postSnap = await getDoc(postRef)
        
        if (postSnap.exists()) {
          const postData = postSnap.data()
          if (postData.authorId) {
            authorIds.add(postData.authorId)
          }
          postsData.push({
            id: postSnap.id,
            ...postData,
            isSaved: true
          })
        }
      }
      
      // Fetch all author data in batch
      const authorsMap: {[key: string]: any} = {}
      await Promise.all(
        Array.from(authorIds).map(async (authorId) => {
          if (db) {
            try {
              const authorRef = doc(db, 'users', authorId)
              const authorSnap = await getDoc(authorRef)
              if (authorSnap.exists()) {
                const userData = authorSnap.data()
                authorsMap[authorId] = {
                  name: userData.name || 'Unknown User',
                  username: userData.username || authorId.substring(0, 8),
                  avatar: userData.avatar || null,
                  role: userData.role || 'user'
                }
              }
            } catch (error) {
              console.warn('Error fetching author data:', authorId, error)
            }
          }
        })
      )
      
      // Combine posts with author data
      const posts = postsData.map((post: any) => {
        const postData: any = post;
        const authorId = postData.authorId
        const author = authorsMap[authorId] || {
          name: 'Unknown User',
          username: authorId ? authorId.substring(0, 8) : 'unknown',
          role: 'user'
        }
        
        return {
          ...postData,
          author,
          createdAt: postData.createdAt?.toDate(),
          updatedAt: postData.updatedAt?.toDate()
        }
      })
      
      callback(posts)
    })
  }

  // Like/Unlike a post
  static async togglePostLike(postId: string, userId: string) {
    if (!db || !isAuthenticated()) return false
    
    const likeRef = doc(db, 'likes', `${userId}_${postId}`)
    const likeSnap = await getDoc(likeRef)
    if (!db) return false;
    const postRef = doc(db, 'posts', postId)
    
    if (likeSnap.exists()) {
      // Unlike
      await deleteDoc(likeRef)
      await updateDoc(postRef, {
        likesCount: increment(-1)
      })
      return false
    } else {
      // Like
      await setDoc(likeRef, {
        userId,
        postId,
        createdAt: serverTimestamp()
      })
      await updateDoc(postRef, {
        likesCount: increment(1)
      })
      
      // Create notification for post author
      const postSnap = await getDoc(postRef)
      if (postSnap.exists() && postSnap.data().authorId !== userId) {
        await NotificationService.createPostNotification(
          postSnap.data().authorId,
          'like',
          userId,
          postId
        )
      }
      return true
    }
  }

  // Share a post
  static async sharePost(postId: string, userId: string, shareData?: any) {
    if (!db || !isAuthenticated()) return false
    
    if (!db) return false;
    const postRef = doc(db, 'posts', postId)
    
    // Record the share
    const shareRef = doc(collection(db, 'shares'))
    await setDoc(shareRef, {
      userId,
      postId,
      shareData: shareData || {},
      createdAt: serverTimestamp()
    })
    
    // Update post's share count
    await updateDoc(postRef, {
      sharesCount: increment(1)
    })
    
    // Create notification for post author
    const postSnap = await getDoc(postRef)
    if (postSnap.exists() && postSnap.data().authorId !== userId) {
      await NotificationService.createPostNotification(
        postSnap.data().authorId,
        'share',
        userId,
        postId,
        shareData
      )
    }
    
    return true
  }

}

// Real-time Friends Management
export class FriendService {
  // Send friend request
  static async sendFriendRequest(fromUserId: string, toUserId: string, message?: string) {
    if (!db || !isAuthenticated()) return
    
    const requestData = {
      fromUserId,
      toUserId,
      message: message || '',
      status: 'pending',
      createdAt: serverTimestamp()
    }
    
    await addDoc(collection(db, 'friendRequests'), requestData)
    
    // Create notification
    await NotificationService.createNotification(
      toUserId,
      'friend_request',
      'You have a new friend request',
      { fromUserId }
    )
  }

  // Accept friend request
  static async acceptFriendRequest(requestId: string) {
    if (!db || !isAuthenticated()) return
    
    // Get request details first
    const requestRef = doc(db, 'friendRequests', requestId)
    const requestSnap = await getDoc(requestRef)
    
    if (!requestSnap.exists()) {
      throw new Error('Friend request not found')
    }
    
    const requestData = requestSnap.data()
    const { fromUserId, toUserId } = requestData
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    })
    
    // Create friendship document
    const friendshipId = [fromUserId, toUserId].sort().join('_')
    await addDoc(collection(db, 'friendships'), {
      id: friendshipId,
      user1Id: fromUserId,
      user2Id: toUserId,
      createdAt: serverTimestamp()
    })
    
    // Update friend counts
    const user1Ref = doc(db, 'users', fromUserId)
    const user2Ref = doc(db, 'users', toUserId)
    await updateDoc(user1Ref, { friendsCount: increment(1) })
    await updateDoc(user2Ref, { friendsCount: increment(1) })
    
    // Create notification
    await NotificationService.createNotification(
      fromUserId,
      'friend_accepted',
      'Your friend request was accepted',
      { fromUserId: toUserId }
    )
  }

  // Reject friend request
  static async rejectFriendRequest(requestId: string) {
    if (!db || !isAuthenticated()) return
    
    const requestRef = doc(db, 'friendRequests', requestId)
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp()
    })
  }

  // Subscribe to received friend requests
  static subscribeToReceivedFriendRequests(userId: string, callback: (requests: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    const requestsRef = collection(db, 'friendRequests')
    const requestsQuery = query(
      requestsRef,
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(requestsQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async (requestDoc) => {
          const requestData = requestDoc.data()
          
          // Get sender info
          if (db) {
            const fromUserRef = doc(db, 'users', requestData.fromUserId)
            const fromUserSnap = await getDoc(fromUserRef)
            const fromUserData = fromUserSnap.exists() ? fromUserSnap.data() : null
            
            return {
              id: requestDoc.id,
              ...requestData,
              fromUser: fromUserData ? {
                id: requestData.fromUserId,
                name: fromUserData.name,
                username: fromUserData.username,
                avatar: fromUserData.avatar,
                email: fromUserData.email
              } : null,
              createdAt: requestData.createdAt?.toDate()
            }
          }
          return null
        })
      )
      
      callback(requests.filter((req): req is NonNullable<typeof req> => req !== null && req.fromUser !== undefined))
    })
  }

  // Subscribe to sent friend requests
  static subscribeToSentFriendRequests(userId: string, callback: (requests: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    const requestsRef = collection(db, 'friendRequests')
    const requestsQuery = query(
      requestsRef,
      where('fromUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )
    
    return onSnapshot(requestsQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async (requestDoc) => {
          const requestData = requestDoc.data()
          
          // Get recipient info
          if (db) {
            const toUserRef = doc(db, 'users', requestData.toUserId)
            const toUserSnap = await getDoc(toUserRef)
            const toUserData = toUserSnap.exists() ? toUserSnap.data() : null
            
            return {
              id: requestDoc.id,
              ...requestData,
              toUser: toUserData ? {
                id: requestData.toUserId,
                name: toUserData.name,
                username: toUserData.username,
                avatar: toUserData.avatar,
                email: toUserData.email
              } : null,
              createdAt: requestData.createdAt?.toDate()
            }
          }
          return null
        })
      )
      
      callback(requests.filter((req): req is NonNullable<typeof req> => req !== null && req.toUser !== undefined))
    })
  }

  // Get real-time friends list
  static subscribeToFriends(userId: string, callback: (friends: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    const friendshipsRef = collection(db, 'friendships')
    const friendsQuery = query(
      friendshipsRef,
      where('user1Id', '==', userId)
    )
    const friendsQuery2 = query(
      friendshipsRef,
      where('user2Id', '==', userId)
    )
    
    // Subscribe to both queries
    const unsubscribe1 = onSnapshot(friendsQuery, async (snapshot) => {
      await this.processFriendsSnapshot(snapshot, userId, 'user2Id', callback)
    })
    
    const unsubscribe2 = onSnapshot(friendsQuery2, async (snapshot) => {
      await this.processFriendsSnapshot(snapshot, userId, 'user1Id', callback)
    })
    
    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }

  private static async processFriendsSnapshot(snapshot: any, userId: string, friendField: string, callback: (friends: any[]) => void) {
    const friends = await Promise.all(
      snapshot.docs.map(async (friendshipDoc: any) => {
        const friendshipData = friendshipDoc.data()
        const friendId = friendshipData[friendField]
        
        if (db) {
          const friendRef = doc(db, 'users', friendId)
          const friendSnap = await getDoc(friendRef)
          
          if (friendSnap.exists()) {
            return {
              id: friendId,
              ...friendSnap.data(),
              friendshipId: friendshipDoc.id,
              friendsSince: friendshipData.createdAt?.toDate()
            }
          }
        }
        return null
      })
    )
    
    callback(friends.filter(Boolean))
  }
}

// Real-time Chat Management
export class ChatService {
  // Create or get existing chat
  static async createOrGetChat(participantIds: string[], chatName?: string, isGroup = false) {
    if (!db || !isAuthenticated()) return null
    
    if (isGroup) {
      // For group chats, create new chat with unique ID
      const chatData = {
        type: 'group',
        name: chatName || 'Group Chat',
        participantIds,
        adminIds: [participantIds[0]], // First participant is admin
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null
      }
      
      const chatRef = await addDoc(collection(db, 'chats'), chatData)
      return chatRef.id
    } else {
      // For direct chats, use sorted IDs
      const sortedIds = participantIds.sort()
      const chatId = sortedIds.join('_')
      
      const chatRef = doc(db, 'chats', chatId)
      const chatSnap = await getDoc(chatRef)
      
      if (!chatSnap.exists()) {
        const chatData = {
          id: chatId,
          type: 'direct',
          participantIds: sortedIds,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null
        }
        
        await setDoc(chatRef, chatData)
      }
      
      return chatId
    }
  }

  // Get user's chats
  static subscribeToUserChats(userId: string, callback: (chats: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    const chatsRef = collection(db, 'chats')
    const chatsQuery = query(
      chatsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    )
    
    return onSnapshot(chatsQuery, async (snapshot) => {
      const chats = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data()
          
          // Get participant details
          const participants = await Promise.all(
            chatData.participantIds.map(async (participantId: string) => {
              if (db) {
                const userRef = doc(db, 'users', participantId)
                const userSnap = await getDoc(userRef)
                return userSnap.exists() ? { id: participantId, ...userSnap.data() } : null
              }
              return null
            })
          )
          
          return {
            id: chatDoc.id,
            ...chatData,
            participants: participants.filter(Boolean),
            createdAt: chatData.createdAt?.toDate(),
            updatedAt: chatData.updatedAt?.toDate()
          }
        })
      )
      
      callback(chats)
    })
  }

  // Add participant to group chat
  static async addParticipantToGroup(chatId: string, userId: string, adminId: string) {
    if (!db || !isAuthenticated()) return
    
    const chatRef = doc(db, 'chats', chatId)
    const chatSnap = await getDoc(chatRef)
    
    if (chatSnap.exists() && chatSnap.data().type === 'group') {
      const chatData = chatSnap.data()
      
      // Check if user is admin
      if (!chatData.adminIds.includes(adminId)) {
        throw new Error('Only admins can add participants')
      }
      
      // Add participant
      await updateDoc(chatRef, {
        participantIds: arrayUnion(userId),
        updatedAt: serverTimestamp()
      })
      
      // Send system message
      await this.sendMessage(chatId, userId, `User added to the group`, 'text')
    }
  }

  // Remove participant from group chat
  static async removeParticipantFromGroup(chatId: string, userId: string, adminId: string) {
    if (!db || !isAuthenticated()) return
    
    const chatRef = doc(db, 'chats', chatId)
    const chatSnap = await getDoc(chatRef)
    
    if (chatSnap.exists() && chatSnap.data().type === 'group') {
      const chatData = chatSnap.data()
      
      // Check if user is admin
      if (!chatData.adminIds.includes(adminId)) {
        throw new Error('Only admins can remove participants')
      }
      
      // Remove participant
      await updateDoc(chatRef, {
        participantIds: arrayRemove(userId),
        updatedAt: serverTimestamp()
      })
      
      // Send system message
      await this.sendMessage(chatId, userId, `User removed from the group`, 'text')
    }
  }

  // Send message (with friend validation)
  static async sendMessage(chatId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' = 'text', attachments?: any[]) {
    if (!db || !isAuthenticated()) return
    
    // Get chat info to validate participants
    const chatRef = doc(db, 'chats', chatId)
    const chatSnap = await getDoc(chatRef)
    
    if (!chatSnap.exists()) {
      throw new Error('Chat not found')
    }
    
    const chatData = chatSnap.data()
    const participantIds = chatData.participantIds || []
    
    // For direct chats, check if users are friends (unless admin/super_admin)
    if (chatData.type === 'direct' && participantIds.length === 2) {
      const otherUserId = participantIds.find((id: string) => id !== senderId)
      if (otherUserId) {
        // Get sender's role
        const senderRef = doc(db, 'users', senderId)
        const senderSnap = await getDoc(senderRef)
        const senderRole = senderSnap.exists() ? senderSnap.data().role : 'user'
        
        // Allow messaging if sender is admin or super_admin
        if (senderRole !== 'super_admin' && senderRole !== 'level_admin') {
          // Check friendship status
          const friendshipStatus = await UserService.checkFriendshipStatus(senderId, otherUserId)
          if (friendshipStatus !== 'friends') {
            throw new Error('You can only message friends. Send a friend request first.')
          }
        }
      }
    }
    
    const messageData = {
      chatId,
      senderId,
      content,
      type,
      attachments: attachments || [],
      timestamp: serverTimestamp(),
      isRead: false
    }
    
    const messageRef = await addDoc(collection(db, 'messages'), messageData)
    
    // Update chat's last message
    await updateDoc(chatRef, {
      lastMessage: {
        id: messageRef.id,
        senderId,
        content,
        type,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    })
    
    return messageRef.id
  }

  // Subscribe to chat messages
  static subscribeToMessages(chatId: string, callback: (messages: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    const messagesRef = collection(db, 'messages')
    const messagesQuery = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    )
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }))
      callback(messages)
    })
  }

  // Delete message
  static async deleteMessage(messageId: string, deleteType: 'sender' | 'everyone', userId: string) {
    if (!db || !isAuthenticated()) return

    try {
      const messageRef = doc(db, 'messages', messageId)
      
      if (deleteType === 'everyone') {
        await updateDoc(messageRef, {
          isDeleted: true,
          deletedFor: 'everyone',
          deletedAt: serverTimestamp(),
          deletedBy: userId
        })
      } else {
        // For sender-only deletion, we mark it in a deletedBy array
        const messageSnap = await getDoc(messageRef)
        if (messageSnap.exists()) {
          const data = messageSnap.data()
          const deletedBy = data.deletedBy || []
          
          if (!deletedBy.includes(userId)) {
            deletedBy.push(userId)
            await updateDoc(messageRef, {
              deletedBy,
              isDeleted: deletedBy.length > 0,
              deletedFor: 'sender'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  // Forward message
  static async forwardMessage(messageId: string, targetChatIds: string[], userId: string) {
    if (!db || !isAuthenticated()) return

    try {
      const messageRef = doc(db, 'messages', messageId)
      const messageSnap = await getDoc(messageRef)
      
      if (!messageSnap.exists()) {
        throw new Error('Message not found')
      }

      const originalMessage = messageSnap.data()
      
      const forwardPromises = targetChatIds.map(async (chatId) => {
        const forwardedMessage = {
          chatId,
          senderId: userId,
          content: originalMessage.content,
          type: originalMessage.type,
          mediaUrls: originalMessage.mediaUrls || [],
          timestamp: serverTimestamp(),
          isRead: false,
          readBy: [userId],
          isForwarded: true,
          originalMessageId: messageId,
          originalSenderId: originalMessage.senderId
        }

        if (db) {
          const messageDocRef = await addDoc(collection(db, 'messages'), forwardedMessage)
          
          // Update chat's last message
          const chatRef = doc(db, 'chats', chatId)
          await updateDoc(chatRef, {
            lastMessage: {
              id: messageDocRef.id,
              senderId: userId,
              content: `Forwarded: ${originalMessage.content}`,
              type: originalMessage.type,
              timestamp: serverTimestamp()
            },
            updatedAt: serverTimestamp()
          })
        }
      })

      await Promise.all(forwardPromises)
    } catch (error) {
      console.error('Error forwarding message:', error)
      throw error
    }
  }

  // Reply to message
  static async replyToMessage(chatId: string, senderId: string, content: string, replyToMessageId: string) {
    if (!db || !isAuthenticated()) return

    try {
      // Get the original message
      const originalMessageRef = doc(db, 'messages', replyToMessageId)
      const originalMessageSnap = await getDoc(originalMessageRef)
      
      if (!originalMessageSnap.exists()) {
        throw new Error('Original message not found')
      }

      const originalMessage = originalMessageSnap.data()
      
      const messageData = {
        chatId,
        senderId,
        content,
        type: 'text',
        timestamp: serverTimestamp(),
        isRead: false,
        readBy: [senderId],
        replyTo: {
          messageId: replyToMessageId,
          content: originalMessage.content,
          senderId: originalMessage.senderId,
          senderName: originalMessage.senderName || 'Unknown'
        }
      }

      if (db) {
        const messageRef = await addDoc(collection(db, 'messages'), messageData)
        
        // Update chat's last message
        const chatRef = doc(db, 'chats', chatId)
        await updateDoc(chatRef, {
          lastMessage: {
            id: messageRef.id,
            senderId,
            content,
            type: 'text',
            timestamp: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        })

        return messageRef.id
      }
    } catch (error) {
      console.error('Error replying to message:', error)
      throw error
    }
  }

  // Delete chat
  static async deleteChat(chatId: string, userId: string) {
    if (!db || !isAuthenticated()) return

    try {
      // Get chat document
      const chatRef = doc(db, 'chats', chatId)
      const chatSnap = await getDoc(chatRef)
      
      if (!chatSnap.exists()) {
        throw new Error('Chat not found')
      }

      const chatData = chatSnap.data()
      
      // For direct chats, just remove the user from participants
      if (chatData.type === 'direct' || chatData.participants.length === 2) {
        // Delete all messages in the chat
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatId', '==', chatId)
        )
        const messagesSnapshot = await getDocs(messagesQuery)
        
        const deletePromises = messagesSnapshot.docs.map(messageDoc => {
          if (db) {
            return deleteDoc(doc(db, 'messages', messageDoc.id))
          }
          return Promise.resolve()
        })
        await Promise.all(deletePromises)
        
        // Delete the chat
        await deleteDoc(chatRef)
      } else {
        // For group chats, remove user from participants
        const updatedParticipants = chatData.participantIds.filter((id: string) => id !== userId)
        
        if (updatedParticipants.length === 0) {
          // If no participants left, delete the chat
          await deleteDoc(chatRef)
        } else {
          // Update participants list
          await updateDoc(chatRef, {
            participantIds: updatedParticipants,
            participants: chatData.participants.filter((p: any) => p.id !== userId),
            updatedAt: serverTimestamp()
          })
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }
}

// Real-time Notifications
export class NotificationService {
  // Create notification
  static async createNotification(userId: string, type: string, title: string, data?: any) {
    if (!db || !isAuthenticated()) return
    
    const notificationData = {
      userId,
      type,
      title,
      data: data || {},
      isRead: false,
      createdAt: serverTimestamp()
    }
    
    await addDoc(collection(db, 'notifications'), notificationData)
  }

  // Create post interaction notification
  static async createPostNotification(postAuthorId: string, type: 'like' | 'comment' | 'share', fromUserId: string, postId: string, additionalData?: any) {
    if (!db || !isAuthenticated() || postAuthorId === fromUserId) return
    
    let title = ""
    let data = { postId, fromUserId, ...additionalData }
    
    switch (type) {
      case 'like':
        title = "Someone liked your post"
        break
      case 'comment':
        title = "Someone commented on your post"
        break
      case 'share':
        title = "Someone shared your post"
        break
    }
    
    await this.createNotification(postAuthorId, type, title, data)
  }

  // Subscribe to user notifications
  static subscribeToNotifications(userId: string, callback: (notifications: any[]) => void) {
    if (!db || !isAuthenticated()) return () => {}
    
    const notificationsRef = collection(db, 'notifications')
    const notificationsQuery = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
      callback(notifications)
    })
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    if (!db || !isAuthenticated()) return
    
    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      isRead: true
    })
  }

  // Send bulk notification (Admin only)
  static async sendBulkNotification(title: string, message: string, targetUsers?: string[]) {
    if (!db || !isAuthenticated()) return
    
    // If no target users specified, send to all users
    if (!targetUsers) {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      targetUsers = usersSnapshot.docs.map(doc => doc.id)
    }
    
    // Create notifications for all target users
    const promises = targetUsers.map(userId => 
      this.createNotification(userId, 'admin_message', title, { message })
    )
    
    await Promise.all(promises)
    
    // Log bulk notification
    await addDoc(collection(db, 'bulkNotifications'), {
      title,
      message,
      targetUsers,
      sentAt: serverTimestamp(),
      sentBy: 'admin' // You can pass actual admin ID
    })
  }
}

// File Upload Service - Now using Cloudinary via API
export class FileService {
  static async uploadFile(file: File, uploadType: string = 'post', targetId?: string): Promise<string> {
    if (!isAuthenticated()) throw new Error('User not authenticated')
    
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', uploadType)
    if (targetId) {
      formData.append('targetId', targetId)
    }

    const token = await user.getIdToken()
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    const result = await response.json()
    return result.url
  }

  static async uploadPostMedia(files: File[], userId: string): Promise<string[]> {
    if (!isAuthenticated()) return []
    
    const uploadPromises = files.map((file) => {
      return this.uploadFile(file, 'post', userId)
    })
    
    return await Promise.all(uploadPromises)
  }

  static async uploadAvatar(file: File): Promise<string> {
    return this.uploadFile(file, 'avatar')
  }

  static async uploadCover(file: File): Promise<string> {
    return this.uploadFile(file, 'cover')
  }

  static async uploadChatMedia(file: File, chatId: string): Promise<string> {
    return this.uploadFile(file, 'chat', chatId)
  }

  static async uploadStoryMedia(file: File, storyId: string): Promise<string> {
    return this.uploadFile(file, 'story', storyId)
  }

  static async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
    if (!isAuthenticated()) throw new Error('User not authenticated')
    
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')

    const token = await user.getIdToken()
    
    const response = await fetch(`/api/upload/delete?publicId=${encodeURIComponent(publicId)}&resourceType=${resourceType}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Delete failed')
    }

    const result = await response.json()
    return result.success
  }
}




















































