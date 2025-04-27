import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency, formatPercent, formatDateLong } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"
import { BitcoinHoldingsWaterfall } from "@/components/performance/bitcoin-holdings-waterfall"
import { HodlAgeDistribution } from "@/components/performance/hodl-age-distribution"
import { BtcHeatmap } from "@/components/performance/btc-heatmap"
import { BuyPriceReferences } from "@/components/performance/buy-price-references"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"

export default async function PerformancePage() {
  const { supabase, user } = await requireAuth()
  
  // Fetch performance metrics
  const performance = await getPerformanceMetrics(user.id, supabase)
  
  // Calculate drawdown from ATH (current)
  const calculateDrawdownFromATH = () => {
    if (performance.allTimeHigh.price > 0 && performance.currentPrice) {
      // Calculate percentage drop from market ATH to current price
      const drawdown = ((performance.allTimeHigh.price - performance.currentPrice) / performance.allTimeHigh.price) * 100
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
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Overview</h1>
      </div>
      
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="flex w-auto mb-4 bg-transparent p-0 h-auto justify-start gap-x-1 border-b border-border">
          <TabsTrigger 
            value="performance"
            className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
          >
            Personal Insights
          </TabsTrigger>
          <TabsTrigger 
            value="distribution"
            className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
          >
            HODL Distribution
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          {/* Main layout: Buy Price References on left, KPI Cards and Performance Chart on right */}
          <div className="grid grid-cols-1 lg:grid-cols-[475px_1fr] gap-4">
            {/* Buy Price References - Takes up left column spanning 2 rows */}
            <div className="lg:row-span-1">
              <BuyPriceReferences performance={performance} />
            </div>
            
            {/* Right Column: KPI Cards on top, Performance Chart below */}
            <div className="space-y-4">
              {/* KPI cards with reduced height */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  {/* Top row: Total Return, 30-Day Return, YTD Return */}
                  <div className="grid grid-cols-3 gap-8 pb-4">
                    {/* Total Return */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">Total Return</div>
                        <div className={performance.cumulative.total.percent >= 0 ? "text-success" : "text-error"}>
                          {performance.cumulative.total.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-bitcoin-orange">{formatPercent(performance.cumulative.total.percent)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(performance.cumulative.total.dollar)}
                        </div>
                      </div>
                    </div>

                    {/* 30-Day Return */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">30-Day Return</div>
                        <div className={performance.cumulative.month.percent && performance.cumulative.month.percent >= 0 ? "text-success" : "text-error"}>
                          {performance.cumulative.month.percent && performance.cumulative.month.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-bitcoin-orange">{formatPercent(performance.cumulative.month.percent ?? 0)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(performance.cumulative.month.dollar ?? 0)}
                        </div>
                      </div>
                    </div>

                    {/* YTD Return */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">YTD Return</div>
                        <div className={performance.cumulative.ytd.percent && performance.cumulative.ytd.percent >= 0 ? "text-success" : "text-error"}>
                          {performance.cumulative.ytd.percent && performance.cumulative.ytd.percent >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-bitcoin-orange">{formatPercent(performance.cumulative.ytd.percent ?? 0)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(performance.cumulative.ytd.dollar ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-2"></div>

                  {/* Bottom row: Days Since ATH, Drawdown from ATH %, Max Drawdown */}
                  <div className="grid grid-cols-3 gap-8 pt-4">
                    {/* Days Since ATH */}
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-muted-foreground">Days Since ATH</div>
                      <div>
                        <div className="text-2xl font-bold text-error">{daysSinceATH}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Since {formatDateLong(performance.allTimeHigh.date)}
                        </div>
                      </div>
                    </div>

                    {/* Drawdown from ATH % */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">Drawdown from ATH</div>
                        <div className="text-error">
                          <ArrowDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-error">{formatPercent(drawdownFromATH)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          From Market ATH
                        </div>
                      </div>
                    </div>

                    {/* Max Drawdown */}
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">Max Drawdown</div>
                        <div className="text-error">
                          <ArrowDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-error">{formatPercent(maxDrawdown)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance Chart with reduced width */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <PerformanceContainer>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Performance Over Time</h3>
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
        </TabsContent>
        
        <TabsContent value="distribution">
          {/* Distribution Section: First row with HODL Age Distribution and Bitcoin Holdings Waterfall in 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Bitcoin Accumulation Flow */}
            <BitcoinHoldingsWaterfall />
            
            {/* HODL Age Distribution */}
            <HodlAgeDistribution />
          </div>
          
          {/* Second row: Transaction Heatmap spanning full width */}
          <div className="w-full">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">Transaction Heatmap</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly buy/sell activity overview</p>
              </CardHeader>
              <CardContent>
                <BtcHeatmap />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

