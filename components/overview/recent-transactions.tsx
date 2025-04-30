"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, ArrowDownToLine, ArrowUpFromLine, ExternalLink, CircleArrowUp, CircleArrowDown, CircleArrowLeft, CircleArrowRight } from "lucide-react"
import { getTransactions } from "@/lib/supabase"
import { formatCurrency, formatBTC } from "@/lib/utils"
import type { Database } from "@/types/supabase"

// Update the interface to match what getTransactions returns
interface UnifiedTransaction {
  id: string
  date: string
  type: 'Buy' | 'Sell' | 'Deposit' | 'Withdrawal' | 'buy' | 'sell' | 'deposit' | 'withdrawal'
  asset: string
  btc_amount: number | null
  usd_value: number | null
  fee_usd: number | null
  price_at_tx: number | null
  exchange: string | null
  network_fee_btc?: number | null
  txid?: string | null
}

// Add type for getTransactions response
interface TransactionsResponse {
  data: UnifiedTransaction[] | null
  error: Error | null
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Store current date once when component mounts for consistent calculations
  const [currentDate] = useState<Date>(new Date())

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Use the shared getTransactions function
        const result = await getTransactions() as TransactionsResponse
        
        if (result.error) {
          throw result.error
        }

        // Make the transaction objects match our interface 
        // by ensuring all required properties exist
        const unifiedData = (result.data || []).map(tx => ({
          ...tx,
          // Set optional properties if they don't exist
          network_fee_btc: 'network_fee_btc' in tx ? tx.network_fee_btc : null,
          txid: 'txid' in tx ? tx.txid : null,
        })) as UnifiedTransaction[]

        // Take only the 5 most recent transactions
        setTransactions(unifiedData.slice(0, 5))
      } catch (err) {
        console.error('Failed to load recent transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load recent transactions')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const isShortTerm = (date: string) => {
    const transactionDate = new Date(date)
    // Use our stored current date for consistency
    const oneYearAgo = new Date(currentDate)
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1)
    // Return true if the transaction date is AFTER one year ago (less than 1 year hold)
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

  // Render the table structure mirroring TransactionsTable
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {/* Mirror columns from TransactionsTable */}
          <TableRow>
            <TableHead className="text-center w-[80px]">Date</TableHead>
            <TableHead className="text-center w-[125px]">Type</TableHead>
            <TableHead className="text-center w-[80px]">Term</TableHead>
            <TableHead className="text-center w-[80px]">Amount (BTC)</TableHead>
            <TableHead className="hidden md:table-cell text-center w-[80px]">Price (BTC/USD)</TableHead>
            <TableHead className="text-center w-[80px]">Amount (USD)</TableHead>
            <TableHead className="hidden md:table-cell text-center w-[80px]">Fees (USD)</TableHead>
            <TableHead className="hidden lg:table-cell text-center w-[80px]">Exchange</TableHead>
            <TableHead className="hidden lg:table-cell text-center w-[80px]">Fees (BTC)</TableHead>
            <TableHead className="hidden lg:table-cell text-center w-[60px]">TXID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            // TEMPORARY LOG: Check the actual transaction type being rendered
            console.log('[RecentTransactions] Rendering type:', transaction.type);
            return (
              <TableRow key={transaction.id}>
                {/* Mirror cell rendering from TransactionsTable */}
                <TableCell className="text-center px-4">
                  {new Date(transaction.date).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`w-[125px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none ${
                      // Make case-insensitive check like the main transactions table
                      transaction.type?.toLowerCase() === "buy" 
                        ? "bg-gradient-to-r from-bitcoin-orange/90 to-bitcoin-orange/70 border-bitcoin-orange/40 text-white" 
                        : transaction.type?.toLowerCase() === "sell"
                        ? "bg-gradient-to-r from-red-500/90 to-red-400/70 border-red-500/40 text-white"
                        : transaction.type?.toLowerCase() === "deposit"
                        ? "bg-gradient-to-r from-green-500/90 to-green-400/70 border-green-500/40 text-white"
                        : "bg-gradient-to-r from-blue-500/90 to-blue-400/70 border-blue-500/40 text-white"
                    }`}
                  >
                    {/* Also make case-insensitive checks for icons */}
                    {transaction.type?.toLowerCase() === "buy" ? (
                      <CircleArrowRight className="mr-1 h-4 w-4" />
                    ) : transaction.type?.toLowerCase() === "sell" ? (
                      <CircleArrowLeft className="mr-1 h-4 w-4" />
                    ) : transaction.type?.toLowerCase() === "deposit" ? (
                      <CircleArrowDown className="mr-1 h-4 w-4" />
                    ) : (
                      <CircleArrowUp className="mr-1 h-4 w-4" />
                    )}
                    {/* Still display the type in uppercase */}
                    {transaction.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {transaction.type?.toLowerCase() === "buy" || transaction.type?.toLowerCase() === "sell" ? (
                    <Badge
                      variant="outline"
                      className={`w-[70px] inline-flex items-center justify-center ${
                        isShortTerm(transaction.date)
                          ? "border-green-500 text-green-500"
                          : "border-purple-500 text-purple-500"
                      }`}
                    >
                      {isShortTerm(transaction.date) ? "SHORT" : "LONG"}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {formatBTC(transaction.btc_amount, false)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {transaction.price_at_tx !== null ? formatCurrency(transaction.price_at_tx) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {transaction.usd_value !== null ? formatCurrency(transaction.usd_value) : '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {transaction.fee_usd !== null ? formatCurrency(transaction.fee_usd) : '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {transaction.exchange 
                    ? transaction.exchange.charAt(0).toUpperCase() + transaction.exchange.slice(1).toLowerCase()
                    : "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                   {/* Display Network Fee BTC */}
                  {transaction.network_fee_btc && transaction.network_fee_btc !== 0 
                    ? formatBTC(transaction.network_fee_btc, false) 
                    : "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {/* Display TXID link */}
                  {transaction.txid ? (
                    <a 
                      href={`https://mempool.space/tx/${transaction.txid}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700"
                      title="View transaction on Mempool.space"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

