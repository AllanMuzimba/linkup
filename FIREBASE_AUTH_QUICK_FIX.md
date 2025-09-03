# 🔥 Quick Fix: Firebase Authentication Configuration

## The Error You're Seeing:
`Firebase: Error (auth/configuration-not-found)` means Firebase Authentication isn't enabled yet.

## ⚡ Quick Fix (2 minutes):

### Step 1: Enable Authentication
1. **Go to**: https://console.firebase.google.com/project/linkup-fe1c3/authentication/providers
2. **Click "Get started"** if you see it
3. **Enable Email/Password**:
   - Click "Email/Password"
   - Toggle "Enable" → ON
   - Click "Save"
4. **Enable Google**:
   - Click "Google" 
   - Toggle "Enable" → ON
   - Select your email from "Project support email" dropdown
   - Click "Save"

### Step 2: Test Again
- Go back to http://localhost:3002
- Try Google login again
- Try manual signup/login

This will fix the `auth/configuration-not-found` error immediately!