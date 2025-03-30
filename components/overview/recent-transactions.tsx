"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import type { Database } from "@/types/supabase"
import { formatCurrency, formatPercent } from "@/lib/utils"

type Order = Database['public']['Tables']['orders']['Row']

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw new Error('Authentication error: ' + authError.message)
        }
        
        if (!user) {
          throw new Error('Please sign in to view transactions')
        }

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5)

        if (error) throw error

        if (data) {
          setTransactions(data)
        } else {
          setTransactions([])
        }
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

  const formatBTC = (amount: number | null): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount || 0)
  }

  const getTotalFees = (transaction: Order): number => {
    return transaction.type === 'buy' ? (transaction.service_fee || 0) : 0
  }

  const getAmount = (transaction: Order): number => {
    return transaction.type === 'buy' ? (transaction.received_btc_amount || 0) : (transaction.sell_btc_amount || 0)
  }

  const getTotal = (transaction: Order): number => {
    if (transaction.type === 'buy') {
      return (transaction.buy_fiat_amount || 0) + (transaction.service_fee || 0)
    } else if (transaction.type === 'sell') {
      return transaction.received_fiat_amount || 0
    } 
    return 0
  }

  const isShortTerm = (date: string): boolean => {
    const transactionDate = new Date(date)
    const currentYear = new Date().getFullYear()
    return transactionDate.getFullYear() === currentYear
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
            <TableHead className="hidden md:table-cell">Price (USD)</TableHead>
            <TableHead>Total (USD)</TableHead>
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
                  variant={
                    transaction.type === "buy" 
                      ? "default" 
                      : transaction.type === "sell"
                      ? "destructive"
                      : "secondary"
                  }
                  className={`w-[100px] flex items-center justify-center ${
                    transaction.type === "buy" 
                      ? "bg-bitcoin-orange" 
                      : transaction.type === "sell"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                >
                  {transaction.type === "buy" ? (
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                  ) : transaction.type === "sell" ? (
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                  ) : null}
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
              <TableCell>{formatBTC(getAmount(transaction))}</TableCell>
              <TableCell className="hidden md:table-cell">
                ${formatCurrency(transaction.price || 0)}
              </TableCell>
              <TableCell>${formatCurrency(getTotal(transaction))}</TableCell>
              <TableCell className="hidden md:table-cell">
                ${formatCurrency(getTotalFees(transaction))}
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

