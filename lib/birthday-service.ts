import { db, auth } from './firebase'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { UserService, NotificationService } from './realtime-services'

// Define types for better type safety
interface UserData {
  id: string;
  name?: string;
  avatar?: string;
  birthday?: string;
  [key: string]: any;
}

export class BirthdayService {
  // Check for birthdays today and send notifications
  static async checkTodaysBirthdays() {
    // Ensure Firebase is initialized and user is authenticated
    if (!db || !auth || !auth.currentUser) {
      console.log('Skipping birthday check - not authenticated')
      return
    }

    const today = new Date()
    const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    try {
      // Get all users with birthdays today
      const usersRef = collection(db, 'users')
      const allUsersSnapshot = await getDocs(usersRef)
      
      const birthdayUsers: UserData[] = []
      
      allUsersSnapshot.forEach((doc) => {
        const userData = doc.data() as UserData
        if (userData.birthday) {
          const userBirthday = new Date(userData.birthday)
          const userBirthdayString = `${String(userBirthday.getMonth() + 1).padStart(2, '0')}-${String(userBirthday.getDate()).padStart(2, '0')}`
          
          if (userBirthdayString === todayString && userData.birthdayWishes !== false) {
            birthdayUsers.push({
              ...userData,
              id: doc.id
            })
          }
        }
      })

      // Send birthday notifications for each birthday user
      for (const birthdayUser of birthdayUsers) {
        await this.sendBirthdayNotifications(birthdayUser)
      }

      return birthdayUsers
    } catch (error) {
      console.error('Error checking birthdays:', error)
      return []
    }
  }

  // Send birthday notifications to friends
  static async sendBirthdayNotifications(birthdayUser: UserData) {
    // Ensure Firebase is initialized and user is authenticated
    if (!db || !auth || !auth.currentUser) return

    try {
      // Get birthday user's friends
      const friendsQuery = query(
        collection(db, 'friendships'),
        where('status', '==', 'accepted'),
        where('users', 'array-contains', birthdayUser.id)
      )
      
      const friendsSnapshot = await getDocs(friendsQuery)
      const friendIds: string[] = []
      
      friendsSnapshot.forEach((doc) => {
        const friendship = doc.data()
        const otherUserId = friendship.users.find((id: string) => id !== birthdayUser.id)
        if (otherUserId) {
          friendIds.push(otherUserId)
        }
      })

      // Send birthday notification to each friend
      for (const friendId of friendIds) {
        await addDoc(collection(db, 'notifications'), {
          userId: friendId,
          type: 'birthday',
          title: `🎉 It's ${birthdayUser.name || 'User'}'s Birthday!`,
          message: `Wish ${birthdayUser.name || 'User'} a happy birthday today!`,
          data: {
            birthdayUserId: birthdayUser.id,
            birthdayUserName: birthdayUser.name,
            birthdayUserAvatar: birthdayUser.avatar
          },
          isRead: false,
          createdAt: serverTimestamp()
        })
      }

      // Send birthday wish to the birthday user
      await addDoc(collection(db, 'notifications'), {
        userId: birthdayUser.id,
        type: 'birthday_wish',
        title: '🎂 Happy Birthday!',
        message: `Happy Birthday ${birthdayUser.name || 'User'}! Hope you have a wonderful day filled with joy and celebration! 🎉`,
        data: {
          isSystemMessage: true
        },
        isRead: false,
        createdAt: serverTimestamp()
      })

      console.log(`Birthday notifications sent for ${birthdayUser.name}`)
    } catch (error) {
      console.error('Error sending birthday notifications:', error)
    }
  }

  // Get upcoming birthdays (next 7 days)
  static async getUpcomingBirthdays(userId: string) {
    // Ensure Firebase is initialized and user is authenticated
    if (!db || !auth || !auth.currentUser) return []

    try {
      // Get user's friends
      const friendsQuery = query(
        collection(db, 'friendships'),
        where('status', '==', 'accepted'),
        where('users', 'array-contains', userId)
      )
      
      const friendsSnapshot = await getDocs(friendsQuery)
      const friendIds: string[] = []
      
      friendsSnapshot.forEach((doc) => {
        const friendship = doc.data()
        const otherUserId = friendship.users.find((id: string) => id !== userId)
        if (otherUserId) {
          friendIds.push(otherUserId)
        }
      })

      // Get friends' birthdays
      const upcomingBirthdays: UserData[] = []
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      for (const friendId of friendIds) {
        const friendData = await UserService.getUserById(friendId) as UserData | null
        if (friendData?.birthday) {
          const birthday = new Date(friendData.birthday)
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
          
          if (thisYearBirthday >= today && thisYearBirthday <= nextWeek) {
            upcomingBirthdays.push({
              ...friendData,
              birthdayDate: thisYearBirthday,
              daysUntil: Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            })
          }
        }
      }

      return upcomingBirthdays.sort((a, b) => {
        const daysA = (a as any).daysUntil || 0
        const daysB = (b as any).daysUntil || 0
        return daysA - daysB
      })
    } catch (error) {
      console.error('Error getting upcoming birthdays:', error)
      return []
    }
  }

  // Send manual birthday wish
  static async sendBirthdayWish(fromUserId: string, toUserId: string, message?: string) {
    // Ensure Firebase is initialized and user is authenticated
    if (!db || !auth || !auth.currentUser) return false

    try {
      const fromUser = await UserService.getUserById(fromUserId) as UserData | null
      const defaultMessage = `🎉 Happy Birthday! Hope you have an amazing day! - ${fromUser?.name || 'User'}`
      
      await addDoc(collection(db, 'notifications'), {
        userId: toUserId,
        type: 'birthday_wish',
        title: '🎂 Birthday Wish',
        message: message || defaultMessage,
        data: {
          fromUserId,
          fromUserName: fromUser?.name,
          fromUserAvatar: fromUser?.avatar
        },
        isRead: false,
        createdAt: serverTimestamp()
      })

      return true
    } catch (error) {
      console.error('Error sending birthday wish:', error)
      return false
    }
  }

  // Initialize birthday checking (call this on app startup)
  static initializeBirthdayChecker() {
    // Check birthdays immediately
    setTimeout(() => {
      this.checkTodaysBirthdays()
    }, 5000) // Delay initialization to ensure auth is fully set up

    // Set up daily birthday check at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    // First check at next midnight
    setTimeout(() => {
      this.checkTodaysBirthdays()
      
      // Then check every 24 hours
      setInterval(() => {
        this.checkTodaysBirthdays()
      }, 24 * 60 * 60 * 1000)
    }, msUntilMidnight)

    console.log('Birthday checker initialized')
  }
}