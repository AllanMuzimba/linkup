#!/bin/bash

# Production Deployment Script for React Kubatana
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment for React Kubatana..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Install function dependencies
echo "📦 Installing function dependencies..."
cd functions
npm ci
cd ..

# Run tests (if they exist)
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Type check
echo "🔍 Running TypeScript checks..."
npx tsc --noEmit

# Build the application
echo "🏗️  Building application..."
npm run build

# Deploy security rules first
echo "🔒 Deploying security rules..."
firebase deploy --only firestore:rules,storage:rules

# Deploy Cloud Functions
echo "⚡ Deploying Cloud Functions..."
firebase deploy --only functions

# Deploy hosting
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

# Initialize database if needed
echo "🗄️  Checking database initialization..."
# You can add a check here to see if the database needs initialization

echo "✅ Deployment complete!"
echo "🌍 Your app is now live at: https://your-project-id.web.app"

# Show deployment info
firebase hosting:channel:list
