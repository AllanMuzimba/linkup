#!/usr/bin/env node

/**
 * Firebase Initialization Script for React Kubatana
 * This script helps you set up Firebase step by step
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Setup for React Kubatana');
console.log('=====================================\n');

// Check if Firebase CLI is available
function checkFirebaseCLI() {
  try {
    execSync('npx firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is available');
    return true;
  } catch (error) {
    console.log('❌ Firebase CLI not found');
    return false;
  }
}

// Login to Firebase
function loginToFirebase() {
  console.log('\n🔐 Step 1: Login to Firebase');
  console.log('This will open your browser to sign in to Firebase...');
  
  try {
    execSync('npx firebase login', { stdio: 'inherit' });
    console.log('✅ Successfully logged in to Firebase');
    return true;
  } catch (error) {
    console.log('❌ Failed to login to Firebase');
    return false;
  }
}

// Initialize Firebase project
function initFirebaseProject() {
  console.log('\n🚀 Step 2: Initialize Firebase Project');
  console.log('Follow the prompts to configure your Firebase project...\n');
  
  try {
    execSync('npx firebase init', { stdio: 'inherit' });
    console.log('✅ Firebase project initialized');
    return true;
  } catch (error) {
    console.log('❌ Failed to initialize Firebase project');
    return false;
  }
}

// Deploy security rules
function deploySecurityRules() {
  console.log('\n🔒 Step 3: Deploy Security Rules');
  
  try {
    execSync('npx firebase deploy --only firestore:rules,storage:rules', { stdio: 'inherit' });
    console.log('✅ Security rules deployed');
    return true;
  } catch (error) {
    console.log('❌ Failed to deploy security rules');
    return false;
  }
}

// Create environment file template
function createEnvTemplate() {
  console.log('\n📝 Step 4: Environment Configuration');
  
  const envTemplate = `# Firebase Configuration
# Replace these with your actual Firebase config values
# Get these from Firebase Console > Project Settings > General > Your apps

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK
# Get these from Firebase Console > Project Settings > Service accounts
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----\\n"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Kubatana Social
`;

  fs.writeFileSync('.env.local.template', envTemplate);
  console.log('✅ Created .env.local.template');
  console.log('📋 Please update .env.local with your actual Firebase configuration');
}

// Main setup function
async function setupFirebase() {
  console.log('Starting Firebase setup process...\n');
  
  // Step 1: Check Firebase CLI
  if (!checkFirebaseCLI()) {
    console.log('\n❌ Please install Firebase CLI first:');
    console.log('npm install -g firebase-tools');
    return;
  }
  
  // Step 2: Login
  if (!loginToFirebase()) {
    console.log('\n❌ Setup failed at login step');
    return;
  }
  
  // Step 3: Initialize project
  if (!initFirebaseProject()) {
    console.log('\n❌ Setup failed at initialization step');
    return;
  }
  
  // Step 4: Deploy rules
  if (!deploySecurityRules()) {
    console.log('\n⚠️  Security rules deployment failed - you can deploy them later');
  }
  
  // Step 5: Create env template
  createEnvTemplate();
  
  console.log('\n🎉 Firebase setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Update .env.local with your Firebase configuration');
  console.log('2. Enable Authentication providers in Firebase Console');
  console.log('3. Run: npm run dev');
  console.log('4. Test authentication at http://localhost:3000');
}

// Run setup
if (require.main === module) {
  setupFirebase().catch(console.error);
}

module.exports = { setupFirebase };
