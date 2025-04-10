"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, SendHorizontal } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/types/supabase"

type Order = Database['public']['Tables']['orders']['Row']
type Transfer = Database['public']['Tables']['transfers']['Row']

interface UnifiedTransaction {
  id: string
  date: string
  type: 'buy' | 'sell' | 'withdrawal' | 'deposit'
  btc_amount: number | null
  usd_value: number | null
  price: number | null
  fee_usd: number | null
  exchange: string | null
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) throw new Error('Authentication error: ' + authError.message)
        if (!user) throw new Error('Please sign in to view transactions')

        // Fetch orders and transfers in parallel
        const [ordersResult, transfersResult] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(5),
          supabase
            .from('transfers')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(5)
        ])

        if (ordersResult.error) throw ordersResult.error
        if (transfersResult.error) throw transfersResult.error

        // Map orders to unified format
        const mappedOrders = (ordersResult.data || []).map((order): UnifiedTransaction => ({
          id: `order-${order.id}`,
          date: order.date,
          type: order.type,
          btc_amount: order.type === 'buy' ? order.received_btc_amount : order.sell_btc_amount,
          usd_value: order.type === 'buy' ? order.buy_fiat_amount : order.received_fiat_amount,
          price: order.price,
          fee_usd: order.service_fee_currency === 'USD' ? order.service_fee : null,
          exchange: order.exchange
        }))

        // Map transfers to unified format
        const mappedTransfers = (transfersResult.data || []).map((transfer): UnifiedTransaction => ({
          id: `transfer-${transfer.id}`,
          date: transfer.date,
          type: transfer.type,
          btc_amount: transfer.amount_btc,
          usd_value: transfer.amount_fiat,
          price: transfer.price,
          fee_usd: transfer.fee_amount_btc ? transfer.fee_amount_btc * (transfer.price || 0) : null,
          exchange: null
        }))

        // Combine and sort all transactions
        const allTransactions = [...mappedOrders, ...mappedTransfers]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5) // Take only the 5 most recent

        setTransactions(allTransactions)
      } catch (err) {
        console.error('Failed to load transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }

    if (supabase) {
      loadTransactions()
    }
  }, [supabase])

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatBTC = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount)
  }

  const isShortTerm = (date: string) => {
    const transactionDate = new Date(date)
    const now = new Date()
    const oneYearAgo = new Date(now)
    oneYearAgo.setFullYear(now.getFullYear() - 1)
    return transactionDate > oneYearAgo
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-[300px]">Loading transactions...</div>
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[300px] text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Amount (BTC)</TableHead>
            <TableHead className="hidden md:table-cell">Price (BTC/USD)</TableHead>
            <TableHead>Amount (USD)</TableHead>
            <TableHead className="hidden md:table-cell">Fees (USD)</TableHead>
            <TableHead className="hidden lg:table-cell">Exchange</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">
                {new Date(transaction.date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge
                  className={`w-[100px] flex items-center justify-center text-white ${
                    transaction.type === "buy" 
                      ? "bg-bitcoin-orange" 
                      : transaction.type === "sell"
                      ? "bg-red-500"
                      : transaction.type === "deposit"
                      ? "bg-gray-500"
                      : "bg-blue-500"
                  }`}
                >
                  {transaction.type === "buy" ? (
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                  ) : transaction.type === "sell" ? (
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                  ) : transaction.type === "deposit" ? (
                    <SendHorizontal className="mr-2 h-4 w-4" />
                  ) : (
                    <SendHorizontal className="mr-2 h-4 w-4 rotate-180" />
                  )}
                  {transaction.type.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`w-[80px] flex items-center justify-center ${
                    isShortTerm(transaction.date)
                      ? "border-green-500 text-green-500"
                      : "border-purple-500 text-purple-500"
                  }`}
                >
                  {isShortTerm(transaction.date) ? "SHORT" : "LONG"}
                </Badge>
              </TableCell>
              <TableCell>{formatBTC(transaction.btc_amount)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {formatCurrency(transaction.price)}
              </TableCell>
              <TableCell>{formatCurrency(transaction.usd_value)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {formatCurrency(transaction.fee_usd)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {transaction.exchange 
                  ? transaction.exchange.charAt(0).toUpperCase() + transaction.exchange.slice(1).toLowerCase()
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

