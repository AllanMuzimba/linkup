"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface PasswordResetProps {
  onBack: () => void
}

export function PasswordReset({ onBack }: PasswordResetProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        
        <Card className="relative w-full max-w-md kubatana-shadow border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription className="text-base mt-2">
                We've sent a password reset link to your email address
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Password reset email sent to:
                </p>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {email}
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Click the link in the email to reset your password.</p>
                <p>If you don't see the email, check your spam folder.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full h-12 rounded-xl flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Button>
              
              <Button
                onClick={() => {
                  setSuccess(false)
                  setEmail("")
                }}
                variant="ghost"
                className="w-full text-sm"
              >
                Send to a different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
      
      <Card className="relative w-full max-w-md kubatana-shadow border-border/50 backdrop-blur-sm bg-card/80">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center mb-2">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="reset-email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl border-destructive/50">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl kubatana-gradient hover:opacity-90 transition-opacity text-white font-semibold shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending reset email...</span>
                </div>
              ) : (
                "Send Reset Email"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
