"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, RefreshCw, LogOut } from "lucide-react"
import { sendEmailVerification, reload } from "firebase/auth"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase"

export function EmailVerification() {
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const handleResendVerification = async () => {
    if (!auth.currentUser) return

    setError("")
    setIsLoading(true)

    try {
      await sendEmailVerification(auth.currentUser)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to send verification email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return

    setIsChecking(true)
    setError("")

    try {
      await reload(auth.currentUser)
      if (auth.currentUser.emailVerified) {
        // Refresh the page to update the user state
        window.location.reload()
      } else {
        setError("Email not verified yet. Please check your email and click the verification link.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to check verification status")
    } finally {
      setIsChecking(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    // Auto-check verification status every 30 seconds
    const interval = setInterval(async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        try {
          await reload(auth.currentUser)
          if (auth.currentUser.emailVerified) {
            window.location.reload()
          }
        } catch (error) {
          // Silently fail - user can manually check
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      
      <Card className="relative w-full max-w-md kubatana-shadow border-border/50 backdrop-blur-sm bg-card/80">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-2">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              Please verify your email address to continue using Kubatana
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <Mail className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Verification email sent to:
              </p>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                {user?.email}
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Click the link in the email to verify your account.</p>
              <p>If you don't see the email, check your spam folder.</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl border-destructive/50">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="rounded-xl border-green-500/50 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                Verification email sent successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              className="w-full h-12 rounded-xl kubatana-gradient hover:opacity-90 transition-opacity text-white font-semibold shadow-lg"
              disabled={isChecking}
            >
              {isChecking ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>I've Verified My Email</span>
                </div>
              )}
            </Button>
            
            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Resend Verification Email</span>
                </div>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-border/50">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>
              Having trouble? Contact{' '}
              <a href="mailto:support@kubatana.com" className="text-primary hover:underline">
                support@kubatana.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
