# Firebase Setup Guide for React Kubatana

## Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google account for Firebase Console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `kubatana-social` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Choose or create Analytics account

## Step 2: Enable Firebase Services

### Authentication
1. Go to Authentication > Sign-in method
2. Enable the following providers:
   - Email/Password
   - Google (recommended)
   - Facebook (optional)
   - Twitter (optional)

### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll deploy security rules later)
4. Select a location (choose closest to your users)

### Storage
1. Go to Storage
2. Click "Get started"
3. Choose "Start in test mode"
4. Select same location as Firestore

### Analytics
1. Go to Analytics
2. Enable if not already enabled during project creation

## Step 3: Get Configuration Keys

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > Web app
4. Register app with nickname: "kubatana-web"
5. Copy the configuration object

## Step 4: Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your Firebase configuration in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Step 5: Service Account Setup (for Admin SDK)

1. Go to Project Settings > Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Add the following to your `.env.local`:
```env
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

## Step 6: Deploy Security Rules

1. Login to Firebase CLI:
```bash
firebase login
```

2. Initialize Firebase in your project:
```bash
firebase init
```
Select:
- Firestore
- Storage
- Functions
- Hosting

3. Deploy security rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Step 7: Deploy Cloud Functions

1. Navigate to functions directory:
```bash
cd functions
npm install
```

2. Deploy functions:
```bash
firebase deploy --only functions
```

## Step 8: Create Initial Data

Run this script to create initial system settings and admin user:

```javascript
// scripts/setup-initial-data.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupInitialData() {
  // Create system settings
  const settings = [
    { key: 'app_name', value: 'Kubatana Social', type: 'string', category: 'general' },
    { key: 'max_file_size', value: 52428800, type: 'number', category: 'limits' },
    { key: 'enable_registration', value: true, type: 'boolean', category: 'features' }
  ];
  
  for (const setting of settings) {
    await db.collection('systemSettings').add({
      ...setting,
      description: `System setting for ${setting.key}`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system'
    });
  }
  
  console.log('Initial data setup complete!');
}

setupInitialData().catch(console.error);
```

## Step 9: Production Deployment

### Build and Deploy
```bash
# Build the Next.js app for static export
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy everything (rules, functions, hosting)
firebase deploy
```

### Environment Variables for Production
Set these in your production environment:
- All `NEXT_PUBLIC_*` variables from `.env.local`
- Firebase Admin SDK credentials
- Any third-party API keys

### Performance Optimization
1. **Enable Firestore offline persistence**
2. **Set up CDN for static assets**
3. **Configure caching headers**
4. **Enable compression**
5. **Set up monitoring and alerts**

### Security Checklist
- [ ] Security rules deployed and tested
- [ ] Service account keys secured
- [ ] Environment variables properly set
- [ ] CORS configured for your domain
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] File upload restrictions enforced

### Monitoring Setup
1. **Firebase Performance Monitoring**
2. **Firebase Crashlytics**
3. **Google Analytics**
4. **Custom analytics dashboard**

## Step 10: Testing

### Local Testing with Emulators
```bash
# Start Firebase emulators
firebase emulators:start

# Run your app against emulators
npm run dev
```

### Production Testing
1. Test all authentication flows
2. Test file uploads and downloads
3. Test real-time messaging
4. Test notifications
5. Test admin functions
6. Load test with multiple users

## Database Schema Summary

The complete schema includes:
- **15 main collections** (users, posts, comments, stories, chats, messages, etc.)
- **3 subcollections** (reactions, views, shares)
- **Comprehensive security rules**
- **Optimized indexes** for performance
- **Cloud Functions** for automation
- **File storage** with proper organization

## Production Considerations

### Scaling
- **Firestore**: Automatically scales, but watch for hot spots
- **Storage**: Use CDN for frequently accessed files
- **Functions**: Monitor cold starts and execution time
- **Auth**: Consider custom claims for role management

### Cost Optimization
- **Implement pagination** for large datasets
- **Use composite indexes** efficiently
- **Optimize file storage** with compression
- **Monitor usage** with Firebase Analytics

### Backup Strategy
- **Enable automatic backups** for Firestore
- **Regular exports** of critical data
- **Version control** for security rules
- **Disaster recovery plan**

This setup provides a robust, scalable foundation for your social media platform with proper security, performance optimization, and production-ready features.
