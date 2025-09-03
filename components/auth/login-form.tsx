"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, Chrome, Facebook, Twitter, Phone } from "lucide-react"
import { PasswordReset } from "./password-reset"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, register, loginWithGoogle, loginWithFacebook, loginWithTwitter } = useAuth()
  const router = useRouter()

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('linkup_remember_email')
    const savedRemember = localStorage.getItem('linkup_remember_me') === 'true'
    
    if (savedEmail && savedRemember) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (!email.trim()) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    if (!password.trim()) {
      setError("Please enter your password")
      setIsLoading(false)
      return
    }

    try {
      await login(email, password)
      
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('linkup_remember_email', email)
        localStorage.setItem('linkup_remember_me', 'true')
      } else {
        localStorage.removeItem('linkup_remember_email')
        localStorage.removeItem('linkup_remember_me')
      }
      
      // Success message
      toast.success("Welcome back! 🎉", {
        description: "You've successfully signed in to LinkUp."
      })
      
    } catch (err: any) {
      console.error("Login error:", err)
      
      // User-friendly error messages
      let errorMessage = "Login failed. Please try again."
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up first."
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again."
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address."
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support."
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (!name.trim()) {
      setError("Please enter your full name")
      setIsLoading(false)
      return
    }

    if (!email.trim()) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      await register(email, password, name, 'user', phone)
      
      // Success message with email confirmation
      toast.success(`Welcome to LinkUp, ${name}! 🎉`, {
        description: "Account created successfully! Please check your email to verify your account.",
        duration: 5000
      })
      
      // Switch to login tab after successful registration
      setTimeout(() => {
        setActiveTab("login")
        setEmail(email) // Pre-fill email for login
        setPassword("") // Clear password for security
        setName("")
        setPhone("")
        setConfirmPassword("")
      }, 2000)
      
    } catch (err: any) {
      console.error("Registration error:", err)
      
      // User-friendly error messages
      let errorMessage = "Registration failed. Please try again."
      
      if (err.code === 'auth/operation-not-allowed') {
        errorMessage = "🔧 Email/Password authentication needs to be enabled in Firebase Console first. Go to: https://console.firebase.google.com/project/linkup-fe1c3/authentication/providers"
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please use the 'Sign In' tab to login, or try a different email address."
        // Auto-switch to login tab and pre-fill email
        setTimeout(() => {
          setActiveTab("login")
          setEmail(email)
          setPassword("")
          setError("Email already registered. Please sign in with your password.")
        }, 3000)
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address."
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
    setError("")
    setIsLoading(true)
    
    try {
      let result
      switch (provider) {
        case 'google':
          result = await loginWithGoogle()
          break
        case 'facebook':
          result = await loginWithFacebook()
          break
        case 'twitter':
          result = await loginWithTwitter()
          break
        default:
          throw new Error('Invalid provider')
      }
      
      // Success message for social login
      toast.success("Welcome to LinkUp! 🎉", {
        description: `Successfully signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
        duration: 3000
      })
      
      // Small delay to show success message, then redirect will happen automatically
      setTimeout(() => {
        console.log('Social login successful, waiting for redirect...')
      }, 1000)
      
    } catch (error: any) {
      console.error(`${provider} login error:`, error)
      
      // User-friendly error messages for social login
      let errorMessage = `Failed to sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
      
      if (error.code === 'auth/configuration-not-found') {
        errorMessage = `🔧 ${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in needs to be enabled in Firebase Console first. Go to: https://console.firebase.google.com/project/linkup-fe1c3/authentication/providers`
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled. Please try again."
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups and try again."
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Sign-in was cancelled. Please try again."
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

      <Card className="relative w-full max-w-md kubatana-shadow border-border/50 backdrop-blur-sm bg-card/80">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center mb-2">
            <div className="text-2xl font-bold text-white">L</div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              LinkUp
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Connect, Share, Thrive Together
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-5 mt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="login-email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="login-password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors pr-12"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-sm text-primary hover:text-primary/80 p-0 h-auto"
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl kubatana-gradient hover:opacity-90 transition-opacity text-white font-semibold shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing you in...</span>
                    </div>
                  ) : (
                    "Sign In to LinkUp"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-5 mt-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="register-name" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="register-email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="register-phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="register-password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors pr-12"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="h-12 rounded-xl border-border/50 focus:border-primary/50 transition-colors pr-12"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl kubatana-gradient hover:opacity-90 transition-opacity text-white font-semibold shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="rounded-xl border-destructive/50">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <Chrome className="w-5 h-5 text-red-500 mr-3" />
                Continue with Google
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={isLoading}
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
                  onClick={() => handleSocialLogin('twitter')}
                  disabled={isLoading}
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By {activeTab === 'login' ? 'signing in' : 'creating an account'}, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}