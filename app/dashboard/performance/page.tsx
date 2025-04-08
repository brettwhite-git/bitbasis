import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"

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
  )
}

