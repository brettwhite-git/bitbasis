"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, SendHorizontal } from "lucide-react"
import { getTransactions } from "@/lib/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

type Transaction = Database['public']['Tables']['transactions']['Row']

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        
        // Check authentication first
        const supabase = createClientComponentClient<Database>()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw new Error('Authentication error: ' + authError.message)
        }
        
        if (!user) {
          throw new Error('Please sign in to view transactions')
        }

        // Fetch transactions
        const { data, error } = await getTransactions()
        if (error) throw error
        if (data) {
          // Sort by date descending and take the most recent 5
          const sortedData = [...data].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ).slice(0, 5)
          setTransactions(sortedData)
        }
      } catch (err) {
        console.error('Failed to load transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatBTC = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount)
  }

  const getTotalFees = (transaction: Transaction) => {
    return (transaction.network_fee || 0) + (transaction.service_fee || 0)
  }

  const getAmount = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'Buy':
      case 'Receive':
        return transaction.received_amount || 0
      case 'Sell':
      case 'Send':
        return transaction.sent_amount || 0
      default:
        return 0
    }
  }

  const getTotal = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'Buy':
        return transaction.buy_amount || 0
      case 'Sell':
        return transaction.sell_amount || 0
      case 'Send':
      case 'Receive':
        const amount = getAmount(transaction)
        return amount * (transaction.price || 0)
      default:
        return 0
    }
  }

  const isShortTerm = (date: string) => {
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
                    transaction.type === "Buy" 
                      ? "default" 
                      : transaction.type === "Sell"
                      ? "destructive"
                      : "secondary"
                  }
                  className={`w-[100px] flex items-center justify-center ${
                    transaction.type === "Buy" 
                      ? "bg-bitcoin-orange" 
                      : transaction.type === "Sell"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                >
                  {transaction.type === "Buy" ? (
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                  ) : transaction.type === "Sell" ? (
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                  ) : transaction.type === "Send" ? (
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

