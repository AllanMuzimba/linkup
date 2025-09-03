"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { BirthdayService } from "@/lib/birthday-service"

export function BirthdayInitializer() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Initialize birthday checking system
      BirthdayService.initializeBirthdayChecker()
    }
  }, [user])

  return null // This component doesn't render anything
}