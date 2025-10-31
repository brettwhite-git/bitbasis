"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/supabase-auth-provider'
import { PortfolioMetricsWrapper } from '@/components/portfolio/portfolio-metrics-wrapper'
import { PerformanceReturnsWrapper } from '@/components/portfolio/performance-returns-wrapper'

export default function PortfolioPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Client-side protection (layout already protects server-side)
    // Layout-level requireAuth handles server-side protection
    if (!user) {
      router.push('/auth/sign-in')
    }
  }, [user, router])

  // Don't render until auth is confirmed
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  return (
    <div className="w-full space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">Portfolio Metrics</h1>
      
      <PortfolioMetricsWrapper />
      
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4 text-white">Performance Metrics</h2>
        <PerformanceReturnsWrapper />
      </div>
    </div>
  )
}

