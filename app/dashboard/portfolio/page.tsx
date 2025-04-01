import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { CostBasisComparison } from "@/components/portfolio/cost-basis-comparison"
import { PerformanceReturns } from "@/components/portfolio/performance-returns"
import { getPortfolioMetrics, getPerformanceMetrics } from "@/lib/portfolio"
import { formatCurrency, formatBTC } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Database } from "@/types/supabase"
import { requireAuth } from "@/lib/server-auth"
import SupabaseProvider from "@/components/providers/supabase-provider"

// Add loading state component
function LoadingCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <Skeleton className="h-4 w-[100px]" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[150px] mb-2" />
        <Skeleton className="h-4 w-[120px]" />
      </CardContent>
    </Card>
  )
}

export default async function PortfolioPage() {
  const { supabase, user } = await requireAuth()

  // Debug: Check if we can query transactions directly
  // const { data: transactions, error: txError } = await supabase
  //   .from('transactions')
  //   .select('*')
  //   .eq('user_id', user.id)
  //   .order('date', { ascending: true })
  //
  // if (txError) {
  //   console.error('Transaction query error:', txError)
  //   throw new Error('Failed to fetch transactions')
  // }
  //
  // // Debug log for transaction fees
  // console.log('Transaction fee data:', transactions?.slice(0, 5).map(tx => ({
  //   service_fee: tx.service_fee,
  //   service_fee_currency: tx.service_fee_currency
  // })))

  // Fetch portfolio metrics and performance metrics
  const [metrics, performance] = await Promise.all([
    getPortfolioMetrics(user.id, supabase),
    getPerformanceMetrics(user.id, supabase)
  ])

  console.log('Portfolio metrics:', metrics)
  console.log('Performance metrics:', performance)

  // Ensure positive values and proper formatting
  const totalBtc = Math.max(0, metrics.totalBtc)
  const formattedTotalBtc = totalBtc.toFixed(8)
  const currentValue = Math.max(0, metrics.currentValue)
  const formattedCurrentValue = formatCurrency(currentValue)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-white">Portfolio Details</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formattedCurrentValue}</div>
            <p className="text-xs text-muted-foreground pt-2">
              BTC Price: {formatCurrency(metrics.currentValue / metrics.totalBtc)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(metrics.totalCostBasis)}</div>
            <p className="text-xs text-muted-foreground pt-2">
              Avg Cost: {formatCurrency(metrics.totalCostBasis / metrics.totalBtc)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bitcoin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatBTC(totalBtc)}</div>
            <p className="text-xs text-muted-foreground pt-2">
              {metrics.totalTransactions} total transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Short-Term Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatBTC(metrics.shortTermHoldings)}</div>
            <p className="text-xs text-muted-foreground pt-2">
              Value: {formatCurrency(metrics.shortTermHoldings * (metrics.currentValue / metrics.totalBtc))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long-Term Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatBTC(metrics.longTermHoldings)}</div>
            <p className="text-xs text-muted-foreground pt-2">
              Value: {formatCurrency(metrics.longTermHoldings * (metrics.currentValue / metrics.totalBtc))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(metrics.totalFees)}</div>
            <p className="text-xs text-muted-foreground pt-2">
              {metrics.totalCostBasis > 0 
                ? `${((metrics.totalFees / metrics.totalCostBasis) * 100).toFixed(2)}% of total cost basis`
                : 'No purchases yet'}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cost Basis Method Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <SupabaseProvider>
            <CostBasisComparison />
          </SupabaseProvider>
        </CardContent>
      </Card>
      <PerformanceReturns data={performance} />
    </div>
  )
}

