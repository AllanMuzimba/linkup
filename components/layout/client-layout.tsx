"use client"

import { NavigationProgress } from "./navigation-progress"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavigationProgress />
      {children}
    </>
  )
}