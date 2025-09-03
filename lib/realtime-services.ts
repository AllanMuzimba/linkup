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
import { db, storage } from './firebase'

// Real-time User Management
export class UserService {
  // Get real-time user stats
  static subscribeToUserStats(callback: (stats: any) => void) {
    if (!db) return () => {}
    
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
    if (!db) return []
    
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
    if (!db) return 'none'
    
    // Check for existing friendship
    const friendshipId = [userId1, userId2].sort().join('_')
    const friendshipRef = doc(db, 'friendships', friendshipId)
    const friendshipSnap = await getDoc(friendshipRef)
    
    if (friendshipSnap.exists()) {
      return 'friends'
    }
    
    // Check for pending friend request
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
    if (!db) return
    
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
    if (!db) return
    
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      isOnline,
      lastActive: serverTimestamp()
    })
  }

  // Update user profile
  static async updateUserProfile(userId: string, profileData: any) {
    if (!db) return
    
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    })
  }

  // Get user's own posts
  static subscribeToUserPosts(userId: string, callback: (posts: any[]) => void) {
    if (!db) return () => {}
    
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
          
          // Check if user liked this post
          const likeRef = doc(db, 'likes', `${userId}_${postDoc.id}`)
          const likeSnap = await getDoc(likeRef)
          
          return {
            id: postDoc.id,
            ...postData,
            isLiked: likeSnap.exists(),
            createdAt: postData.createdAt?.toDate(),
            updatedAt: postData.updatedAt?.toDate()
          }
        })
      )
      
      callback(posts)
    })
  }

  // Get posts user has liked/engaged with
  static subscribeToLikedPosts(userId: string, callback: (posts: any[]) => void) {
    if (!db) return () => {}
    
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
          return null
        })
      )
      
      callback(posts.filter(Boolean))
    })
  }

  // Get user by ID
  static async getUserById(userId: string) {
    if (!db) return null
    
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
    if (!db || (!email && !phone)) return null
    
    try {
      const usersRef = collection(db, 'users')
      let userQuery
      
      if (email) {
        userQuery = query(usersRef, where('email', '==', email))
      } else if (phone) {
        userQuery = query(usersRef, where('phone', '==', phone))
      }
      
      if (userQuery) {
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
  static async createPost(authorId: string, content: string, type: 'text' | 'image' | 'video', mediaUrls?: string[], location?: GeoPoint) {
    if (!db) return null
    
    const postData = {
      authorId,
      content,
      type,
      mediaUrls: mediaUrls || [],
      location: location || null,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      visibility: 'public'
    }
    
    const docRef = await addDoc(collection(db, 'posts'), postData)
    
    // Update user's post count
    const userRef = doc(db, 'users', authorId)
    await updateDoc(userRef, {
      postsCount: increment(1)
    })
    
    return docRef.id
  }

  // Get real-time posts feed
  static subscribeToPostsFeed(callback: (posts: any[]) => void, location?: { lat: number, lng: number, radius?: number }) {
    if (!db) return () => {}
    
    const postsRef = collection(db, 'posts')
    let postsQuery = query(
      postsRef,
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    return onSnapshot(postsQuery, async (snapshot) => {
      const posts = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data()
          
          // Get author info
          const authorRef = doc(db, 'users', postData.authorId)
          const authorSnap = await getDoc(authorRef)
          const authorData = authorSnap.exists() ? authorSnap.data() : null
          
          // Calculate distance if location provided
          let distance = null
          if (location && postData.location) {
            distance = UserService.calculateDistance(location, postData.location)
          }
          
          return {
            id: postDoc.id,
            ...postData,
            author: authorData,
            distance,
            createdAt: postData.createdAt?.toDate(),
            updatedAt: postData.updatedAt?.toDate()
          }
        })
      )
      
      // Filter by location if specified
      const filteredPosts = location && location.radius ? 
        posts.filter(post => !post.distance || post.distance <= (location.radius || 50)) :
        posts
      
      callback(filteredPosts)
    })
  }

  // Like/Unlike a post
  static async togglePostLike(postId: string, userId: string) {
    if (!db) return
    
    const likeRef = doc(db, 'likes', `${userId}_${postId}`)
    const likeSnap = await getDoc(likeRef)
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
      await addDoc(collection(db, 'likes'), {
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
        await NotificationService.createNotification(
          postSnap.data().authorId,
          'like',
          `Someone liked your post`,
          { postId, fromUserId: userId }
        )
      }
      return true
    }
  }
}

// Real-time Friends Management
export class FriendService {
  // Send friend request
  static async sendFriendRequest(fromUserId: string, toUserId: string, message?: string) {
    if (!db) return
    
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
    if (!db) return
    
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
    if (!db) return
    
    const requestRef = doc(db, 'friendRequests', requestId)
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp()
    })
  }

  // Subscribe to received friend requests
  static subscribeToReceivedFriendRequests(userId: string, callback: (requests: any[]) => void) {
    if (!db) return () => {}
    
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
          const fromUserRef = doc(db!, 'users', requestData.fromUserId)
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
        })
      )
      
      callback(requests.filter(req => req.fromUser))
    })
  }

  // Subscribe to sent friend requests
  static subscribeToSentFriendRequests(userId: string, callback: (requests: any[]) => void) {
    if (!db) return () => {}
    
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
          const toUserRef = doc(db!, 'users', requestData.toUserId)
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
        })
      )
      
      callback(requests.filter(req => req.toUser))
    })
  }

  // Get real-time friends list
  static subscribeToFriends(userId: string, callback: (friends: any[]) => void) {
    if (!db) return () => {}
    
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
        
        const friendRef = doc(db!, 'users', friendId)
        const friendSnap = await getDoc(friendRef)
        
        if (friendSnap.exists()) {
          return {
            id: friendId,
            ...friendSnap.data(),
            friendshipId: friendshipDoc.id,
            friendsSince: friendshipData.createdAt?.toDate()
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
    if (!db) return null
    
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
    if (!db) return () => {}
    
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
              const userRef = doc(db!, 'users', participantId)
              const userSnap = await getDoc(userRef)
              return userSnap.exists() ? { id: participantId, ...userSnap.data() } : null
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
    if (!db) return
    
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
      await this.sendMessage(chatId, 'system', `User added to the group`, 'system')
    }
  }

  // Remove participant from group chat
  static async removeParticipantFromGroup(chatId: string, userId: string, adminId: string) {
    if (!db) return
    
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
      await this.sendMessage(chatId, 'system', `User removed from the group`, 'system')
    }
  }

  // Send message (with friend validation)
  static async sendMessage(chatId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' = 'text', attachments?: any[]) {
    if (!db) return
    
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
    if (!db) return () => {}
    
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
    if (!db) return

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
    if (!db) return

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
      })

      await Promise.all(forwardPromises)
    } catch (error) {
      console.error('Error forwarding message:', error)
      throw error
    }
  }

  // Reply to message
  static async replyToMessage(chatId: string, senderId: string, content: string, replyToMessageId: string) {
    if (!db) return

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
    } catch (error) {
      console.error('Error replying to message:', error)
      throw error
    }
  }

  // Delete chat
  static async deleteChat(chatId: string, userId: string) {
    if (!db) return

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
        
        const deletePromises = messagesSnapshot.docs.map(messageDoc => 
          deleteDoc(doc(db, 'messages', messageDoc.id))
        )
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
    if (!db) return
    
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

  // Subscribe to user notifications
  static subscribeToNotifications(userId: string, callback: (notifications: any[]) => void) {
    if (!db) return () => {}
    
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
    if (!db) return
    
    const notificationRef = doc(db, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      isRead: true
    })
  }

  // Send bulk notification (Admin only)
  static async sendBulkNotification(title: string, message: string, targetUsers?: string[]) {
    if (!db) return
    
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

// File Upload Service
export class FileService {
  static async uploadFile(file: File, path: string): Promise<string> {
    if (!storage) throw new Error('Storage not initialized')
    
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  static async uploadPostMedia(files: File[], userId: string): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const path = `posts/${userId}/${Date.now()}_${index}_${file.name}`
      return this.uploadFile(file, path)
    })
    
    return await Promise.all(uploadPromises)
  }
}