import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { getPerformanceMetrics, getPortfolioMetrics } from "@/lib/core/portfolio"
import { formatCurrency, formatPercent, formatDateLong } from "@/lib/utils/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/auth/server-auth"
import { BitcoinHoldingsWaterfall } from "@/components/performance/bitcoin-holdings-waterfall"
import { HodlAgeDistribution } from "@/components/performance/hodl-age-distribution"
import { BtcHeatmap } from "@/components/performance/btc-heatmap"
import { BuyPriceReferences } from "@/components/performance/buy-price-references"
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { InvestmentInsights } from "@/components/performance/investment-insights"

export default async function PerformancePage() {
  const { supabase, user } = await requireAuth()
  
  // Fetch orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
  
  // Fetch both performance metrics
  const [extendedMetrics, performanceMetrics] = await Promise.all([
    getPortfolioMetrics(user.id, supabase),
    getPerformanceMetrics(user.id, supabase)
  ])
  
  // Combine metrics with proper type safety
  const performance = {
    ...performanceMetrics,
    totalBTC: extendedMetrics.totalBtc ?? 0,
    shortTermHoldings: extendedMetrics.shortTermHoldings ?? 0,
    longTermHoldings: extendedMetrics.longTermHoldings ?? 0
  }
  
  // Calculate drawdown from ATH (current) with null checks
  const calculateDrawdownFromATHRatio = () => {
    const athPrice = performance?.allTimeHigh?.price ?? 0
    const currentPrice = performance?.currentPrice ?? 0
    
    if (athPrice > 0) { // Check denominator
      // Return the raw ratio for amount calculation
      return (athPrice - currentPrice) / athPrice
    }
    return 0
  }

  const drawdownFromATHRatio = calculateDrawdownFromATHRatio()
  const drawdownFromATHPercent = Math.max(0, drawdownFromATHRatio * 100) // Percentage, clamped at 0

  // Calculate Drawdown from ATH Amount
  const calculateDrawdownFromATHAmount = () => {
    const athPrice = performance?.allTimeHigh?.price ?? 0;
    const currentPrice = performance?.currentPrice ?? 0;
    const totalBTC = performance?.totalBTC ?? 0; // Assuming totalBTC is in performance object
  
    if (athPrice > 0 && totalBTC > 0) {
        const amount = (athPrice - currentPrice) * totalBTC;
        return Math.max(0, amount); // Loss amount cannot be negative
    }
    return 0;
  };
  const drawdownFromATHAmount = calculateDrawdownFromATHAmount();

  const maxDrawdownPercent = performance?.maxDrawdown?.percent ?? 0

  // Calculate Max Drawdown Amount (Potential loss from ATH based on Max Drawdown %)
  const calculateMaxDrawdownAmount = () => {
      const athPrice = performance?.allTimeHigh?.price ?? 0;
      const totalBTC = performance?.totalBTC ?? 0; // Assuming totalBTC is in performance object
      const maxDrawdownRatio = maxDrawdownPercent / 100;

      if (athPrice > 0 && totalBTC > 0 && maxDrawdownRatio > 0) {
          const amount = athPrice * maxDrawdownRatio * totalBTC;
          return amount; 
      }
      return 0;
  }
  const maxDrawdownAmount = calculateMaxDrawdownAmount();

  // Calculate days since all-time high with null checks
  const calculateDaysSinceATH = () => {
    const athDate = performance?.allTimeHigh?.date
    if (athDate) {
      const athDateTime = new Date(athDate)
      const today = new Date()
      // Set time to 00:00:00 to compare dates only
      athDateTime.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      const diffTime = Math.abs(today.getTime() - athDateTime.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
      return diffDays
    }
    return 0
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
          <div className="grid grid-cols-1 lg:grid-cols-[525px_1fr] gap-3">
            <div className="lg:row-span-1 flex">
              <InvestmentInsights 
                performance={performance}
                orders={orders || []} 
              />
            </div>
            
            <div className="space-y-3 flex flex-col">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-8 pb-4">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">Total Return</div>
                        <div className={(performance?.cumulative?.total?.percent ?? 0) >= 0 ? "px-4 py-2 bg-success/20 rounded-full text-success text-xs font-medium flex items-center" : "px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center"}>
                          {(performance?.cumulative?.total?.percent ?? 0) >= 0 ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                          {formatPercent(performance?.cumulative?.total?.percent ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(performance?.cumulative?.total?.dollar ?? 0)}</div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">30-Day Return</div>
                        <div className={(performance?.cumulative?.month?.percent ?? 0) >= 0 ? "px-4 py-2 bg-success/20 rounded-full text-success text-xs font-medium flex items-center" : "px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center"}>
                          {(performance?.cumulative?.month?.percent ?? 0) >= 0 ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                          {formatPercent(performance?.cumulative?.month?.percent ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(performance?.cumulative?.month?.dollar ?? 0)}</div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">YTD Return</div>
                        <div className={(performance?.cumulative?.ytd?.percent ?? 0) >= 0 ? "px-4 py-2 bg-success/20 rounded-full text-success text-xs font-medium flex items-center" : "px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center"}>
                          {(performance?.cumulative?.ytd?.percent ?? 0) >= 0 ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                          {formatPercent(performance?.cumulative?.ytd?.percent ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(performance?.cumulative?.ytd?.dollar ?? 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border my-2"></div>

                  <div className="grid grid-cols-3 gap-8 pt-4">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">Days Since ATH</div>
                        <div className="px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center">
                          <TrendingDownIcon className="h-3 w-3 mr-1" />
                          {formatPercent(drawdownFromATHPercent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-error">{daysSinceATH}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Since {formatDateLong(performance?.allTimeHigh?.date)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">Drawdown from ATH</div>
                        <div className="px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center">
                           <TrendingDownIcon className="h-3 w-3 mr-1" />
                           {formatPercent(drawdownFromATHPercent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-error">{formatCurrency(drawdownFromATHAmount)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          From Portfolio ATH
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-muted-foreground">Max Drawdown</div>
                         <div className="px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center">
                           <TrendingDownIcon className="h-3 w-3 mr-1" />
                           {formatPercent(maxDrawdownPercent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-error">{formatCurrency(maxDrawdownAmount)}</div>
                        <div className="text-xs text-muted-foreground mt-1">Portfolio Peak to Trough</div>
                         {/* Optional: Add a sub-label if needed, e.g., explaining the amount calculation */}
                         {/* <div className="text-xs text-muted-foreground mt-1">Historical Peak Loss</div> */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border flex-1 flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <PerformanceContainer className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Performance Over Time</h3>
                        <p className="text-sm text-muted-foreground">Track your Bitcoin portfolio performance</p>
                      </div>
                      <PerformanceFilters />
                    </div>
                    <div className="w-full flex-1">
                      <PerformanceChart />
                    </div>
                  </PerformanceContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <BitcoinHoldingsWaterfall />
            <HodlAgeDistribution />
          </div>
          
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

