import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { BirthdayService } from '@/lib/birthday-service'

export function useBirthdayChecker() {
  const { user } = useAuth()
  const initialized = useRef(false)

  useEffect(() => {
    // Only initialize birthday checking when user is authenticated and not already initialized
    if (user && !initialized.current) {
      // Initialize birthday checking system
      BirthdayService.initializeBirthdayChecker()
      initialized.current = true
    }
  }, [user])
}