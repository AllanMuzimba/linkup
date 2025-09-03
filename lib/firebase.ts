import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics, Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Validate required config values
const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "demo-api-key" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "demo-project" &&
    firebaseConfig.appId &&
    !firebaseConfig.appId.includes("a1b2c3d4e5f6g7h8i9j0k1")
  )
}

// Initialize Firebase app
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let analytics: Analytics | null = null

// Only initialize Firebase in browser environment with valid config
if (typeof window !== 'undefined' && isFirebaseConfigValid()) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    
    // Initialize Analytics only if measurementId exists
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app)
    }
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

// Export services (will be null if not initialized)
export { auth, db, storage, analytics }
export default app