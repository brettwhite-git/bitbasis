"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSupabase } from "@/components/providers/supabase-provider"
import { calculateCostBasis } from "@/lib/portfolio"
import { formatCurrency, formatPercent, cn } from "@/lib/utils"
import { Database } from "@/types/supabase"
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react"

type Transaction = Database['public']['Tables']['transactions']['Row']
type CostBasisResult = {
  totalCostBasis: number
  averageCost: number
  unrealizedGain: number
  unrealizedGainPercent: number
  potentialTaxLiability: number
  realizedGains: number
  remainingBtc: number
}

type SortField = 'method' | 'totalBtc' | 'costBasis' | 'averageCost' | 'realizedGains' | 'unrealizedGain' | 'unrealizedGainPercent' | 'taxLiability'
type SortConfig = {
  field: SortField | null
  direction: 'asc' | 'desc'
}

export function CostBasisComparison() {
  const { supabase } = useSupabase()
  const [transactions, setTransactions] = useState<Transaction[]>([])
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
        case 'taxLiability':
          comparison = a.results.potentialTaxLiability - b.results.potentialTaxLiability
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

        // Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true })

        if (txError) throw txError
        if (!txData || txData.length === 0) {
          console.log('No transactions found')
          setError('No transactions found')
          return
        }

        // Log transaction summary
        console.log('\nTransaction Summary:', {
          totalTransactions: txData.length,
          buyTransactions: txData.filter((t: Transaction) => t.type === 'Buy').length,
          sellTransactions: txData.filter((t: Transaction) => t.type === 'Sell').length,
          dateRange: {
            first: txData[0].date,
            last: txData[txData.length - 1].date
          }
        })

        // Log first few transactions for verification
        console.log('\nSample Transactions:', 
          txData.slice(0, 3).map((tx: Transaction) => ({
            date: tx.date,
            type: tx.type,
            received: tx.received_amount ? `${tx.received_amount} ${tx.received_currency}` : null,
            sent: tx.sell_amount ? `${tx.sell_amount} ${tx.sell_currency}` : null,
            price: tx.price
          }))
        )

        setTransactions(txData)

        // Calculate results for each method
        const fifo = await calculateCostBasis(txData, 'FIFO', supabase)
        const lifo = await calculateCostBasis(txData, 'LIFO', supabase)
        const average = await calculateCostBasis(txData, 'Average Cost', supabase)

        // Log results for comparison
        console.log('\nResults Comparison:', {
          FIFO: {
            remainingBtc: fifo.remainingBtc,
            totalCostBasis: fifo.totalCostBasis,
            realizedGains: fifo.realizedGains
          },
          LIFO: {
            remainingBtc: lifo.remainingBtc,
            totalCostBasis: lifo.totalCostBasis,
            realizedGains: lifo.realizedGains
          },
          AverageCost: {
            remainingBtc: average.remainingBtc,
            totalCostBasis: average.totalCostBasis,
            realizedGains: average.realizedGains
          }
        })

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

  if (loading) return <div>Loading cost basis calculations...</div>
  if (error) return <div>Error: {error}</div>
  if (!fifoResults || !lifoResults || !averageResults) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Basis Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead onClick={() => handleSort('method')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Method {getSortIcon('method')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('totalBtc')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Total BTC {getSortIcon('totalBtc')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('costBasis')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Cost Basis {getSortIcon('costBasis')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('averageCost')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Average Cost {getSortIcon('averageCost')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('realizedGains')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Realized Gains {getSortIcon('realizedGains')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('unrealizedGain')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Unrealized Gains {getSortIcon('unrealizedGain')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('unrealizedGainPercent')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Unrealized % {getSortIcon('unrealizedGainPercent')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('taxLiability')} className="cursor-pointer">
                <div className="flex items-center justify-center gap-2">
                  Tax Liability {getSortIcon('taxLiability')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedResults().map(({ name, results }) => (
              <TableRow key={name} className="hover:bg-muted/50">
                <TableCell className="font-medium text-center">{name}</TableCell>
                <TableCell className="text-center">{results.remainingBtc.toFixed(8)}</TableCell>
                <TableCell className="text-center">{formatCurrency(results.totalCostBasis)}</TableCell>
                <TableCell className="text-center">{formatCurrency(results.averageCost)}</TableCell>
                <TableCell className="text-center">{formatCurrency(results.realizedGains)}</TableCell>
                <TableCell className="text-center">{formatCurrency(results.unrealizedGain)}</TableCell>
                <TableCell className="text-center">{formatPercent(results.unrealizedGainPercent)}</TableCell>
                <TableCell className="text-center">{formatCurrency(results.potentialTaxLiability)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

