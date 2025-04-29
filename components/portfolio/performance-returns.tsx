"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { useSupabase } from "@/components/providers/supabase-provider"
import { calculateCostBasis } from "@/lib/portfolio"
import { useState, useEffect } from "react"
import { Database } from "@/types/supabase"
import { ArrowUpDown, ArrowDown, ArrowUp, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PerformanceData {
  cumulative: {
    total: { percent: number; dollar: number }
    day: { percent: number; dollar: number }
    week: { percent: number; dollar: number }
    month: { percent: number | null; dollar: number | null }
    ytd: { percent: number | null; dollar: number | null }
    threeMonth: { percent: number | null; dollar: number | null }
    twoYear: { percent: number | null; dollar: number | null }
    fourYear: { percent: number | null; dollar: number | null }
    year: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
  compoundGrowth: {
    total: number | null
    oneYear: number | null
    twoYear: number | null
    threeYear: number | null
    fourYear: number | null
    fiveYear: number | null
    sixYear: number | null
    sevenYear: number | null
    eightYear: number | null
  }
}

type CostBasisResult = {
  totalCostBasis: number
  averageCost: number
  unrealizedGain: number
  unrealizedGainPercent: number
  potentialTaxLiabilityST: number
  potentialTaxLiabilityLT: number
  realizedGains: number
  remainingBtc: number
}

// Define Order type based on schema if not already done globally
type Order = Database['public']['Tables']['orders']['Row']

type SortField = 'method' | 'totalBtc' | 'costBasis' | 'averageCost' | 'realizedGains' | 'unrealizedGain' | 'unrealizedGainPercent' | 'taxLiabilityST' | 'taxLiabilityLT'
type SortConfig = { field: SortField, direction: 'asc' | 'desc' }

export function PerformanceReturns({ data }: { data: PerformanceData }) {
  const { supabase } = useSupabase()
  const [fifoResults, setFifoResults] = useState<CostBasisResult | null>(null)
  const [lifoResults, setLifoResults] = useState<CostBasisResult | null>(null)
  const [averageResults, setAverageResults] = useState<CostBasisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'method', direction: 'asc' })

  // Function to handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(currentConfig => ({
      field,
      direction: currentConfig.field === field && currentConfig.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  // Function to get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-bitcoin-orange" />
    ) : (
      <ArrowDown className="h-4 w-4 text-bitcoin-orange" />
    )
  }

  // Function to sort the results
  const getSortedResults = () => {
    const results = [
      { name: 'Average Cost', results: averageResults },
      { name: 'FIFO', results: fifoResults },
      { name: 'LIFO', results: lifoResults }
    ].filter((item): item is { name: string; results: CostBasisResult } => item.results !== null)

    return results.sort((a, b) => {
      if (!sortConfig.field) return 0

      let comparison = 0
      switch (sortConfig.field) {
        case 'method':
          comparison = a.name.localeCompare(b.name)
          break
        case 'totalBtc':
          comparison = a.results.remainingBtc - b.results.remainingBtc
          break
        case 'costBasis':
          comparison = a.results.totalCostBasis - b.results.totalCostBasis
          break
        case 'averageCost':
          comparison = a.results.averageCost - b.results.averageCost
          break
        case 'realizedGains':
          comparison = a.results.realizedGains - b.results.realizedGains
          break
        case 'unrealizedGain':
          comparison = a.results.unrealizedGain - b.results.unrealizedGain
          break
        case 'unrealizedGainPercent':
          comparison = a.results.unrealizedGainPercent - b.results.unrealizedGainPercent
          break
        case 'taxLiabilityST':
          comparison = a.results.potentialTaxLiabilityST - b.results.potentialTaxLiabilityST
          break
        case 'taxLiabilityLT':
          comparison = a.results.potentialTaxLiabilityLT - b.results.potentialTaxLiabilityLT
          break
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Auth error or no user:', userError)
          throw new Error(userError?.message || 'User not authenticated')
        }

        // 2. Fetch necessary data in parallel
        const [priceResult, ordersResult] = await Promise.all([
          // Fetch latest price
          supabase
            .from('spot_price')
            .select('price_usd')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single(),
          // Fetch user orders with specific columns
          supabase
            .from('orders')
            .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
        ])
        
        // Check for errors
        if (priceResult.error) throw priceResult.error
        if (ordersResult.error) throw ordersResult.error
        if (!priceResult.data) throw new Error('No Bitcoin price data available')

        const currentPrice = priceResult.data.price_usd
        const orders = ordersResult.data || []

        // 3. Calculate results for each method using the fetched data
        // Note: calculateCostBasis might need adjustment if it's still async internally
        // (It shouldn't be if data fetching was fully removed)
        const fifo = await calculateCostBasis(user.id, 'FIFO', orders, currentPrice)
        const lifo = await calculateCostBasis(user.id, 'LIFO', orders, currentPrice)
        const average = await calculateCostBasis(user.id, 'Average Cost', orders, currentPrice)

        setFifoResults(fifo)
        setLifoResults(lifo)
        setAverageResults(average)

      } catch (err) {
        console.error('Error loading cost basis data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cost Basis Method Comparison Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-medium mb-4">Cost Basis Method</h3>
            {loading ? (
              <div>Loading cost basis calculations...</div>
            ) : error ? (
              <div>Error: {error}</div>
            ) : !fifoResults || !lifoResults || !averageResults ? (
              <div>No cost basis data available</div>
            ) : (
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead onClick={() => handleSort('method')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Method {getSortIcon('method')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('totalBtc')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Total BTC {getSortIcon('totalBtc')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('costBasis')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Cost Basis {getSortIcon('costBasis')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('averageCost')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Average Cost {getSortIcon('averageCost')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('realizedGains')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Realized Gains {getSortIcon('realizedGains')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('unrealizedGain')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Unrealized Gains {getSortIcon('unrealizedGain')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('unrealizedGainPercent')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Unrealized % {getSortIcon('unrealizedGainPercent')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('taxLiabilityST')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Tax Liability ST {getSortIcon('taxLiabilityST')}
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger className="cursor-default">
                              <Info className="h-4 w-4 text-bitcoin-orange" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Consult tax advisor for actual liability</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('taxLiabilityLT')} className="cursor-pointer w-[10.625%] text-center">
                      <div className="flex items-center justify-center gap-2">
                        Tax Liability LT {getSortIcon('taxLiabilityLT')}
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger className="cursor-default">
                              <Info className="h-4 w-4 text-bitcoin-orange" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Consult tax advisor for actual liability</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedResults().map(({ name, results }) => (
                    <TableRow key={name} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-center w-[10.625%]">{name}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{results.remainingBtc.toFixed(8)}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{formatCurrency(results.totalCostBasis)}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{formatCurrency(results.averageCost)}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{formatCurrency(results.realizedGains)}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{formatCurrency(results.unrealizedGain)}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{formatPercent(results.unrealizedGainPercent)}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{formatCurrency(results.potentialTaxLiabilityST)}</TableCell>
                      <TableCell className="text-center w-[10.625%]">{formatCurrency(results.potentialTaxLiabilityLT)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Cumulative Returns Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-medium mb-4">
              Cumulative Returns
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger className="cursor-default">
                    <Info className="ml-2 h-4 w-4 text-bitcoin-orange inline-block" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shows the total return of your portfolio over different time periods.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center w-[10.625%]"></TableHead>
                  <TableHead className="text-center w-[10.625%]">1-Month</TableHead>
                  <TableHead className="text-center w-[10.625%]">3-Month</TableHead>
                  <TableHead className="text-center w-[10.625%]">YTD</TableHead>
                  <TableHead className="text-center w-[10.625%]">1-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">2-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">3-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">4-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">5-Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">Percent</TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.month.percent ? formatPercent(data.cumulative.month.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeMonth.percent ? formatPercent(data.cumulative.threeMonth.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.ytd.percent ? formatPercent(data.cumulative.ytd.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.year.percent ? formatPercent(data.cumulative.year.percent) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.twoYear?.percent && data.cumulative.twoYear.percent >= 0 ? "text-green-500" : data.cumulative.twoYear?.percent ? "text-red-500" : ""}`}>
                    {data.cumulative.twoYear?.percent !== null && data.cumulative.twoYear?.percent !== undefined 
                      ? formatPercent(data.cumulative.twoYear.percent) 
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeYear.percent ? formatPercent(data.cumulative.threeYear.percent) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.fourYear?.percent && data.cumulative.fourYear.percent >= 0 ? "text-green-500" : data.cumulative.fourYear?.percent ? "text-red-500" : ""}`}>
                    {data.cumulative.fourYear?.percent !== null && data.cumulative.fourYear?.percent !== undefined 
                      ? formatPercent(data.cumulative.fourYear.percent) 
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.fiveYear.percent ? formatPercent(data.cumulative.fiveYear.percent) : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">Dollar</TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.month.dollar ? formatCurrency(data.cumulative.month.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeMonth.dollar ? formatCurrency(data.cumulative.threeMonth.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.ytd.dollar ? formatCurrency(data.cumulative.ytd.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.year.dollar ? formatCurrency(data.cumulative.year.dollar) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.twoYear?.dollar && data.cumulative.twoYear.dollar >= 0 ? "text-green-500" : data.cumulative.twoYear?.dollar ? "text-red-500" : ""}`}>
                    {data.cumulative.twoYear?.dollar !== null && data.cumulative.twoYear?.dollar !== undefined 
                      ? formatCurrency(data.cumulative.twoYear.dollar) 
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeYear.dollar ? formatCurrency(data.cumulative.threeYear.dollar) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.fourYear?.dollar && data.cumulative.fourYear.dollar >= 0 ? "text-green-500" : data.cumulative.fourYear?.dollar ? "text-red-500" : ""}`}>
                    {data.cumulative.fourYear?.dollar !== null && data.cumulative.fourYear?.dollar !== undefined 
                      ? formatCurrency(data.cumulative.fourYear.dollar) 
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.fiveYear.dollar ? formatCurrency(data.cumulative.fiveYear.dollar) : "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Compound Growth Rate Table (previously Annualized Returns) */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-medium mb-4">
              Compound Growth Rate
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger className="cursor-default">
                    <Info className="ml-2 h-4 w-4 text-bitcoin-orange inline-block" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shows the annual growth rate of your portfolio over different time periods.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center w-[10.625%]"></TableHead>
                  <TableHead className="text-center w-[10.625%]">1-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">2-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">3-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">4-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">5-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">6-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">7-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">8-Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">
                    Your Portfolio
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.oneYear ? formatPercent(data.compoundGrowth.oneYear) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.twoYear ? formatPercent(data.compoundGrowth.twoYear) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.threeYear ? formatPercent(data.compoundGrowth.threeYear) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.fourYear ? formatPercent(data.compoundGrowth.fourYear) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.fiveYear ? formatPercent(data.compoundGrowth.fiveYear) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.sixYear ? formatPercent(data.compoundGrowth.sixYear) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.sevenYear ? formatPercent(data.compoundGrowth.sevenYear) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                    {data.compoundGrowth.eightYear ? formatPercent(data.compoundGrowth.eightYear) : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">Bitcoin</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+48%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+79%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+34%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+15%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+63%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+62%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+39%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+70%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">Gold</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+42%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+29%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+21%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+17%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+14%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+17%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+14%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+13%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">S&P 500</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+8%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+15%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+10%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+7%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+14%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+11%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+11%</TableCell>
                  <TableCell className="text-center w-[10.625%] text-green-500">+11%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 