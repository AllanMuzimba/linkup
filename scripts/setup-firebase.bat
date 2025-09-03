@echo off
echo.
echo ========================================
echo 🔥 Firebase Setup for React Kubatana
echo ========================================
echo.

echo 📋 Step 1: Check Firebase CLI
npx firebase --version
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

echo.
echo 🔐 Step 2: Login to Firebase
echo This will open your browser...
npx firebase login

echo.
echo 🚀 Step 3: Initialize Firebase Project
echo Follow the prompts to configure your project
npx firebase init

echo.
echo 🔒 Step 4: Deploy Security Rules
npx firebase deploy --only firestore:rules,storage:rules

echo.
echo ✅ Firebase setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env.local with your Firebase configuration
echo 2. Enable Authentication providers in Firebase Console
echo 3. Run: npm run dev
echo 4. Test at http://localhost:3000
echo.
pause
