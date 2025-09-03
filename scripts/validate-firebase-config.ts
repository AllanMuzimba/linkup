#!/usr/bin/env node

/**
 * Firebase Configuration Validator
 * 
 * This script validates that all required Firebase environment variables are set
 * and have valid formats.
 */

import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  config({ path: envPath })
} else {
  console.warn('⚠️  .env.local file not found. Checking environment variables...')
}

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY'
]

// Validate environment variables
const missingEnvVars: string[] = []
const invalidEnvVars: string[] = []

console.log('🔍 Validating Firebase Configuration...\n')

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  
  if (!value) {
    missingEnvVars.push(envVar)
    return
  }
  
  // Check for placeholder values
  if (value.includes('your-') || value.includes('demo-') || value.includes('xxxxx')) {
    invalidEnvVars.push(`${envVar} - Contains placeholder value`)
  }
  
  // Specific validations
  switch (envVar) {
    case 'NEXT_PUBLIC_FIREBASE_API_KEY':
      if (value.length < 20) {
        invalidEnvVars.push(`${envVar} - API key seems too short`)
      }
      break
    case 'NEXT_PUBLIC_FIREBASE_PROJECT_ID':
      if (!/^[a-z0-9-]+$/.test(value)) {
        invalidEnvVars.push(`${envVar} - Invalid project ID format`)
      }
      break
    case 'FIREBASE_ADMIN_CLIENT_EMAIL':
      if (!value.endsWith('.iam.gserviceaccount.com')) {
        invalidEnvVars.push(`${envVar} - Invalid service account email format`)
      }
      break
    case 'FIREBASE_ADMIN_PRIVATE_KEY':
      if (!value.startsWith('-----BEGIN PRIVATE KEY-----') || !value.endsWith('-----END PRIVATE KEY-----\n')) {
        invalidEnvVars.push(`${envVar} - Invalid private key format`)
      }
      break
  }
})

// Report results
if (missingEnvVars.length === 0 && invalidEnvVars.length === 0) {
  console.log('✅ All Firebase environment variables are properly configured!')
  process.exit(0)
}

if (missingEnvVars.length > 0) {
  console.error('❌ Missing environment variables:')
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`))
  console.log('')
}

if (invalidEnvVars.length > 0) {
  console.error('❌ Invalid environment variables:')
  invalidEnvVars.forEach(envVar => console.error(`   - ${envVar}`))
  console.log('')
}

console.log('📝 Please check your .env.local file and ensure all values are correctly set.')
console.log('📖 Refer to FIREBASE_SETUP_FIXED.md for detailed instructions.')
process.exit(1)