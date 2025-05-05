"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { getTransactions } from "@/lib/supabase/supabase"
import { formatCurrency, formatBTC } from "@/lib/utils/utils"
import type { Database } from "@/types/supabase"
import { TransactionBadge } from "@/components/transactions/badges/TransactionBadge"
import { TermBadge } from "@/components/transactions/badges/TermBadge"

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
        // Remove the incorrect type assertion
        const result = await getTransactions()
        
        if (result.error) {
          throw result.error
        }

        // Check if data exists and contains orders/transfers
        if (result.data && (result.data.orders || result.data.transfers)) {
          // Combine orders and transfers into one array
          const combined = [
            ...(result.data.orders || []).map(tx => ({ ...tx, type: tx.type || 'unknown' })), // Ensure type exists
            ...(result.data.transfers || []).map(tx => ({ ...tx, type: tx.type || 'unknown' })), // Ensure type exists
          ];

          // Sort by date descending (most recent first)
          combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Map to UnifiedTransaction interface (ensure optional fields)
          const unifiedData = combined.map(tx => {
            const isOrder = ['Buy', 'Sell', 'buy', 'sell'].includes(tx.type);
            const isTransfer = ['Deposit', 'Withdrawal', 'deposit', 'withdrawal'].includes(tx.type);

            let btc_amount: number | null = null;
            let usd_value: number | null = null;
            let fee_usd: number | null = null;
            let network_fee_btc: number | null = null;
            let txid: string | null = null;
            let exchange: string | null = null;

            if (isOrder) {
              // Explicitly cast to the expected Order type (adjust if type name differs)
              const order = tx as Database['public']['Tables']['orders']['Row']; 
              btc_amount = order.received_btc_amount ?? order.sell_btc_amount ?? null;
              usd_value = order.buy_fiat_amount ?? order.received_fiat_amount ?? null;
              fee_usd = order.service_fee ?? null;
              exchange = order.exchange ?? null;
              // Orders don't have network_fee_btc or txid directly in this structure
            } else if (isTransfer) {
               // Explicitly cast to the expected Transfer type (adjust if type name differs)
              const transfer = tx as Database['public']['Tables']['transfers']['Row'];
              btc_amount = transfer.amount_btc ?? null;
              usd_value = transfer.amount_fiat ?? null;
              network_fee_btc = transfer.fee_amount_btc ?? null;
              txid = transfer.hash ?? null;
              // Transfers don't have service_fee or exchange directly
            }

            return {
              id: String(tx.id), // Ensure ID is string
              date: tx.date,
              type: tx.type as UnifiedTransaction['type'], // Assume type is validated upstream or default
              asset: tx.asset || 'BTC', // Assume BTC if missing
              price_at_tx: tx.price ?? null,
              btc_amount, // Use mapped value
              usd_value, // Use mapped value
              fee_usd, // Use mapped value
              exchange, // Use mapped value
              network_fee_btc, // Use mapped value
              txid, // Use mapped value
            } as UnifiedTransaction;
          });

          // Take only the 5 most recent transactions
          setTransactions(unifiedData.slice(0, 5))
        } else {
          // Handle case where data is empty or missing orders/transfers
          setTransactions([]);
        }

      } catch (err) {
        console.error('Failed to load recent transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load recent transactions')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

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
          {transactions.map((transaction) => (
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
                <TransactionBadge type={transaction.type} />
              </TableCell>
              <TableCell className="text-center">
                {transaction.type?.toLowerCase() === "buy" || transaction.type?.toLowerCase() === "sell" ? (
                  <TermBadge date={transaction.date} currentDate={currentDate} />
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 