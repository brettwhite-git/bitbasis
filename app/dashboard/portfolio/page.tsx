"use client"

import { PortfolioMetricsWrapper } from '@/components/portfolio/portfolio-metrics-wrapper'
import { PerformanceReturnsWrapper } from '@/components/portfolio/performance-returns-wrapper'

export default function PortfolioPage() {
  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Bitcoin Portfolio</h1>
      
      <PortfolioMetricsWrapper />
      
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <PerformanceReturnsWrapper />
      </div>
    </div>
  )
}

