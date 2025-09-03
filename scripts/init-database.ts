import { adminDb } from '@/lib/firebase-admin'

interface SystemSetting {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object'
  description: string
  category: 'general' | 'security' | 'features' | 'limits'
}

const initialSettings: SystemSetting[] = [
  // General settings
  {
    key: 'app_name',
    value: 'Kubatana Social',
    type: 'string',
    description: 'Application name displayed to users',
    category: 'general'
  },
  {
    key: 'app_description',
    value: 'A modern social media platform for connecting and sharing',
    type: 'string',
    description: 'Application description for SEO and about pages',
    category: 'general'
  },
  {
    key: 'maintenance_mode',
    value: false,
    type: 'boolean',
    description: 'Enable maintenance mode to restrict access',
    category: 'general'
  },

  // Feature flags
  {
    key: 'enable_registration',
    value: true,
    type: 'boolean',
    description: 'Allow new user registrations',
    category: 'features'
  },
  {
    key: 'enable_stories',
    value: true,
    type: 'boolean',
    description: 'Enable stories feature',
    category: 'features'
  },
  {
    key: 'enable_video_calls',
    value: true,
    type: 'boolean',
    description: 'Enable video calling feature',
    category: 'features'
  },
  {
    key: 'enable_voice_messages',
    value: true,
    type: 'boolean',
    description: 'Enable voice message feature',
    category: 'features'
  },
  {
    key: 'enable_file_sharing',
    value: true,
    type: 'boolean',
    description: 'Enable file sharing in chats',
    category: 'features'
  },

  // Security settings
  {
    key: 'max_login_attempts',
    value: 5,
    type: 'number',
    description: 'Maximum login attempts before account lockout',
    category: 'security'
  },
  {
    key: 'session_timeout',
    value: 86400000, // 24 hours in milliseconds
    type: 'number',
    description: 'Session timeout duration in milliseconds',
    category: 'security'
  },
  {
    key: 'require_email_verification',
    value: true,
    type: 'boolean',
    description: 'Require email verification for new accounts',
    category: 'security'
  },

  // Content limits
  {
    key: 'max_post_length',
    value: 2000,
    type: 'number',
    description: 'Maximum characters allowed in a post',
    category: 'limits'
  },
  {
    key: 'max_comment_length',
    value: 500,
    type: 'number',
    description: 'Maximum characters allowed in a comment',
    category: 'limits'
  },
  {
    key: 'max_posts_per_hour',
    value: 10,
    type: 'number',
    description: 'Maximum posts a user can create per hour',
    category: 'limits'
  },
  {
    key: 'max_messages_per_minute',
    value: 30,
    type: 'number',
    description: 'Maximum messages a user can send per minute',
    category: 'limits'
  },
  {
    key: 'max_friend_requests_per_day',
    value: 50,
    type: 'number',
    description: 'Maximum friend requests a user can send per day',
    category: 'limits'
  },

  // File upload limits (in bytes)
  {
    key: 'max_file_size_image',
    value: 5242880, // 5MB
    type: 'number',
    description: 'Maximum file size for image uploads in bytes',
    category: 'limits'
  },
  {
    key: 'max_file_size_video',
    value: 52428800, // 50MB
    type: 'number',
    description: 'Maximum file size for video uploads in bytes',
    category: 'limits'
  },
  {
    key: 'max_file_size_audio',
    value: 10485760, // 10MB
    type: 'number',
    description: 'Maximum file size for audio uploads in bytes',
    category: 'limits'
  },
  {
    key: 'max_file_size_document',
    value: 10485760, // 10MB
    type: 'number',
    description: 'Maximum file size for document uploads in bytes',
    category: 'limits'
  }
]

export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...')

    // Create system settings
    console.log('📝 Creating system settings...')
    const batch = adminDb.batch()
    
    for (const setting of initialSettings) {
      const settingRef = adminDb.collection('systemSettings').doc()
      batch.set(settingRef, {
        ...setting,
        updatedAt: new Date(),
        updatedBy: 'system'
      })
    }

    await batch.commit()
    console.log(`✅ Created ${initialSettings.length} system settings`)

    // Create initial analytics document
    console.log('📊 Creating initial analytics...')
    const today = new Date().toISOString().split('T')[0]
    await adminDb.collection('analytics').doc(today).set({
      date: today,
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      totalPosts: 0,
      newPosts: 0,
      totalComments: 0,
      newComments: 0,
      totalLikes: 0,
      totalShares: 0,
      totalViews: 0,
      totalMessages: 0,
      activeChats: 0,
      totalReports: 0,
      resolvedReports: 0,
      updatedAt: new Date()
    })

    console.log('✅ Database initialization complete!')
    return { success: true }

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
