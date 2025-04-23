import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"
import { BitcoinHoldingsWaterfall } from "@/components/performance/bitcoin-holdings-waterfall"
import { HodlAgeDistribution } from "@/components/performance/hodl-age-distribution"
import { BtcHeatmap } from "@/components/performance/btc-heatmap"
import { BuyPriceReferences } from "@/components/performance/buy-price-references"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

export default async function PerformancePage() {
  const { supabase, user } = await requireAuth()
  
  // Fetch performance metrics
  const performance = await getPerformanceMetrics(user.id, supabase)
  
  // Calculate maximum drawdown
  const calculateMaxDrawdown = () => {
    if (performance.allTimeHigh.price > 0) {
      const currentValue = performance.cumulative.total.dollar
      const peakValue = performance.allTimeHigh.price
      
      const drawdown = ((peakValue - currentValue) / peakValue) * 100
      return Math.max(0, drawdown)
    }
    return 0
  }

  const maxDrawdown = calculateMaxDrawdown()

  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance</h1>
      </div>
      
      {/* Main layout: Buy Price References on left, KPI Cards and Performance Chart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[475px_1fr] gap-4">
        {/* Buy Price References - Takes up left column spanning 2 rows */}
        <div className="lg:row-span-1">
          <BuyPriceReferences performance={performance} />
        </div>
        
        {/* Right Column: KPI Cards on top, Performance Chart below */}
        <div className="space-y-4">
          {/* KPI cards with reduced height */}
          <Card className="bg-[#0f172a] border-gray-800">
            <CardContent className="p-6">
              {/* Top row of KPIs */}
              <div className="grid grid-cols-3 gap-8 pb-4">
                {/* Bitcoin ATH */}
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-400">Bitcoin ATH</div>
                  <div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(performance.allTimeHigh.price)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {performance.allTimeHigh.date}
                    </div>
                  </div>
                </div>

                {/* Total Return */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-400">Total Return</div>
                    <div className={performance.cumulative.total.percent >= 0 ? "text-green-500" : "text-red-500"}>
                      {performance.cumulative.total.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-bitcoin-orange">{formatPercent(performance.cumulative.total.percent)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(performance.cumulative.total.dollar)}
                    </div>
                  </div>
                </div>

                {/* YTD Return */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-400">YTD Return</div>
                    <div className={performance.cumulative.ytd.percent && performance.cumulative.ytd.percent >= 0 ? "text-green-500" : "text-red-500"}>
                      {performance.cumulative.ytd.percent && performance.cumulative.ytd.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-bitcoin-orange">{formatPercent(performance.cumulative.ytd.percent ?? 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(performance.cumulative.ytd.dollar ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-800 my-2"></div>

              {/* Bottom row of KPIs */}
              <div className="grid grid-cols-3 gap-8 pt-4">
                {/* 30-Day Return */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-400">30-Day Return</div>
                    <div className={performance.cumulative.month.percent && performance.cumulative.month.percent >= 0 ? "text-green-500" : "text-red-500"}>
                      {performance.cumulative.month.percent && performance.cumulative.month.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-bitcoin-orange">{formatPercent(performance.cumulative.month.percent ?? 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatCurrency(performance.cumulative.month.dollar ?? 0)}
                    </div>
                  </div>
                </div>

                {/* CAGR */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-400">CAGR</div>
                    <div className={performance.annualized.total && performance.annualized.total >= 0 ? "text-green-500" : "text-red-500"}>
                      {performance.annualized.total && performance.annualized.total >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-bitcoin-orange">{formatPercent(performance.annualized.total ?? 0)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Compound Annual Growth Rate
                    </div>
                  </div>
                </div>

                {/* Max Drawdown */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-400">Max Drawdown</div>
                    <div className="text-red-500">
                      <ArrowDownIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{formatPercent(maxDrawdown)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Peak to Trough
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Performance Chart with reduced width */}
          <Card className="bg-[#0f172a] border-gray-800">
            <CardContent className="p-6">
              <PerformanceContainer>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Performance Over Time</h3>
                    <p className="text-sm text-gray-400">Track your Bitcoin portfolio performance</p>
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
      
      {/* Bottom Section: Heatmap, Accumulation Flow, HODL Age Distribution in 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bitcoin Accumulation Flow */}
        <BitcoinHoldingsWaterfall />
        
        {/* Transaction Heatmap */}
        <Card className="bg-[#0f172a] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white">Transaction Heatmap</CardTitle>
            <p className="text-sm text-gray-400">Monthly buy/sell activity overview</p>
          </CardHeader>
          <CardContent>
            <BtcHeatmap />
          </CardContent>
        </Card>
        
        {/* HODL Age Distribution */}
        <HodlAgeDistribution />
      </div>
    </div>
  )
}

