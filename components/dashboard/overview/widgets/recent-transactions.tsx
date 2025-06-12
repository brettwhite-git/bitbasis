"use client"

import { useState, useEffect, memo } from "react"
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { formatBTC, formatCurrency } from "@/lib/utils/format"
import { TransactionBadge } from "@/components/shared/badges"
import { UnifiedTransaction } from "@/types/transactions"
import { TransactionType } from "@/lib/utils/transaction-utils"
import { useBitcoinPrice } from "@/lib/hooks"
import { TransactionAccordion } from "@/components/transactions/display/accordion"
import { TransactionMobileView } from "@/components/transactions/table"
import { EditDrawerProvider } from "@/components/transactions/edit"
import Link from "next/link"

// Import data table components for loading/error states
import { DataTableLoading } from "@/components/shared/data-table/DataTableLoading"
import { DataTableError } from "@/components/shared/data-table/DataTableError"

/**
 * Simplified headers for recent transactions (no selection, no actions)
 */
const RecentTransactionsHeaders = memo(function RecentTransactionsHeaders() {
  return (
    <TableHeader>
      <TableRow>
        {/* Date - shows date on top, time below */}
        <TableHead className="w-[120px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Date
          </div>
        </TableHead>
        
        {/* Transaction Type */}
        <TableHead className="w-[100px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Type
          </div>
        </TableHead>
        
        {/* Sent Amount - what was sent out */}
        <TableHead className="w-[120px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Sent
          </div>
        </TableHead>
        
        {/* From - source address/name */}
        <TableHead className="w-[140px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            From
          </div>
        </TableHead>
        
        {/* Flow Arrow */}
        <TableHead className="w-[40px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            {/* Empty column for flow arrow */}
          </div>
        </TableHead>
        
        {/* To - destination address/name */}
        <TableHead className="w-[140px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            To
          </div>
        </TableHead>
        
        {/* Received Amount - what was received */}
        <TableHead className="w-[120px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Received
          </div>
        </TableHead>
        
        {/* Gain/Income - Profit & Loss */}
        <TableHead className="hidden md:table-cell w-[100px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Gain/Income
          </div>
        </TableHead>
        
        {/* Gain - Percentage gain/loss */}
        <TableHead className="hidden md:table-cell w-[100px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Gain %
          </div>
        </TableHead>
        
        {/* Accordion toggle column */}
        <TableHead className="w-[60px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Details
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
})

/**
 * Simplified row for recent transactions (no selection, no actions)
 */
const RecentTransactionRow = memo(function RecentTransactionRow({
  transaction
}: {
  transaction: UnifiedTransaction
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { price: currentBitcoinPrice, loading: priceLoading } = useBitcoinPrice()
  
  const getTransactionBadge = (type: TransactionType) => {
    return <TransactionBadge type={type} />
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      {/* Main Row */}
      <TableRow className="group hover:bg-gray-800/20">
        {/* Date - date on top, time below */}
        <TableCell className="text-center px-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {new Date(transaction.date).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </TableCell>
        
        {/* Type */}
        <TableCell className="text-center px-4">
          {getTransactionBadge(transaction.type as TransactionType)}
        </TableCell>
        
        {/* Sent Amount */}
        <TableCell className="text-center px-4">
          {transaction.sent_amount && transaction.sent_currency ? (
            <span className="text-sm font-medium">
              {(() => {
                const sentAmount = transaction.sent_amount
                const formattedValue = transaction.sent_currency === 'BTC' 
                  ? formatBTC(sentAmount)
                  : formatCurrency(sentAmount)
                return `-${formattedValue}`
              })()}
            </span>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </TableCell>
        
        {/* From */}
        <TableCell className="text-center px-4">
          <span className="text-sm">
            {transaction.from_address_name || "-"}
          </span>
        </TableCell>
        
        {/* Flow Arrow */}
        <TableCell className="text-center px-2">
          <span className="text-gray-400 text-sm">→</span>
        </TableCell>
        
        {/* To */}
        <TableCell className="text-center px-4">
          <span className="text-sm">
            {transaction.to_address_name || "-"}
          </span>
        </TableCell>
        
        {/* Received Amount */}
        <TableCell className="text-center px-4">
          {transaction.received_amount && transaction.received_currency ? (
            <span className="text-sm font-medium">
              {(() => {
                const formattedValue = transaction.received_currency === 'BTC' 
                  ? formatBTC(transaction.received_amount)
                  : formatCurrency(transaction.received_amount)
                return `+${formattedValue}`
              })()}
            </span>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </TableCell>
        
        {/* Gain/Income */}
        <TableCell className="hidden md:table-cell w-[100px] text-center">
          <div className={(() => {
            if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
              const currentValue = transaction.received_amount * currentBitcoinPrice
              const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
              const gainIncome = currentValue - adjustedCostBasis
              return gainIncome >= 0 ? "text-green-400 text-xs font-medium" : "text-red-400 text-xs font-medium"
            }
            return "text-xs text-gray-500"
          })()}>
            {(() => {
              if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                const currentValue = transaction.received_amount * currentBitcoinPrice
                const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
                const gainIncome = currentValue - adjustedCostBasis
                return `${gainIncome >= 0 ? '+' : ''}${formatCurrency(gainIncome)}`
              }
              return priceLoading ? "..." : "-"
            })()}
          </div>
        </TableCell>
        
        {/* Gain % */}
        <TableCell className="hidden md:table-cell text-center px-4">
          <span className={(() => {
            if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
              const currentValue = transaction.received_amount * currentBitcoinPrice
              const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
              const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
              return gainPercent >= 0 ? "text-green-400 text-xs font-medium" : "text-red-400 text-xs font-medium"
            }
            return "text-xs text-gray-500"
          })()}>
            {(() => {
              if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                const currentValue = transaction.received_amount * currentBitcoinPrice
                const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
                const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
                return `${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%`
              }
              return priceLoading ? "..." : "-"
            })()}
          </span>
        </TableCell>
        
        {/* Accordion Toggle */}
        <TableCell className="text-center px-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>
      
      {/* Accordion Details Row */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={10} className="px-0 py-0">
            <div className="border-t border-gray-700/50">
                                      <TransactionAccordion transaction={transaction} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
})

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/transaction-history')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.error) {
          throw new Error(result.error)
        }

        // Handle both possible response formats and limit to 5
        const transactionData = result.data || result.transactions || []
        
        // Sort by date (newest first) and limit to 5
        const sortedTransactions = transactionData
          .sort((a: UnifiedTransaction, b: UnifiedTransaction) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5)
        
        setTransactions(sortedTransactions)

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
    return (
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
        <DataTableLoading colSpan={10} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
        <DataTableError message={error} colSpan={10} />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
        <div className="flex flex-col justify-center items-center h-[300px] text-muted-foreground">
          <div className="text-center">
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs mt-1">Transactions will appear here once you add them</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/transaction-history">
                Add Transactions
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <EditDrawerProvider>
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <RecentTransactionsHeaders />
            <TableBody>
              {transactions.map((transaction) => (
                <RecentTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View - reuse existing component but with no selection/delete */}
        <div className="md:hidden">
                      <TransactionMobileView
            transactions={transactions}
            selectedTransactions={new Set()}
            toggleSelection={() => {}} // No selection in preview
            onDelete={() => {}} // No delete in preview
          />
        </div>
      </div>
    </EditDrawerProvider>
  )
} 