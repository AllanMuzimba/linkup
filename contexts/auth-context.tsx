"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  User as FirebaseUser,
  updateProfile,
  UserCredential
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { type User, type AuthContextType, ROLE_PERMISSIONS } from "@/types/auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth providers
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()
const twitterProvider = new TwitterAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Get user data from Firestore
  const getUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    if (!db) {
      console.error('Firestore not initialized')
      return null
    }

    try {
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: userData.name || firebaseUser.displayName || 'User',
          role: userData.role || 'user',
          avatar: userData.avatar || firebaseUser.photoURL,
          phone: userData.phone || firebaseUser.phoneNumber,
          createdAt: userData.joinedDate?.toDate() || new Date(),
          lastActive: userData.lastActive?.toDate() || new Date(),
          isOnline: userData.isOnline || false,
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  // Create user document in Firestore
  const createUserDocument = async (firebaseUser: FirebaseUser, additionalData?: any) => {
    if (!db) {
      throw new Error('Firestore not initialized')
    }

    try {
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userData = {
        email: firebaseUser.email,
        name: additionalData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        username: firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.slice(0, 8)}`,
        role: additionalData?.role || 'user',
        avatar: firebaseUser.photoURL || null,
        phone: additionalData?.phone || firebaseUser.phoneNumber || null,
        joinedDate: serverTimestamp(),
        lastActive: serverTimestamp(),
        isOnline: true,
        isVerified: firebaseUser.emailVerified,
        isPrivate: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        settings: {
          notifications: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false,
            marketingEmails: false,
            friendRequests: true,
            postLikes: true,
            comments: true,
            mentions: true
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false,
            allowFriendRequests: true,
            allowMessages: true,
            showOnlineStatus: true
          }
        },
        ...additionalData
      }

      await setDoc(userRef, userData)
      return userData
    } catch (error) {
      console.error('Error creating user document:', error)
      throw error
    }
  }

  useEffect(() => {
    setMounted(true)

    // Only set up auth listener if Firebase is properly initialized
    if (!auth) {
      console.warn('Firebase Auth not initialized. Please check your configuration.')
      setIsLoading(false)
      return
    }

    if (!db) {
      console.warn('Firestore not initialized. Please check your configuration.')
      setIsLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          let userData = await getUserData(firebaseUser)

          if (!userData) {
            // Create user document if it doesn't exist
            try {
              const newUserData = await createUserDocument(firebaseUser)
              userData = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                name: newUserData.name,
                role: newUserData.role,
                avatar: newUserData.avatar,
                phone: newUserData.phone,
                createdAt: new Date(),
                lastActive: new Date(),
                isOnline: true,
              }
            } catch (error) {
              console.error('Error creating user document:', error)
            }
          }

          // Update last active
          try {
            if (db) {
              const userRef = doc(db, 'users', firebaseUser.uid)
              await updateDoc(userRef, {
                lastActive: serverTimestamp(),
                isOnline: true
              })
            }
          } catch (error) {
            console.error('Error updating last active:', error)
          }

          setUser(userData)
        } else {
          // User is signed out
          setUser(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setUser(null)
      } finally {
        // Only set loading to false after all operations are complete
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Don't render children until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }

    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (email: string, password: string, name: string, role: string = 'user', phone?: string) => {
    if (!auth) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }

    setIsLoading(true)
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)

      // Update display name
      await updateProfile(firebaseUser, { displayName: name })

      // Send email verification with custom settings
      const { sendEmailVerification } = await import('firebase/auth')
      
      const actionCodeSettings = {
        // URL to redirect back to after email verification
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        handleCodeInApp: true,
      }
      
      try {
        await sendEmailVerification(firebaseUser, actionCodeSettings)
        console.log('Email verification sent successfully')
      } catch (emailError) {
        console.warn('Email verification failed:', emailError)
        // Don't throw error - user can still use the app
      }

      // Create user document with additional data
      await createUserDocument(firebaseUser, { name, role, phone })

      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || 'Registration failed')
    }
  }

  const loginWithGoogle = async (): Promise<UserCredential | void> => {
    if (!auth) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }

    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      
      // Check if user document exists, create if not
      if (db) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)
          
          if (!userSnap.exists()) {
            // Create user document for new Google users
            await createUserDocument(firebaseUser, {
              name: firebaseUser.displayName || 'Google User',
              role: 'user'
            })
          }
        } catch (dbError) {
          console.warn('Database operation failed, but login succeeded:', dbError)
          // Don't throw error - user is authenticated even if DB fails
        }
      }
      
      // User state will be updated by onAuthStateChanged
      return result
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || 'Google login failed')
    }
  }

  const loginWithFacebook = async (): Promise<UserCredential | void> => {
    if (!auth) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }

    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, facebookProvider)
      // User state will be updated by onAuthStateChanged
      return result
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || 'Facebook login failed')
    }
  }

  const loginWithTwitter = async (): Promise<UserCredential | void> => {
    if (!auth) {
      throw new Error('Firebase not initialized. Please check your configuration.')
    }

    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, twitterProvider)
      // User state will be updated by onAuthStateChanged
      return result
    } catch (error: any) {
      setIsLoading(false)
      throw new Error(error.message || 'Twitter login failed')
    }
  }

  const logout = async () => {
    if (!auth) {
      setUser(null)
      return
    }

    try {
      // Update user status to offline before signing out
      if (user && db) {
        const userRef = doc(db, 'users', user.id)
        await updateDoc(userRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        })
      }

      await signOut(auth)
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback: clear user state locally
      setUser(null)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return ROLE_PERMISSIONS[user.role].includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginWithGoogle,
        loginWithFacebook,
        loginWithTwitter,
        logout,
        isLoading,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}