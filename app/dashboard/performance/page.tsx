import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { KPICards } from "@/components/performance/kpi-cards"
import { getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"
// import { TradingViewSection } from "@/components/performance/trading-view-section"
import { BitcoinHoldingsWaterfall } from "@/components/performance/bitcoin-holdings-waterfall"
import { HodlAgeDistribution } from "@/components/portfolio/hodl-age-distribution"
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
      
      {/* KPI Cards */}
      <KPICards performance={performance} />
      
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

      {/* Performance Chart (Full Width) - MOVED HERE */}
      <Card>
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

      {/* TradingView chart container - REMOVED */}
      {/* <div className="w-full">
        <TradingViewSection />
      </div> */}
    </div>
  )
}

