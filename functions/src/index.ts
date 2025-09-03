import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
admin.initializeApp()
const db = admin.firestore()

// Update user counts when posts are created/deleted
export const updatePostCounts = functions.firestore
  .document('posts/{postId}')
  .onWrite(async (change, context) => {
    const postId = context.params.postId
    const before = change.before.exists ? change.before.data() : null
    const after = change.after.exists ? change.after.data() : null
    
    if (!before && after) {
      // Post created
      const authorRef = db.collection('users').doc(after.authorId)
      await authorRef.update({
        postsCount: admin.firestore.FieldValue.increment(1)
      })
    } else if (before && !after) {
      // Post deleted
      const authorRef = db.collection('users').doc(before.authorId)
      await authorRef.update({
        postsCount: admin.firestore.FieldValue.increment(-1)
      })
    }
  })

// Update comment counts when comments are created/deleted
export const updateCommentCounts = functions.firestore
  .document('comments/{commentId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null
    const after = change.after.exists ? change.after.data() : null
    
    if (!before && after) {
      // Comment created
      const postRef = db.collection('posts').doc(after.postId)
      await postRef.update({
        commentsCount: admin.firestore.FieldValue.increment(1)
      })
      
      // Create notification for post author
      const postDoc = await postRef.get()
      if (postDoc.exists) {
        const postData = postDoc.data()!
        if (postData.authorId !== after.authorId) {
          await db.collection('notifications').add({
            userId: postData.authorId,
            type: 'comment',
            title: 'New Comment',
            message: `Someone commented on your post`,
            isRead: false,
            relatedId: after.postId,
            relatedType: 'post',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        }
      }
    } else if (before && !after) {
      // Comment deleted
      const postRef = db.collection('posts').doc(before.postId)
      await postRef.update({
        commentsCount: admin.firestore.FieldValue.increment(-1)
      })
    }
  })

// Update follower counts when follows are created/deleted
export const updateFollowCounts = functions.firestore
  .document('follows/{followId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null
    const after = change.after.exists ? change.after.data() : null
    
    if (!before && after) {
      // Follow created
      const followerRef = db.collection('users').doc(after.followerId)
      const followingRef = db.collection('users').doc(after.followingId)
      
      await Promise.all([
        followingRef.update({
          followersCount: admin.firestore.FieldValue.increment(1)
        }),
        followerRef.update({
          followingCount: admin.firestore.FieldValue.increment(1)
        })
      ])
      
      // Create notification
      await db.collection('notifications').add({
        userId: after.followingId,
        type: 'follow',
        title: 'New Follower',
        message: `Someone started following you`,
        isRead: false,
        relatedId: after.followerId,
        relatedType: 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    } else if (before && !after) {
      // Follow deleted
      const followerRef = db.collection('users').doc(before.followerId)
      const followingRef = db.collection('users').doc(before.followingId)
      
      await Promise.all([
        followingRef.update({
          followersCount: admin.firestore.FieldValue.increment(-1)
        }),
        followerRef.update({
          followingCount: admin.firestore.FieldValue.increment(-1)
        })
      ])
    }
  })

// Clean up expired stories
export const cleanupExpiredStories = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now()
    const expiredStories = await db.collection('stories')
      .where('expiresAt', '<=', now)
      .get()
    
    const batch = db.batch()
    expiredStories.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    console.log(`Cleaned up ${expiredStories.size} expired stories`)
  })

// Generate daily analytics
export const generateDailyAnalytics = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Get counts for yesterday
    const [users, posts, comments, messages] = await Promise.all([
      db.collection('users').get(),
      db.collection('posts').where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(yesterday))).get(),
      db.collection('comments').where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(yesterday))).get(),
      db.collection('messages').where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(yesterday))).get()
    ])
    
    await db.collection('analytics').doc(yesterday).set({
      date: yesterday,
      totalUsers: users.size,
      newUsers: users.docs.filter(doc => {
        const userData = doc.data()
        const joinedDate = userData.joinedDate?.toDate()
        return joinedDate && joinedDate.toISOString().split('T')[0] === yesterday
      }).length,
      newPosts: posts.size,
      newComments: comments.size,
      totalMessages: messages.size,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  })

// Send bulk notifications
export const sendBulkNotification = functions.firestore
  .document('bulkNotifications/{bulkId}')
  .onCreate(async (snap, context) => {
    const bulkData = snap.data()
    
    if (bulkData.status !== 'scheduled' && bulkData.status !== 'draft') {
      return
    }
    
    let targetUsers: string[] = []
    
    if (bulkData.targetAudience === 'all') {
      const usersSnapshot = await db.collection('users').get()
      targetUsers = usersSnapshot.docs.map(doc => doc.id)
    } else if (bulkData.targetAudience === 'specific' && bulkData.targetUserIds) {
      targetUsers = bulkData.targetUserIds
    }
    
    // Create individual notifications
    const batch = db.batch()
    targetUsers.forEach(userId => {
      const notificationRef = db.collection('notifications').doc()
      batch.set(notificationRef, {
        userId,
        type: 'bulk',
        title: bulkData.title,
        message: bulkData.message,
        isRead: false,
        bulkNotificationId: context.params.bulkId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    })
    
    await batch.commit()
    
    // Update bulk notification status
    await snap.ref.update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      recipientCount: targetUsers.length
    })
  })
