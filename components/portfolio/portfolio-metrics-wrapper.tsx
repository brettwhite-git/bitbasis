"use client"

import { usePortfolioMetrics } from "@/lib/hooks"
import { ExtendedPortfolioMetrics } from "@/lib/core/portfolio/types"
import { PortfolioValue } from "./metrics/portfolio-value"
import { CostBasis } from "./metrics/cost-basis"
import { BitcoinHoldings } from "./metrics/bitcoin-holdings"
import { FeesPaid } from "./metrics/fees-paid"
import { HoldingsTerm } from "./metrics/holdings-term"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export function PortfolioMetricsWrapper() {
  const { data, loading, error, refetch } = usePortfolioMetrics()

  useEffect(() => {
    console.log('PortfolioMetricsWrapper received data:', data)
    console.log('Loading state:', loading)
    console.log('Error state:', error)
  }, [data, loading, error])

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load portfolio metrics: {error.message}</span>
          <Button variant="outline" size="sm" onClick={refetch}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Use default values of 0 if data is not available
  const metrics: ExtendedPortfolioMetrics = data || {
    totalBtc: 0,
    currentValue: 0,
    totalCostBasis: 0,
    totalTransactions: 0,
    totalFees: 0,
    longTermHoldings: 0,
    shortTermHoldings: 0,
    unrealizedGain: 0,
    unrealizedGainPercent: 0,
    averageBuyPrice: 0,
    sendReceiveMetrics: {
      totalSent: 0,
      totalReceived: 0,
      netTransfers: 0
    },
    potentialTaxLiabilityST: 0,
    potentialTaxLiabilityLT: 0
  }

  // Calculate BTC price for holdings components
  const btcPrice = metrics.totalBtc > 0 ? metrics.currentValue / metrics.totalBtc : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <BitcoinHoldings 
        totalBtc={metrics.totalBtc}
        totalTransactions={metrics.totalTransactions}
        isLoading={loading}
      />
      <PortfolioValue 
        currentValue={metrics.currentValue}
        totalBtc={metrics.totalBtc}
        isLoading={loading}
      />
      <CostBasis 
        totalCostBasis={metrics.totalCostBasis}
        totalBtc={metrics.totalBtc}
        isLoading={loading}
      />
      <HoldingsTerm
        btcAmount={metrics.longTermHoldings}
        btcPrice={btcPrice}
        term="Long-Term"
        isLoading={loading}
      />
      <HoldingsTerm
        btcAmount={metrics.shortTermHoldings}
        btcPrice={btcPrice}
        term="Short-Term"
        isLoading={loading}
      />
      <FeesPaid 
        totalFees={metrics.totalFees}
        totalCostBasis={metrics.totalCostBasis}
        isLoading={loading}
      />
    </div>
  )
} 