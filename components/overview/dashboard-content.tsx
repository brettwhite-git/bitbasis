"use client"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui"
import { Button } from "@/components/ui/button"
import { RecentTransactions } from "@/components/overview/recent-transactions"
import { PortfolioSummaryChart } from "@/components/overview/portfolio-summary-chart"
import { BtcHeatmap } from "@/components/overview/btc-heatmap"
// import FearGreedGauge from "@/components/overview/fear-greed-gauge"
import FearGreedCircularChart from "@/components/overview/fear-greed-circular-chart"
import { useState } from "react"
import { formatCurrency, formatPercent } from "@/lib/utils"

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

export function DashboardContent({ metrics, performance }: DashboardContentProps) {
  const [timeframe, setTimeframe] = useState<"6M" | "1Y">("1Y")

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(metrics.currentValue)}</div>
            <p className="text-xs text-muted-foreground pt-2">
              {performance.cumulative.month?.percent ? 
                `${performance.cumulative.month.percent > 0 ? '+' : ''}${formatPercent(performance.cumulative.month.percent)} from last month` : 
                'No monthly data'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(metrics.totalCostBasis)}</div>
            <p className="text-xs text-muted-foreground pt-2">{metrics.totalBtc.toFixed(8)} BTC acquired</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized Gains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.unrealizedGain >= 0 ? 'text-bitcoin-orange' : 'text-red-500'}`}>
              {metrics.unrealizedGain >= 0 ? '+' : ''}{formatCurrency(metrics.unrealizedGain)}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {metrics.unrealizedGainPercent >= 0 ? '+' : ''}{formatPercent(metrics.unrealizedGainPercent)} ROI
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Buy Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(metrics.averageBuyPrice)}</div>
            <p className="text-xs text-muted-foreground pt-2">Per Bitcoin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HODL Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">
              {performance.hodlTime} days
            </div>
            <p className="text-xs text-muted-foreground pt-2">Weighted Average</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="col-span-1">
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
          <CardContent className="pt-0 min-h-[350px]">
            <PortfolioSummaryChart 
              timeframe={timeframe}
              onTimeframeChangeAction={setTimeframe}
            />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-left py-1.5">Bitcoin Transaction Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 min-h-[350px] flex items-center justify-center">
            <BtcHeatmap />
          </CardContent>
        </Card>
        <FearGreedCircularChart />
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