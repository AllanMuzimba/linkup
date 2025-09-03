"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    // Listen for route changes
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = (...args) => {
      handleStart()
      return originalPush.apply(router, args).finally(handleComplete)
    }

    router.replace = (...args) => {
      handleStart()
      return originalReplace.apply(router, args).finally(handleComplete)
    }

    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [router])

  return isLoading
}

export function useAsyncOperation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (operation: () => Promise<any>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await operation()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, execute }
}