import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 })
    }

    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 })
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Get or create user document
    const userRef = adminDb.collection('users').doc(uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      // Create new user document
      const userData = {
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        username: decodedToken.email?.split('@')[0] || `user_${uid.slice(0, 8)}`,
        role: 'user',
        avatar: decodedToken.picture || null,
        joinedDate: new Date(),
        lastActive: new Date(),
        isOnline: true,
        isVerified: false,
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
        }
      }

      await userRef.set(userData)
    } else {
      // Update last active
      await userRef.update({
        lastActive: new Date(),
        isOnline: true
      })
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    // Set cookie
    const cookieStore = cookies()
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return NextResponse.json({ success: true, uid })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies()
    cookieStore.delete('session')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
