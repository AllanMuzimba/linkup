"use client"

import { useBirthdayChecker } from "@/hooks/use-birthday-checker"

export function BirthdayInitializer() {
  useBirthdayChecker()
  return null // This component doesn't render anything
}
