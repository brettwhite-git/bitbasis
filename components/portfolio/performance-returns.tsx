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
    year: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
  annualized: {
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

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Auth error:', userError)
          throw new Error('Authentication failed')
        }

        if (!user) {
          console.error('No user found')
          throw new Error('User not authenticated')
        }

        // Calculate results for each method using userId
        const fifo = await calculateCostBasis(user.id, 'FIFO', supabase)
        const lifo = await calculateCostBasis(user.id, 'LIFO', supabase)
        const average = await calculateCostBasis(user.id, 'Average Cost', supabase)

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
            <h3 className="text-sm font-medium mb-4">Cumulative returns</h3>
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center w-[10.625%]"></TableHead>
                  <TableHead className="text-center w-[10.625%]">24-Hour</TableHead>
                  <TableHead className="text-center w-[10.625%]">1-Week</TableHead>
                  <TableHead className="text-center w-[10.625%]">1-Month</TableHead>
                  <TableHead className="text-center w-[10.625%]">YTD</TableHead>
                  <TableHead className="text-center w-[10.625%]">3-Month</TableHead>
                  <TableHead className="text-center w-[10.625%]">1-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">3-Year</TableHead>
                  <TableHead className="text-center w-[10.625%]">5-Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">Percent</TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.day.percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(data.cumulative.day.percent)}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.week.percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(data.cumulative.week.percent)}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.month.percent ? formatPercent(data.cumulative.month.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.ytd.percent ? formatPercent(data.cumulative.ytd.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeMonth.percent ? formatPercent(data.cumulative.threeMonth.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.year.percent ? formatPercent(data.cumulative.year.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeYear.percent ? formatPercent(data.cumulative.threeYear.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.fiveYear.percent ? formatPercent(data.cumulative.fiveYear.percent) : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">Dollar</TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.day.dollar >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(data.cumulative.day.dollar)}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.cumulative.week.dollar >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(data.cumulative.week.dollar)}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.month.dollar ? formatCurrency(data.cumulative.month.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.ytd.dollar ? formatCurrency(data.cumulative.ytd.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeMonth.dollar ? formatCurrency(data.cumulative.threeMonth.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.year.dollar ? formatCurrency(data.cumulative.year.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.threeYear.dollar ? formatCurrency(data.cumulative.threeYear.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center w-[10.625%]">
                    {data.cumulative.fiveYear.dollar ? formatCurrency(data.cumulative.fiveYear.dollar) : "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Annualized Returns Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-medium mb-4">Annualized returns</h3>
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
                  <TableCell className="font-medium text-center w-[10.625%]">You</TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.oneYear && data.annualized.oneYear >= 0 ? "text-green-500" : data.annualized.oneYear ? "text-red-500" : ""}`}>
                    {data.annualized.oneYear ? formatPercent(data.annualized.oneYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.twoYear && data.annualized.twoYear >= 0 ? "text-green-500" : data.annualized.twoYear ? "text-red-500" : ""}`}>
                    {data.annualized.twoYear ? formatPercent(data.annualized.twoYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.threeYear && data.annualized.threeYear >= 0 ? "text-green-500" : data.annualized.threeYear ? "text-red-500" : ""}`}>
                    {data.annualized.threeYear ? formatPercent(data.annualized.threeYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.fourYear && data.annualized.fourYear >= 0 ? "text-green-500" : data.annualized.fourYear ? "text-red-500" : ""}`}>
                    {data.annualized.fourYear ? formatPercent(data.annualized.fourYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.fiveYear && data.annualized.fiveYear >= 0 ? "text-green-500" : data.annualized.fiveYear ? "text-red-500" : ""}`}>
                    {data.annualized.fiveYear ? formatPercent(data.annualized.fiveYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.sixYear && data.annualized.sixYear >= 0 ? "text-green-500" : data.annualized.sixYear ? "text-red-500" : ""}`}>
                    {data.annualized.sixYear ? formatPercent(data.annualized.sixYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.sevenYear && data.annualized.sevenYear >= 0 ? "text-green-500" : data.annualized.sevenYear ? "text-red-500" : ""}`}>
                    {data.annualized.sevenYear ? formatPercent(data.annualized.sevenYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center w-[10.625%] ${data.annualized.eightYear && data.annualized.eightYear >= 0 ? "text-green-500" : data.annualized.eightYear ? "text-red-500" : ""}`}>
                    {data.annualized.eightYear ? formatPercent(data.annualized.eightYear) : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center w-[10.625%]">Bitcoin</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-green-500`}>120.98%</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-green-500`}>155.41%</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-red-500`}>-64.27%</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-green-500`}>59.71%</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-green-500`}>303.09%</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-green-500`}>92%</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-red-500`}>-73.48%</TableCell>
                  <TableCell className={`text-center w-[10.625%] text-green-500`}>1,369.03%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 