# Fixing Firebase "auth/unauthorized-domain" Error

## Problem
You're seeing this error in your browser console:
```
Error: Firebase: Error (auth/unauthorized-domain).
```

This happens when Firebase Authentication blocks sign-in attempts from domains that aren't explicitly authorized.

## Root Cause
Your application is running on a domain (likely `localhost:3000`) that hasn't been added to the authorized domains list in Firebase Console.

## Solution

### Step 1: Add Authorized Domains in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`linkup-fe1c3`)
3. Navigate to **Authentication** > **Settings** tab
4. Scroll down to the **Authorized domains** section
5. Click **Add domain** and add these domains:
   - `localhost`
   - `localhost:3000` (or whatever port you're using)
   - `127.0.0.1`
   - `127.0.0.1:3000` (or whatever port you're using)
   - Any other domains you use for development

### Step 2: Verify Your Environment Configuration

Make sure your `.env.local` file has the correct Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB6Jana9WISBxdzpB8dHGy2bK638jeKVWE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=linkup-fe1c3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=linkup-fe1c3
```

### Step 3: Restart Your Development Server

After making these changes:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Additional Notes

- For production deployment, you'll need to add your production domain(s) to the authorized domains list as well
- The authorized domains list is a security feature to prevent other websites from using your Firebase project
- Never add wildcard domains (like `*.example.com`) unless absolutely necessary

## Testing the Fix

After adding the authorized domains:
1. Refresh your application
2. Try signing in with Google again
3. The error should no longer appear

If you continue to experience issues:
1. Check that you're using the correct Firebase project configuration
2. Ensure you haven't exceeded the authorized domain limit
3. Verify that your Firebase Authentication providers are properly configured