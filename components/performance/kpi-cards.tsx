"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { PerformanceMetrics } from "@/lib/portfolio"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface KPICardsProps {
  performance: PerformanceMetrics
  taxLiability: {
    shortTerm: number
    longTerm: number
  }
}

export function KPICards({ performance, taxLiability }: KPICardsProps) {
  // Calculate total tax liability
  const totalTaxLiability = taxLiability.shortTerm + taxLiability.longTerm

  // Calculate maximum drawdown
  const calculateMaxDrawdown = () => {
    // In a real implementation, we would need historical portfolio values
    // For now, we'll use a simplified calculation based on the all-time high
    if (performance.allTimeHigh.price > 0) {
      // Get the current portfolio value from the performance metrics
      // This is a simplified approach - in a production environment,
      // you would want to track historical portfolio values over time
      const currentValue = performance.cumulative.total.dollar
      const peakValue = performance.allTimeHigh.price
      
      // Calculate the drawdown percentage
      const drawdown = ((peakValue - currentValue) / peakValue) * 100
      return Math.max(0, drawdown) // Ensure we don't return negative values
    }
    return 0
  }

  const maxDrawdown = calculateMaxDrawdown()
  const isROIPositive = performance.cumulative.total.percent > 0
  const isCAGRPositive = performance.annualized.total !== null && performance.annualized.total > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Overall ROI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            <div className={`text-2xl font-bold ${isROIPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isROIPositive ? <ArrowUpIcon className="h-5 w-5 inline mr-1" /> : <ArrowDownIcon className="h-5 w-5 inline mr-1" />}
              {formatPercent(performance.cumulative.total.percent)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(performance.cumulative.total.dollar)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">CAGR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {performance.annualized.total !== null ? (
              <div className={`text-2xl font-bold ${isCAGRPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isCAGRPositive ? <ArrowUpIcon className="h-5 w-5 inline mr-1" /> : <ArrowDownIcon className="h-5 w-5 inline mr-1" />}
                {formatPercent(performance.annualized.total)}
              </div>
            ) : (
              <div className="text-2xl font-bold">N/A</div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Compound Annual Growth Rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Maximum Drawdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            <div className="text-2xl font-bold text-red-500">
              <ArrowDownIcon className="h-5 w-5 inline mr-1" />
              {formatPercent(maxDrawdown)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Largest peak-to-trough decline
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax Liability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalTaxLiability)}
          </div>
          <p className="text-xs text-muted-foreground">
            ST: {formatCurrency(taxLiability.shortTerm)} | LT: {formatCurrency(taxLiability.longTerm)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 