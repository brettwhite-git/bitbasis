"use client"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui"
import { Button } from "@/components/ui/button"
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

interface DashboardContentProps {
  metrics: {
    totalBtc: number
    totalCostBasis: number
    currentValue: number
    unrealizedGain: number
    unrealizedGainPercent: number
    averageBuyPrice: number
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

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Overview Dashboard</h1>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
      </div>
      <div className="grid w-full gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-left py-1.5">Portfolio Summary</CardTitle>
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
          </CardHeader>
          <CardContent className="pt-0 flex-grow">
            <PortfolioSummaryChart 
              timeframe={timeframe}
            />
          </CardContent>
        </Card>
        <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
          <SavingsGoalWidget className="h-full" />
          <BuyPatternHistogram className="h-full" />
          <FearGreedMultiGauge className="h-full" />
        </div>
      </div>
      <div className="w-full">
        <Card>
          <CardHeader className="flex flex-col items-start">
            <CardTitle className="text-left">Recent Transactions</CardTitle>
            <CardDescription>Your most recent Bitcoin transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 