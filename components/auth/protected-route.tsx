"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: string
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user',
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not authenticated, redirect to login
      router.push(redirectTo)
    } else if (user && requiredRole !== 'any' && !hasPermission(requiredRole)) {
      // User is authenticated but doesn't have required role
      router.push('/unauthorized')
    }
  }, [user, isLoading, requiredRole, router, redirectTo, hasPermission])

  if (isLoading || (!user && !isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // If user has required role or no specific role is required, render children
  if (hasPermission(requiredRole) || requiredRole === 'any') {
    return <>{children}</>
  }

  // Default fallback (should be caught by the useEffect redirect)
  return null
}
