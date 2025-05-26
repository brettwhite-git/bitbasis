"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatPercent } from "@/lib/utils/utils"
import { ArrowUpDown, ArrowDown, ArrowUp, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSupabase } from "@/components/providers/supabase-provider"
import { calculateCostBasis } from "@/lib/core/portfolio"

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

type SortField = 'method' | 'totalBtc' | 'costBasis' | 'averageCost' | 'realizedGains' | 'unrealizedGain' | 'unrealizedGainPercent' | 'taxLiabilityST' | 'taxLiabilityLT' | 'totalTaxLiability'
type SortConfig = { field: SortField, direction: 'asc' | 'desc' }

export function ReturnsTable() {
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
      { name: 'FIFO', results: fifoResults },
      { name: 'LIFO', results: lifoResults },
      { name: 'HIFO', results: averageResults }
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
        case 'totalTaxLiability':
          const aTotalTax = a.results.potentialTaxLiabilityST + a.results.potentialTaxLiabilityLT
          const bTotalTax = b.results.potentialTaxLiabilityST + b.results.potentialTaxLiabilityLT
          comparison = aTotalTax - bTotalTax
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
        const fifo = await calculateCostBasis(user.id, 'FIFO', orders, currentPrice)
        const lifo = await calculateCostBasis(user.id, 'LIFO', orders, currentPrice)
        const average = await calculateCostBasis(user.id, 'HIFO', orders, currentPrice)

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
    <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div>
        <h3 className="text-sm font-medium mb-4 text-white">Cost Basis Method</h3>
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
                <TableHead onClick={() => handleSort('method')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Method {getSortIcon('method')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('totalBtc')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Total BTC {getSortIcon('totalBtc')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('costBasis')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Cost Basis {getSortIcon('costBasis')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('realizedGains')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Realized Gains {getSortIcon('realizedGains')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('unrealizedGain')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Unrealized Gains {getSortIcon('unrealizedGain')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('unrealizedGainPercent')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Unrealized % {getSortIcon('unrealizedGainPercent')}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('taxLiabilityST')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Tax Liability ST {getSortIcon('taxLiabilityST')}
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">
                          <Info className="h-4 w-4 text-bitcoin-orange" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Short-term tax liability (37% rate)<br/>Consult tax advisor for actual liability</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('taxLiabilityLT')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Tax Liability LT {getSortIcon('taxLiabilityLT')}
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">
                          <Info className="h-4 w-4 text-bitcoin-orange" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Long-term tax liability (20% rate)<br/>Consult tax advisor for actual liability</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('totalTaxLiability')} className="cursor-pointer w-[11.11%] text-center">
                  <div className="flex items-center justify-center gap-2">
                    Total Tax Liability {getSortIcon('totalTaxLiability')}
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">
                          <Info className="h-4 w-4 text-bitcoin-orange" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sum of ST (37%) and LT (20%) tax liabilities<br/>Consult tax advisor for actual liability</p>
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
                  <TableCell className="font-medium text-center w-[11.11%]">{name}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{results.remainingBtc.toFixed(8)}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{formatCurrency(results.totalCostBasis)}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{formatCurrency(results.realizedGains)}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{formatCurrency(results.unrealizedGain)}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{formatPercent(results.unrealizedGainPercent)}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{formatCurrency(results.potentialTaxLiabilityST)}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{formatCurrency(results.potentialTaxLiabilityLT)}</TableCell>
                  <TableCell className="text-center w-[11.11%]">{formatCurrency(results.potentialTaxLiabilityST + results.potentialTaxLiabilityLT)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
