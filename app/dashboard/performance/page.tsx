import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { KPICards } from "@/components/performance/kpi-cards"
import { getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"
// import { TradingViewSection } from "@/components/performance/trading-view-section"
import { BitcoinHoldingsWaterfall } from "@/components/performance/bitcoin-holdings-waterfall"
import { TotalBtc } from "@/components/performance/total-btc"
import { HodlAgeDistribution } from "@/components/performance/hodl-age-distribution"
import { BtcHeatmap } from "@/components/performance/btc-heatmap"

export default async function PerformancePage() {
  const { supabase, user } = await requireAuth()
  
  // Fetch performance metrics
  const performance = await getPerformanceMetrics(user.id, supabase)

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance</h1>
      </div>
      
      {/* Top Section: KPI Cards (2 columns) and Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* KPI Cards - Take up 1 column on large screens */}
        <div className="lg:col-span-1 space-y-4">
          {/* Buy Price Reference Card - MOVED HERE */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Buy Price References</CardTitle>
              <p className="text-sm text-muted-foreground">Strategy reference points</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Good Buy Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Good Buy</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 bg-green-500 rounded"></div>
                    <span className="text-sm font-medium">{formatCurrency(performance.averageBuyPrice * 0.8)}</span>
                  </div>
                </div>
                
                {/* Average Buy Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Buy</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 bg-amber-500 rounded"></div>
                    <span className="text-sm font-medium">{formatCurrency(performance.averageBuyPrice)}</span>
                  </div>
                </div>
                
                {/* Higher Price Buy */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Higher Price Buy</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 bg-red-500 rounded"></div>
                    <span className="text-sm font-medium">{formatCurrency(performance.averageBuyPrice * 1.2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <KPICards performance={performance} />
        </div>
        
        {/* Performance Chart - Take up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="pt-6">
              <PerformanceContainer>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Performance Over Time</h3>
                    <p className="text-sm text-muted-foreground">Track your Bitcoin portfolio performance</p>
                  </div>
                  <PerformanceFilters />
                </div>
                <div className="w-full">
                  <PerformanceChart />
                </div>
              </PerformanceContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Bitcoin Holdings Waterfall, Heatmap, and HODL Age Distribution */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BitcoinHoldingsWaterfall />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Transaction Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly buy/sell activity overview</p>
          </CardHeader>
          <CardContent>
            <BtcHeatmap />
          </CardContent>
        </Card>
        
        <HodlAgeDistribution />
      </div>
    </div>
  )
}

