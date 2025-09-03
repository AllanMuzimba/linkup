import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { db, auth } from './firebase'
import type { User, Post, Chat, Message, Notification } from '@/types/chat'

// Auth hook
export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return { user, loading }
}

// User data hook
export const useUserData = (userId: string | null) => {
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setUserData(null)
      setLoading(false)
      return
    }

    const userRef = doc(db, 'users', userId)
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData({ id: doc.id, ...doc.data() } as User)
      } else {
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  return { userData, loading }
}

// Posts hook
export const usePosts = (authorId?: string, limitCount = 20) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    if (authorId) {
      q = query(
        collection(db, 'posts'),
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[]
      setPosts(postsData)
      setLoading(false)
    })

    return unsubscribe
  }, [authorId, limitCount])

  return { posts, loading }
}

// Chats hook
export const useChats = (userId: string | null) => {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setChats([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[]
      setChats(chatsData)
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  return { chats, loading }
}

// Messages hook
export const useMessages = (chatId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]
      setMessages(messagesData)
      setLoading(false)
    })

    return unsubscribe
  }, [chatId])

  return { messages, loading }
}

// Notifications hook
export const useNotifications = (userId: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[]
      
      setNotifications(notificationsData)
      setUnreadCount(notificationsData.filter(n => !n.isRead).length)
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  return { notifications, unreadCount, loading }
}

// Online users hook
export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('isOnline', '==', true),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
      setOnlineUsers(usersData)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return { onlineUsers, loading }
}
