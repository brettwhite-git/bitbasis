import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SupabaseAuthProvider } from "@/providers/supabase-auth-provider"
import SupabaseProvider from "@/components/providers/supabase-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  weight: ["500"],
})

export const metadata: Metadata = {
  title: "BitBasis - Bitcoin Cost Basis Tracker",
  description: "Track your Bitcoin cost basis, calculate gains, and manage your portfolio with privacy-focused tools.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SupabaseProvider>
            <SupabaseAuthProvider>
              {children}
              <Toaster />
              <SonnerToaster 
                position="bottom-right"
                theme="dark"
                richColors
                closeButton
              />
            </SupabaseAuthProvider>
          </SupabaseProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

// Force deployment Fri Sep 19 19:47:12 CDT 2025
