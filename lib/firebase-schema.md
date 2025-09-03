# Firebase Database Schema for LinkUp Social Media Platform

## Overview
This document outlines the complete Firestore database schema for a production-level social media platform based on the React Kubatana project.

## Collections Structure

### 1. Users Collection (`users`)
```typescript
interface User {
  id: string                    // Document ID (Firebase Auth UID)
  email: string
  name: string
  username: string              // Unique username
  role: "super_admin" | "developer" | "level_admin" | "user"
  avatar?: string              // Storage URL
  coverImage?: string          // Storage URL
  phone?: string
  bio?: string
  location?: string
  website?: string
  birthDate?: Timestamp
  joinedDate: Timestamp
  lastActive: Timestamp
  isOnline: boolean
  isVerified: boolean
  isPrivate: boolean
  
  // Counts (updated via Cloud Functions)
  followersCount: number
  followingCount: number
  postsCount: number
  
  // Settings
  settings: {
    notifications: {
      emailNotifications: boolean
      pushNotifications: boolean
      smsNotifications: boolean
      marketingEmails: boolean
      friendRequests: boolean
      postLikes: boolean
      comments: boolean
      mentions: boolean
    }
    privacy: {
      profileVisibility: "public" | "friends" | "private"
      showEmail: boolean
      showPhone: boolean
      allowFriendRequests: boolean
      allowMessages: boolean
      showOnlineStatus: boolean
    }
  }
  
  // Social Links
  socialLinks?: {
    twitter?: string
    instagram?: string
    linkedin?: string
    facebook?: string
  }
  
  // Admin specific fields
  isActive?: boolean           // For admin users
  reportsCount?: number        // For admin users
}
```

### 2. Posts Collection (`posts`)
```typescript
interface Post {
  id: string                   // Document ID
  authorId: string            // Reference to users collection
  content: string
  images?: string[]           // Array of Storage URLs
  video?: string              // Storage URL
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Engagement counts (updated via Cloud Functions)
  likesCount: number
  commentsCount: number
  sharesCount: number
  
  // Settings
  visibility: "public" | "friends" | "private"
  tags?: string[]
  location?: string
  
  // Moderation
  isReported: boolean
  reportCount: number
  isHidden: boolean
  moderationStatus: "approved" | "pending" | "rejected"
}
```

### 3. Comments Collection (`comments`)
```typescript
interface Comment {
  id: string                   // Document ID
  postId: string              // Reference to posts collection
  authorId: string            // Reference to users collection
  content: string
  createdAt: Timestamp
  
  // Engagement
  likesCount: number
  
  // Threading
  parentCommentId?: string    // For replies
  replyCount: number
  
  // Moderation
  isReported: boolean
  isHidden: boolean
}
```

### 4. Stories Collection (`stories`)
```typescript
interface Story {
  id: string                   // Document ID
  authorId: string            // Reference to users collection
  content: string
  image?: string              // Storage URL
  video?: string              // Storage URL
  backgroundColor?: string
  createdAt: Timestamp
  expiresAt: Timestamp        // 24 hours from creation

  // Engagement
  viewsCount: number

  // Viewers tracking (subcollection)
  // viewers/{userId} with { viewedAt: Timestamp }
}
```

### 5. Chats Collection (`chats`)
```typescript
interface Chat {
  id: string                   // Document ID
  type: "direct" | "group"
  name?: string               // For group chats
  avatar?: string             // Storage URL for group chats
  createdAt: Timestamp
  updatedAt: Timestamp

  // Participants
  participantIds: string[]    // Array of user IDs
  participants: {
    [userId: string]: {
      name: string
      avatar?: string
      role: "admin" | "member"
      joinedAt: Timestamp
      lastReadAt?: Timestamp
    }
  }

  // Last message info
  lastMessage?: {
    id: string
    senderId: string
    content: string
    type: "text" | "image" | "file" | "audio" | "video" | "document" | "system" | "call"
    timestamp: Timestamp
  }

  // Typing indicators
  typingUsers: string[]       // Array of user IDs currently typing

  // Group settings
  settings?: {
    allowMembersToAddOthers: boolean
    allowMembersToEditInfo: boolean
    onlyAdminsCanMessage: boolean
  }
}
```

### 6. Messages Collection (`messages`)
```typescript
interface Message {
  id: string                   // Document ID
  chatId: string              // Reference to chats collection
  senderId: string            // Reference to users collection
  content: string
  type: "text" | "image" | "file" | "audio" | "video" | "document" | "system" | "call"
  timestamp: Timestamp

  // Read status
  readBy: {
    [userId: string]: Timestamp
  }

  // File attachments
  attachments?: {
    id: string
    name: string
    type: "image" | "video" | "audio" | "document"
    size: number
    url: string                // Storage URL
    mimeType: string
    duration?: number          // For audio/video
    thumbnail?: string         // Storage URL for video thumbnails
  }[]

  // Reply functionality
  replyTo?: {
    messageId: string
    content: string
    senderId: string
  }

  // Call data
  callData?: {
    type: "audio" | "video"
    duration?: number
    status: "missed" | "completed" | "declined" | "ongoing"
    participants: string[]
  }

  // Message status
  isEdited: boolean
  editedAt?: Timestamp
  isDeleted: boolean
  deletedAt?: Timestamp
}
```

### 7. Friend Requests Collection (`friendRequests`)
```typescript
interface FriendRequest {
  id: string                   // Document ID
  fromUserId: string          // Reference to users collection
  toUserId: string            // Reference to users collection
  message?: string
  status: "pending" | "accepted" | "declined"
  createdAt: Timestamp
  respondedAt?: Timestamp
}
```

### 8. Friendships Collection (`friendships`)
```typescript
interface Friendship {
  id: string                   // Document ID (combination of user IDs)
  user1Id: string             // Reference to users collection
  user2Id: string             // Reference to users collection
  createdAt: Timestamp
  status: "active" | "blocked"
  blockedBy?: string          // User ID who blocked
}
```

### 9. Notifications Collection (`notifications`)
```typescript
interface Notification {
  id: string                   // Document ID
  userId: string              // Reference to users collection
  type: "like" | "comment" | "follow" | "friend_request" | "message" | "system" | "bulk"
  title: string
  message: string
  isRead: boolean
  createdAt: Timestamp

  // Related data
  relatedId?: string          // ID of related post, user, etc.
  relatedType?: "post" | "comment" | "user" | "chat"

  // Action data
  actionUrl?: string          // Deep link to relevant content

  // Bulk notification specific
  isBulk?: boolean
  bulkNotificationId?: string
}
```

### 10. Bulk Notifications Collection (`bulkNotifications`)
```typescript
interface BulkNotification {
  id: string                   // Document ID
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  targetAudience: "all" | "admins" | "users" | "specific"
  targetUserIds?: string[]    // For specific targeting

  // Scheduling
  scheduledFor?: Timestamp
  sentAt?: Timestamp

  // Sender info
  sentBy: {
    id: string
    name: string
  }

  // Status
  status: "draft" | "scheduled" | "sent" | "failed"

  // Analytics
  recipientCount: number
  readCount: number

  createdAt: Timestamp
}
```

### 11. Likes Collection (`likes`)
```typescript
interface Like {
  id: string                   // Document ID (combination of userId and postId)
  userId: string              // Reference to users collection
  postId: string              // Reference to posts collection
  createdAt: Timestamp
}
```

### 12. Follows Collection (`follows`)
```typescript
interface Follow {
  id: string                   // Document ID (combination of follower and following)
  followerId: string          // Reference to users collection
  followingId: string         // Reference to users collection
  createdAt: Timestamp
}
```

### 13. Reports Collection (`reports`)
```typescript
interface Report {
  id: string                   // Document ID
  reporterId: string          // Reference to users collection
  reportedUserId?: string     // Reference to users collection
  reportedPostId?: string     // Reference to posts collection
  reportedCommentId?: string  // Reference to comments collection
  type: "user" | "post" | "comment" | "message"
  reason: "spam" | "harassment" | "inappropriate" | "fake" | "violence" | "other"
  description?: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  createdAt: Timestamp
  reviewedAt?: Timestamp
  reviewedBy?: string         // Admin user ID
  resolution?: string
}
```

### 14. Analytics Collection (`analytics`)
```typescript
interface Analytics {
  id: string                   // Document ID (date-based)
  date: string                // YYYY-MM-DD format

  // User metrics
  totalUsers: number
  activeUsers: number
  newUsers: number

  // Content metrics
  totalPosts: number
  newPosts: number
  totalComments: number
  newComments: number

  // Engagement metrics
  totalLikes: number
  totalShares: number
  totalViews: number

  // Chat metrics
  totalMessages: number
  activeChats: number

  // System metrics
  totalReports: number
  resolvedReports: number

  updatedAt: Timestamp
}
```

### 15. System Settings Collection (`systemSettings`)
```typescript
interface SystemSettings {
  id: string                   // Document ID
  key: string                 // Setting key
  value: any                  // Setting value
  type: "string" | "number" | "boolean" | "object"
  description: string
  category: "general" | "security" | "features" | "limits"
  updatedAt: Timestamp
  updatedBy: string           // Admin user ID
}
```

## Subcollections

### Message Reactions (`messages/{messageId}/reactions`)
```typescript
interface MessageReaction {
  id: string                   // Document ID
  userId: string              // Reference to users collection
  emoji: string               // Emoji character
  createdAt: Timestamp
}
```

### Story Views (`stories/{storyId}/views`)
```typescript
interface StoryView {
  id: string                   // Document ID (userId)
  userId: string              // Reference to users collection
  viewedAt: Timestamp
}
```

### Post Shares (`posts/{postId}/shares`)
```typescript
interface PostShare {
  id: string                   // Document ID
  userId: string              // Reference to users collection
  sharedAt: Timestamp
  platform?: string           // External platform if shared outside app
}
```

## Firebase Security Rules

### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update: if request.auth != null &&
        (request.auth.uid == resource.data.authorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'level_admin']);
      allow delete: if request.auth != null &&
        (request.auth.uid == resource.data.authorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'level_admin']);
    }

    // Comments collection
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow delete: if request.auth != null &&
        (request.auth.uid == resource.data.authorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'level_admin']);
    }

    // Chats collection
    match /chats/{chatId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.participantIds;
      allow create: if request.auth != null && request.auth.uid in resource.data.participantIds;
      allow update: if request.auth != null && request.auth.uid in resource.data.participantIds;
    }

    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participantIds;
      allow create: if request.auth != null &&
        request.auth.uid == resource.data.senderId &&
        request.auth.uid in get(/databases/$(database)/documents/chats/$(resource.data.chatId)).data.participantIds;
      allow update: if request.auth != null && request.auth.uid == resource.data.senderId;
    }

    // Admin only collections
    match /reports/{reportId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'level_admin'];
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'level_admin'];
    }

    match /analytics/{analyticsId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'level_admin'];
      allow write: if false; // Only Cloud Functions can write analytics
    }

    match /systemSettings/{settingId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin'];
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin'];
    }
  }
}
```
```
```
