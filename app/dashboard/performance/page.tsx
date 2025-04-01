import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"
import BitcoinAccumulationCalculator from "@/components/portfolio/BitcoinAccumulationCalculator"

export default async function PerformancePage() {
  const { supabase, user } = await requireAuth()
  
  // Fetch performance metrics
  const performance = await getPerformanceMetrics(user.id, supabase)

  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance</h1>
      </div>
      <div className="w-full grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>Track your Bitcoin portfolio's performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bitcoin ATH</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(performance.allTimeHigh.price)}</div>
                  <p className="text-xs text-muted-foreground pt-2">Reached on {performance.allTimeHigh.date}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${performance.cumulative.total.percent >= 0 ? "text-bitcoin-orange" : "text-red-500"}`}>
                    {performance.cumulative.total.percent.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">Since first purchase</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">30-Day Change</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(performance.cumulative.month.percent ?? 0) >= 0 ? "text-bitcoin-orange" : "text-red-500"}`}>
                    {performance.cumulative.month.percent !== null ? `${performance.cumulative.month.percent.toFixed(1)}%` : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    {performance.cumulative.month.dollar !== null ? formatCurrency(performance.cumulative.month.dollar) : "-"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">YTD Change</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(performance.cumulative.ytd.percent ?? 0) >= 0 ? "text-bitcoin-orange" : "text-red-500"}`}>
                    {performance.cumulative.ytd.percent !== null ? `${performance.cumulative.ytd.percent.toFixed(1)}%` : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    {performance.cumulative.ytd.dollar !== null ? formatCurrency(performance.cumulative.ytd.dollar) : "-"}
                  </p>
                </CardContent>
              </Card>
            </div>
            <PerformanceContainer>
              <div className="mt-6">
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
              </div>
            </PerformanceContainer>
          </CardContent>
        </Card>

        <BitcoinAccumulationCalculator />

      </div>
    </div>
  )
}

