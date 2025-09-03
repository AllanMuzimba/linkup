"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Shield, 
  Clock,
  Database,
  Key,
  Globe
} from "lucide-react"

export function AuthTest() {
  const { user, logout } = useAuth()
  const [testResults, setTestResults] = useState<any>({})
  const [isRunning, setIsRunning] = useState(false)

  const runAuthTests = async () => {
    setIsRunning(true)
    const results: any = {}

    try {
      // Test 1: User Authentication Status
      results.userAuth = {
        status: user ? 'success' : 'failed',
        message: user ? 'User is authenticated' : 'User not authenticated',
        data: user ? { id: user.id, email: user.email, role: user.role } : null
      }

      // Test 2: Firebase Connection
      try {
        const { auth } = await import('@/lib/firebase')
        results.firebaseConnection = {
          status: auth ? 'success' : 'failed',
          message: auth ? 'Firebase Auth initialized' : 'Firebase Auth not initialized'
        }
      } catch (error) {
        results.firebaseConnection = {
          status: 'failed',
          message: 'Firebase import failed: ' + (error as Error).message
        }
      }

      // Test 3: Firestore Connection
      try {
        const { db } = await import('@/lib/firebase')
        results.firestoreConnection = {
          status: db ? 'success' : 'failed',
          message: db ? 'Firestore initialized' : 'Firestore not initialized'
        }
      } catch (error) {
        results.firestoreConnection = {
          status: 'failed',
          message: 'Firestore import failed: ' + (error as Error).message
        }
      }

      // Test 4: User Permissions
      if (user) {
        const { hasPermission } = useAuth()
        results.permissions = {
          status: 'success',
          message: 'Permission system working',
          data: {
            canCreatePosts: hasPermission('create_posts'),
            canManageUsers: hasPermission('manage_all_users'),
            canViewAnalytics: hasPermission('view_analytics'),
            isAdmin: hasPermission('admin_access')
          }
        }
      }

      // Test 5: Environment Variables
      const envVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
      ]
      
      const missingEnvVars = envVars.filter(varName => !process.env[varName])
      results.environment = {
        status: missingEnvVars.length === 0 ? 'success' : 'warning',
        message: missingEnvVars.length === 0 
          ? 'All required environment variables present'
          : `Missing environment variables: ${missingEnvVars.join(', ')}`,
        data: {
          total: envVars.length,
          missing: missingEnvVars.length,
          present: envVars.length - missingEnvVars.length
        }
      }

    } catch (error) {
      results.error = {
        status: 'failed',
        message: 'Test execution failed: ' + (error as Error).message
      }
    }

    setTestResults(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Firebase Authentication Test
          </CardTitle>
          <CardDescription>
            Test Firebase authentication integration and verify all components are working
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current User Info */}
          {user && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Current User
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{user.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2 font-medium">{user.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <Badge className="ml-2" variant={user.role === 'super_admin' ? 'destructive' : 'default'}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          )}

          {/* Test Controls */}
          <div className="flex gap-3">
            <Button 
              onClick={runAuthTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Run Authentication Tests
                </>
              )}
            </Button>
            
            {user && (
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            )}
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Test Results</h3>
              
              {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                <div key={testName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize flex items-center gap-2">
                      {testName === 'userAuth' && <User className="w-4 h-4" />}
                      {testName === 'firebaseConnection' && <Key className="w-4 h-4" />}
                      {testName === 'firestoreConnection' && <Database className="w-4 h-4" />}
                      {testName === 'permissions' && <Shield className="w-4 h-4" />}
                      {testName === 'environment' && <Globe className="w-4 h-4" />}
                      {testName.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </h4>
                    {getStatusIcon(result.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                  
                  {result.data && (
                    <div className="text-xs bg-muted/30 p-3 rounded border">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Firebase Setup Instructions:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Create a Firebase project at <a href="https://console.firebase.google.com" className="text-primary hover:underline" target="_blank">Firebase Console</a></li>
                <li>Enable Authentication with Email/Password and Google providers</li>
                <li>Create a Firestore database</li>
                <li>Copy your config to <code className="bg-muted px-1 rounded">.env.local</code></li>
                <li>Deploy security rules using <code className="bg-muted px-1 rounded">npm run firebase:deploy:rules</code></li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
