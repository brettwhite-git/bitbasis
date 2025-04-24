"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { PerformanceMetrics } from "@/lib/portfolio"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface KPICardsProps {
  performance: PerformanceMetrics
}

export function KPICards({ performance }: KPICardsProps) {
  // Calculate drawdown from ATH (current)
  const calculateDrawdownFromATH = () => {
    if (performance.allTimeHigh.price > 0) {
      const currentValue = performance.cumulative.total.dollar
      const peakValue = performance.allTimeHigh.price
      
      const drawdown = ((peakValue - currentValue) / peakValue) * 100
      return Math.max(0, drawdown)
    }
    return 0
  }

  const drawdownFromATH = calculateDrawdownFromATH()
  const maxDrawdown = performance.maxDrawdown.percent

  // Calculate days since all-time high
  const calculateDaysSinceATH = () => {
    if (performance.allTimeHigh.date) {
      const athDate = new Date(performance.allTimeHigh.date);
      const today = new Date();
      // Set time to 00:00:00 to compare dates only
      athDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today.getTime() - athDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays;
    }
    return 0; // Return 0 if no date is available
  }

  const daysSinceATH = calculateDaysSinceATH()

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Days Since ATH */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Days Since ATH</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{daysSinceATH}</div>
          <p className="text-xs text-muted-foreground pt-2">
            Since {performance.allTimeHigh.date}
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
        </CardContent>
      </Card>
    </div>
  )
} 