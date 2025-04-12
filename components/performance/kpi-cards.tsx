"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { PerformanceMetrics } from "@/lib/portfolio"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface KPICardsProps {
  performance: PerformanceMetrics
}

export function KPICards({ performance }: KPICardsProps) {
  // Calculate maximum drawdown
  const calculateMaxDrawdown = () => {
    // In a real implementation, we would need historical portfolio values
    // For now, we'll use a simplified calculation based on the all-time high
    if (performance.allTimeHigh.price > 0) {
      // Get the current portfolio value from the performance metrics
      const currentValue = performance.cumulative.total.dollar
      const peakValue = performance.allTimeHigh.price
      
      // Calculate the drawdown percentage
      const drawdown = ((peakValue - currentValue) / peakValue) * 100
      return Math.max(0, drawdown) // Ensure we don't return negative values
    }
    return 0
  }

  const maxDrawdown = calculateMaxDrawdown()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Bitcoin ATH */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bitcoin ATH</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(performance.allTimeHigh.price)}</div>
          <p className="text-xs text-muted-foreground pt-2">
            {performance.allTimeHigh.date}
          </p>
        </CardContent>
      </Card>

      {/* Total Return */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Return</CardTitle>
          <div className={performance.cumulative.total.percent >= 0 ? "text-green-500" : "text-red-500"}>
            {performance.cumulative.total.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(performance.cumulative.total.percent)}</div>
          <p className="text-xs text-muted-foreground pt-2">
            {formatCurrency(performance.cumulative.total.dollar)}
          </p>
        </CardContent>
      </Card>

      {/* YTD Return */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">YTD Return</CardTitle>
          <div className={performance.cumulative.ytd.percent && performance.cumulative.ytd.percent >= 0 ? "text-green-500" : "text-red-500"}>
            {performance.cumulative.ytd.percent && performance.cumulative.ytd.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(performance.cumulative.ytd.percent ?? 0)}</div>
          <p className="text-xs text-muted-foreground pt-2">
            {formatCurrency(performance.cumulative.ytd.dollar ?? 0)}
          </p>
        </CardContent>
      </Card>

      {/* 30-Day Return */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">30-Day Return</CardTitle>
          <div className={performance.cumulative.month.percent && performance.cumulative.month.percent >= 0 ? "text-green-500" : "text-red-500"}>
            {performance.cumulative.month.percent && performance.cumulative.month.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(performance.cumulative.month.percent ?? 0)}</div>
          <p className="text-xs text-muted-foreground pt-2">
            {formatCurrency(performance.cumulative.month.dollar ?? 0)}
          </p>
        </CardContent>
      </Card>

      {/* CAGR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CAGR</CardTitle>
          <div className={performance.annualized.total && performance.annualized.total >= 0 ? "text-green-500" : "text-red-500"}>
            {performance.annualized.total && performance.annualized.total >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(performance.annualized.total ?? 0)}</div>
          <p className="text-xs text-muted-foreground pt-2">
            Compound Annual Growth Rate
          </p>
        </CardContent>
      </Card>

      {/* Max Drawdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
          <div className="text-red-500">
            <ArrowDownIcon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(maxDrawdown)}</div>
          <p className="text-xs text-muted-foreground pt-2">
            Peak to Trough
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 