import * as admin from 'firebase-admin'

// Check if we have the required environment variables
const hasRequiredEnvVars = () => {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY !== '"-----BEGIN PRIVATE KEY-----\\nyour-private-key-here\\n-----END PRIVATE KEY-----\\n"'
  )
}

let app: admin.app.App | null = null
let adminDb: admin.firestore.Firestore | null = null
let adminAuth: admin.auth.Auth | null = null
let adminStorage: admin.storage.Storage | null = null

if (hasRequiredEnvVars()) {
  try {
    // Initialize Firebase Admin SDK
    const firebaseAdminConfig = {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    }

    // Initialize app if it doesn't exist
    if (admin.apps.length === 0) {
      app = admin.initializeApp(firebaseAdminConfig)
    } else {
      app = admin.apps[0]!
    }

    // Initialize services
    adminDb = admin.firestore()
    adminAuth = admin.auth()
    adminStorage = admin.storage()
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
} else {
  console.warn('Firebase Admin not configured. Please set FIREBASE_ADMIN_* environment variables.')
}

// Export services (will be null if not initialized)
export { adminDb, adminAuth, adminStorage }
export default app