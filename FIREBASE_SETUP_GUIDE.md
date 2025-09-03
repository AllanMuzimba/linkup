# 🔥 Complete Firebase Setup Guide for React Kubatana

## Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click **"Create a project"**

### 1.2 Project Configuration
1. **Project name**: `kubatana-social` (or your preferred name)
2. **Enable Google Analytics**: ✅ Yes (recommended)
3. **Analytics account**: Choose existing or create new
4. Click **"Create project"**

## Step 2: Enable Authentication

### 2.1 Set up Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following providers:

#### Email/Password
- Click **"Email/Password"**
- Enable **"Email/Password"** ✅
- Enable **"Email link (passwordless sign-in)"** (optional)
- Click **"Save"**

#### Google
- Click **"Google"**
- Enable ✅
- Set **"Project support email"** to your email
- Click **"Save"**

#### Facebook (Optional)
- Click **"Facebook"**
- Enable ✅
- Add your **App ID** and **App secret** from Facebook Developers
- Click **"Save"**

#### Twitter (Optional)
- Click **"Twitter"**
- Enable ✅
- Add your **Consumer Key** and **Consumer Secret** from Twitter Developer Portal
- Click **"Save"**

## Step 3: Set up Firestore Database

### 3.1 Create Database
1. Go to **Firestore Database**
2. Click **"Create database"**
3. **Security rules**: Start in **test mode** (we'll deploy proper rules later)
4. **Location**: Choose closest to your users (e.g., us-central1)
5. Click **"Done"**

### 3.2 Database Structure
The database will be automatically structured when users start using the app:
- `users` - User profiles and settings
- `posts` - Social media posts
- `chats` - Chat conversations
- `messages` - Chat messages
- `notifications` - User notifications
- And more collections as defined in our schema

## Step 4: Set up Storage

### 4.1 Enable Storage
1. Go to **Storage**
2. Click **"Get started"**
3. **Security rules**: Start in **test mode**
4. **Location**: Same as Firestore
5. Click **"Done"**

### 4.2 Storage Structure
Files will be organized as:
```
/users/{userId}/avatar_*.jpg
/users/{userId}/cover_*.jpg
/posts/{postId}/*.jpg
/chats/{chatId}/attachments/*.*
/stories/{storyId}/*.*
```

## Step 5: Get Configuration Keys

### 5.1 Web App Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **"Add app"** > **Web app** (</> icon)
4. **App nickname**: `kubatana-web`
5. **Enable Firebase Hosting**: ✅ Yes
6. Click **"Register app"**
7. **Copy the configuration object** - you'll need this!

### 5.2 Service Account (for Admin SDK)
1. Go to **Project Settings** > **Service accounts**
2. Click **"Generate new private key"**
3. **Download the JSON file** - keep it secure!
4. You'll use this for server-side operations

## Step 6: Configure Your Project

### 6.1 Update Environment Variables
Replace the content in `.env.local` with your actual Firebase config:

```env
# Firebase Configuration (Replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kubatana-social.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kubatana-social
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kubatana-social.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# Firebase Admin SDK (from service account JSON)
FIREBASE_ADMIN_PROJECT_ID=kubatana-social
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@kubatana-social.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----\n"
```

### 6.2 Security Rules Deployment
Once Firebase CLI is installed, deploy the security rules:
```bash
npx firebase login
npx firebase init
npx firebase deploy --only firestore:rules,storage:rules
```

## Step 7: Test Your Setup

### 7.1 Start Development Server
```bash
npm run dev
```

### 7.2 Test Authentication Features
1. **Registration**: Create a new account
2. **Email Verification**: Check your email and verify
3. **Login**: Sign in with your credentials
4. **Social Login**: Test Google authentication
5. **Password Reset**: Test forgot password flow
6. **Profile Management**: Update your profile
7. **File Upload**: Upload a profile picture

## Step 8: Production Deployment

### 8.1 Deploy to Firebase Hosting
```bash
npm run build
npx firebase deploy
```

### 8.2 Configure Custom Domain (Optional)
1. Go to **Hosting** in Firebase Console
2. Click **"Add custom domain"**
3. Follow the DNS configuration steps

## 🔧 **Troubleshooting**

### Common Issues:
1. **"Invalid API Key"** - Check your environment variables
2. **"Permission Denied"** - Deploy security rules first
3. **"Social Login Failed"** - Configure OAuth providers properly
4. **"Build Errors"** - Ensure all environment variables are set

### Debug Tools:
- Use the `AuthTest` component at `/auth-test`
- Check browser console for Firebase errors
- Verify network requests in DevTools

## 🎉 **You're Ready!**

Once you complete these steps, your React Kubatana platform will have:
- ✅ **Professional authentication system**
- ✅ **Real-time user management**
- ✅ **Secure file uploads**
- ✅ **Role-based permissions**
- ✅ **Production-ready deployment**

Your social media platform will be ready for real users! 🚀
