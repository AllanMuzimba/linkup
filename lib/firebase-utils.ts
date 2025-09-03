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
  startAfter,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'
import type { User, Post, Message, Chat, Notification } from '@/types/chat'

// Check if Firebase is initialized
const checkFirebaseInit = () => {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized. Please check your Firebase configuration.')
  }
}

const checkStorageInit = () => {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized. Please check your Firebase configuration.')
  }
}

// User operations
export const createUser = async (userData: Omit<User, 'id'>) => {
  checkFirebaseInit()
  const docRef = await addDoc(collection(db!, 'users'), {
    ...userData,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp()
  })
  return docRef.id
}

export const updateUser = async (userId: string, updates: Partial<User>) => {
  checkFirebaseInit()
  const userRef = doc(db!, 'users', userId)
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  })
}

export const getUser = async (userId: string) => {
  checkFirebaseInit()
  const userRef = doc(db!, 'users', userId)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as User : null
}

// Post operations
export const createPost = async (postData: Omit<Post, 'id'>) => {
  checkFirebaseInit()
  const docRef = await addDoc(collection(db!, 'posts'), {
    ...postData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0
  })
  return docRef.id
}

export const updatePost = async (postId: string, updates: Partial<Post>) => {
  checkFirebaseInit()
  const postRef = doc(db!, 'posts', postId)
  await updateDoc(postRef, {
    ...updates,
    updatedAt: serverTimestamp()
  })
}

export const deletePost = async (postId: string) => {
  checkFirebaseInit()
  const postRef = doc(db!, 'posts', postId)
  await deleteDoc(postRef)
}

// Chat operations
export const createChat = async (chatData: Omit<Chat, 'id'>) => {
  const docRef = await addDoc(collection(db, 'chats'), {
    ...chatData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export const sendMessage = async (messageData: Omit<Message, 'id'>) => {
  const docRef = await addDoc(collection(db, 'messages'), {
    ...messageData,
    timestamp: serverTimestamp()
  })
  
  // Update chat's last message
  const chatRef = doc(db, 'chats', messageData.chatId)
  await updateDoc(chatRef, {
    lastMessage: {
      id: docRef.id,
      senderId: messageData.senderId,
      content: messageData.content,
      type: messageData.type,
      timestamp: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  })
  
  return docRef.id
}

// File upload operations
export const uploadFile = async (file: File, path: string): Promise<string> => {
  checkStorageInit()
  const storageRef = ref(storage!, path)
  const snapshot = await uploadBytes(storageRef, file)
  return await getDownloadURL(snapshot.ref)
}

export const deleteFile = async (url: string) => {
  checkStorageInit()
  const fileRef = ref(storage!, url)
  await deleteObject(fileRef)
}

// Engagement operations
export const likePost = async (postId: string, userId: string) => {
  const likeRef = doc(db, 'likes', `${userId}_${postId}`)
  await updateDoc(likeRef, {
    userId,
    postId,
    createdAt: serverTimestamp()
  })
  
  // Increment post likes count
  const postRef = doc(db, 'posts', postId)
  await updateDoc(postRef, {
    likesCount: increment(1)
  })
}

export const unlikePost = async (postId: string, userId: string) => {
  const likeRef = doc(db, 'likes', `${userId}_${postId}`)
  await deleteDoc(likeRef)
  
  // Decrement post likes count
  const postRef = doc(db, 'posts', postId)
  await updateDoc(postRef, {
    likesCount: increment(-1)
  })
}

// Notification operations
export const createNotification = async (notificationData: Omit<Notification, 'id'>) => {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...notificationData,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

// Utility functions
export const generateChatId = (user1Id: string, user2Id: string): string => {
  return [user1Id, user2Id].sort().join('_')
}

export const generateLikeId = (userId: string, postId: string): string => {
  return `${userId}_${postId}`
}

export const generateFollowId = (followerId: string, followingId: string): string => {
  return `${followerId}_${followingId}`
}
