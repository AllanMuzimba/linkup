# 🔐 Enable Firebase Authentication

## Step 1: Enable Authentication Providers

### Go to Firebase Console:
https://console.firebase.google.com/project/linkup-fe1c3/authentication/providers

### Enable These Sign-in Methods:

#### 1. Email/Password
- Click "Email/Password"
- Toggle "Enable" → ON
- Click "Save"

#### 2. Google Sign-in
- Click "Google"
- Toggle "Enable" → ON
- **Project support email**: Select your email from dropdown
- Click "Save"

#### 3. Optional: Other Providers
- Facebook (if you want)
- Twitter (if you want)
- GitHub (if you want)

## Step 2: Configure Google OAuth (Important!)

### For Google Sign-in to work properly:
1. Go to: https://console.cloud.google.com/apis/credentials?project=linkup-fe1c3
2. You should see an OAuth 2.0 client ID created automatically
3. Click on the client ID to edit it
4. Add these to "Authorized JavaScript origins":
   - `http://localhost:3002`
   - `http://localhost:3000`
   - `https://linkup-fe1c3.firebaseapp.com`
5. Add these to "Authorized redirect URIs":
   - `http://localhost:3002/__/auth/handler`
   - `http://localhost:3000/__/auth/handler`
   - `https://linkup-fe1c3.firebaseapp.com/__/auth/handler`
6. Click "Save"

## ✅ Verification
After enabling, you should see:
- ✅ Email/Password: Enabled
- ✅ Google: Enabled
- ✅ Other providers: As desired

This will allow users to:
- Register/login with email and password
- Sign in with Google account
- Have persistent login sessions