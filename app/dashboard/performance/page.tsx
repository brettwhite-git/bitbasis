import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance/performance-chart"
import { KPICards } from "@/components/performance/kpi-cards"
import { getPerformanceMetrics, calculateCostBasis } from "@/lib/portfolio"
import { formatCurrency } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"
import { TradingViewSection } from "@/components/performance/trading-view-section"
import { BitcoinHoldingsWaterfall } from "@/components/performance/bitcoin-holdings-waterfall"
import { HodlAgeDistribution } from "@/components/portfolio/hodl-age-distribution"

export default async function PerformancePage() {
  const { supabase, user } = await requireAuth()
  
  // Fetch performance metrics
  const performance = await getPerformanceMetrics(user.id, supabase)
  
  // Fetch tax liability data using FIFO method
  const costBasisData = await calculateCostBasis(user.id, 'FIFO', supabase)
  const taxLiability = {
    shortTerm: costBasisData.potentialTaxLiabilityST,
    longTerm: costBasisData.potentialTaxLiabilityLT
  }

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance</h1>
      </div>
      
      {/* KPI Cards */}
      <KPICards performance={performance} taxLiability={taxLiability} />
      
      {/* Performance Chart (Full Width) */}
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

      {/* HODL Age Distribution and Bitcoin Holdings Waterfall */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HodlAgeDistribution />
        <BitcoinHoldingsWaterfall />
      </div>

      {/* TradingView chart container */}
      <div className="w-full">
        <TradingViewSection />
      </div>
    </div>
  )
}

