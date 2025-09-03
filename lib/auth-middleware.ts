import { NextRequest } from 'next/server'
import { adminAuth, adminDb } from './firebase-admin'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string
    email: string
    role: string
    name: string
  }
}

export async function verifyAuth(request: NextRequest): Promise<{ user: any; error?: string }> {
  // Check if Firebase Admin is properly configured
  if (!adminAuth || !adminDb) {
    return { user: null, error: 'Firebase Admin not properly configured. Please check your environment variables.' }
  }

  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization token provided' }
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    
    if (!userDoc.exists) {
      return { user: null, error: 'User document not found' }
    }

    const userData = userDoc.data()!
    
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData.role || 'user',
        name: userData.name || 'User'
      }
    }
  } catch (error: any) {
    console.error('Authentication error:', error)
    return { user: null, error: error.message || 'Authentication failed' }
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const { user, error } = await verifyAuth(request)
    
    if (error || !user) {
      return new Response(JSON.stringify({ error: error || 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user

    return handler(authenticatedRequest)
  }
}

export function requireRole(roles: string[]) {
  return function(handler: (request: AuthenticatedRequest) => Promise<Response>) {
    return async (request: NextRequest) => {
      const { user, error } = await verifyAuth(request)
      
      if (error || !user) {
        return new Response(JSON.stringify({ error: error || 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (!roles.includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Add user to request object
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      return handler(authenticatedRequest)
    }
  }
}