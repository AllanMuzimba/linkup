#!/usr/bin/env node

/**
 * LinkUp Database Setup Script
 * 
 * This script initializes the Firestore database with sample data
 * and creates the necessary collections for LinkUp social media platform.
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function setupDatabase() {
  console.log('🚀 Setting up LinkUp database...\n')
  console.log('📊 This will create the following collections:')
  console.log('   - systemSettings (app configuration)')
  console.log('   - users (sample admin user)')
  console.log('   - posts (welcome post)')
  console.log('   - analytics (stats structure)')
  console.log('   - bulkNotifications (templates)')
  console.log('')

  try {
    // Create system settings document
    console.log('📝 Creating system settings...')
    await setDoc(doc(db, 'systemSettings', 'general'), {
      appName: 'LinkUp',
      version: '1.0.0',
      maintenanceMode: false,
      registrationEnabled: true,
      maxFileSize: {
        image: 5 * 1024 * 1024, // 5MB
        video: 50 * 1024 * 1024, // 50MB
        audio: 10 * 1024 * 1024, // 10MB
        document: 10 * 1024 * 1024 // 10MB
      },
      features: {
        stories: true,
        videoCalls: true,
        voiceMessages: true,
        fileSharing: true
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create sample admin user
    console.log('👤 Creating sample admin user...')
    await setDoc(doc(db, 'users', 'admin-sample'), {
      email: 'admin@linkup.com',
      name: 'LinkUp Admin',
      username: 'linkup_admin',
      role: 'super_admin',
      bio: 'Welcome to LinkUp! I\'m here to help you get started.',
      isVerified: true,
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isOnline: false,
      joinedDate: serverTimestamp(),
      lastActive: serverTimestamp(),
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
    })

    // Create welcome post
    console.log('📄 Creating welcome post...')
    await setDoc(doc(db, 'posts', 'welcome-post'), {
      authorId: 'admin-sample',
      content: 'Welcome to LinkUp! 🎉\n\nConnect with friends, share your moments, and build meaningful relationships in our vibrant community.\n\n#Welcome #LinkUp #SocialMedia',
      type: 'text',
      visibility: 'public',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Create analytics collection structure
    console.log('📊 Setting up analytics structure...')
    await setDoc(doc(db, 'analytics', 'daily-stats'), {
      date: new Date().toISOString().split('T')[0],
      activeUsers: 0,
      newUsers: 0,
      postsCreated: 0,
      messagesExchanged: 0,
      storiesViewed: 0,
      createdAt: serverTimestamp()
    })

    // Create bulk notifications template
    console.log('📢 Creating notification templates...')
    await setDoc(doc(db, 'bulkNotifications', 'welcome-template'), {
      title: 'Welcome to LinkUp!',
      message: 'Thanks for joining LinkUp! Start connecting with friends and sharing your moments.',
      type: 'welcome',
      isActive: true,
      createdAt: serverTimestamp()
    })

    console.log('\n✅ Database setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your Firebase App ID and Measurement ID in .env.local')
    console.log('2. Deploy Firestore rules: firebase deploy --only firestore:rules')
    console.log('3. Deploy Firestore indexes: firebase deploy --only firestore:indexes')
    console.log('4. Deploy Storage rules: firebase deploy --only storage:rules')
    console.log('5. Enable Authentication providers in Firebase Console')
    console.log('\n🎉 Your LinkUp social media platform is ready!')

  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})