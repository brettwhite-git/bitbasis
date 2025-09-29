"use client"

import { PortfolioMetricsWrapper } from '@/components/portfolio/portfolio-metrics-wrapper'
import { PerformanceReturnsWrapper } from '@/components/portfolio/performance-returns-wrapper'

export default function PortfolioPage() {
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

