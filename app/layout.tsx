import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ClientLayout } from "@/components/layout/client-layout"
import { BirthdayInitializer } from "@/components/birthday/birthday-initializer"
import "@/lib/update-admin-role"

export const metadata: Metadata = {
  title: {
    default: "LinkUp - Connect, Share, Thrive",
    template: "%s | LinkUp"
  },
  description: "LinkUp - The modern social media platform that brings people together. Connect with friends, share your moments, and build meaningful relationships in our vibrant community.",
  keywords: ["social media", "LinkUp", "connect", "share", "community", "friends", "networking"],
  authors: [{ name: "LinkUp Team" }],
  creator: "LinkUp",
  publisher: "LinkUp",
  generator: "Next.js",
  applicationName: "LinkUp",
  referrer: "origin-when-cross-origin",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "LinkUp - Connect, Share, Thrive",
    description: "Join LinkUp, the modern social media platform designed for authentic connections and meaningful interactions.",
    siteName: "LinkUp",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkUp - Connect, Share, Thrive",
    description: "Join LinkUp, the modern social media platform designed for authentic connections and meaningful interactions.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>
            <AuthProvider>
              <BirthdayInitializer />
              {children}
            </AuthProvider>
          </ClientLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
