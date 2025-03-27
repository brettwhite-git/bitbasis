import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/supabase"

export default async function PerformancePage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Fetch performance metrics
  const performance = await getPerformanceMetrics(user.id, supabase)

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance</h1>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(performance.allTimeHigh.value)}</div>
            <p className="text-xs text-muted-foreground">Reached on {performance.allTimeHigh.date}</p>
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
            <p className="text-xs text-muted-foreground">Since first purchase</p>
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
            <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
              {performance.cumulative.ytd.dollar !== null ? formatCurrency(performance.cumulative.ytd.dollar) : "-"}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-12">
          <PerformanceContainer>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>Track your Bitcoin portfolio performance</CardDescription>
              </div>
              <div>
                <PerformanceFilters />
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <PerformanceChart />
              </div>
            </CardContent>
          </PerformanceContainer>
        </Card>
      </div>
    </div>
  )
}

