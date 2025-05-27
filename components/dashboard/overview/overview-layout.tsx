"use client"

import { Button } from "@/components/ui/button"
import { useTaxLiability } from "@/lib/hooks/useTaxLiability"
// Import from the new locations
import { RecentTransactions } from "./widgets/recent-transactions"
import { PortfolioSummaryChart } from "./charts/portfolio-summary-chart"
import BuyPatternHistogram from "./charts/buy-pattern-histogram"
import FearGreedMultiGauge from "./widgets/fear-greed-gauge"
import { SavingsGoalWidget } from "./widgets/savings-goal-widget"
import { useState } from "react"
import { PortfolioValueCard } from "./summary-cards/portfolio-value-card"
import { CostBasisCard } from "./summary-cards/cost-basis-card"
import { UnrealizedGainsCard } from "./summary-cards/unrealized-gains-card"
import { AverageBuyPriceCard } from "./summary-cards/average-buy-price-card"
import { HodlTimeCard } from "./summary-cards/hodl-time-card"
import { TaxLiabilityCard } from "./summary-cards/tax-liability-card"

interface DashboardContentProps {
  metrics: {
    totalBtc: number
    totalCostBasis: number
    currentValue: number
    unrealizedGain: number
    unrealizedGainPercent: number
    averageBuyPrice: number
    potentialTaxLiabilityST: number
    potentialTaxLiabilityLT: number
    shortTermHoldings: number
    longTermHoldings: number
  }
  performance: {
    allTimeHigh: {
      price: number
      date: string
    }
    cumulative: {
      month: { percent: number | null; dollar: number | null }
      ytd: { percent: number | null; dollar: number | null }
      total: { percent: number }
    }
    hodlTime: number
  }

}

export function OverviewLayout({ metrics, performance }: DashboardContentProps) {
  const [timeframe, setTimeframe] = useState<"6M" | "1Y">("1Y")
  
  // Calculate tax liability based on selected method
  const taxLiability = useTaxLiability({
    unrealizedGain: metrics.unrealizedGain,
    shortTermHoldings: metrics.shortTermHoldings,
    longTermHoldings: metrics.longTermHoldings
  })

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview Dashboard</h1>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <PortfolioValueCard 
          currentValue={metrics.currentValue}
          monthPercentChange={performance.cumulative.month?.percent ?? null}
        />
        <CostBasisCard 
          totalCostBasis={metrics.totalCostBasis}
          totalBtc={metrics.totalBtc}
        />
        <UnrealizedGainsCard 
          unrealizedGain={metrics.unrealizedGain}
          unrealizedGainPercent={metrics.unrealizedGainPercent}
        />
        <AverageBuyPriceCard 
          averageBuyPrice={metrics.averageBuyPrice}
        />
        <HodlTimeCard 
          hodlTime={performance.hodlTime}
        />
        <TaxLiabilityCard 
          totalTaxLiability={taxLiability.totalLiability}
          shortTermLiability={taxLiability.shortTermLiability}
          longTermLiability={taxLiability.longTermLiability}
        />
      </div>
      <div className="grid w-full gap-4 grid-cols-1 md:grid-cols-3">
        <div className="col-span-1 md:col-span-2 flex flex-col relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
          <div className="flex flex-row items-start justify-between pb-4">
            <h3 className="text-xl font-bold text-white">Portfolio Summary</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant={timeframe === "6M" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setTimeframe("6M")}
              >
                6M
              </Button>
              <Button 
                variant={timeframe === "1Y" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setTimeframe("1Y")}
              >
                1Y
              </Button>
            </div>
          </div>
          <div className="flex-grow">
            <PortfolioSummaryChart 
              timeframe={timeframe}
            />
          </div>
        </div>
        <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
          <SavingsGoalWidget className="h-full" />
          <FearGreedMultiGauge className="h-full" />
          <BuyPatternHistogram className="h-full" />
          
        </div>
      </div>
      <div className="w-full">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
          <div className="flex flex-col items-start mb-4">
            <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
            <p className="text-sm text-gray-400">Your most recent Bitcoin transactions</p>
          </div>
          <div>
            <RecentTransactions />
          </div>
        </div>
      </div>
    </div>
  )
} 