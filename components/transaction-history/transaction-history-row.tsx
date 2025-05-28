"use client"

import { useState, memo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2,
  ExternalLink
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatBTC, formatCurrency, formatDate } from "@/lib/utils/format"
import { TransactionHistoryAccordion } from "./transaction-history-accordion"
import { useBitcoinPrice } from "@/lib/hooks/useBitcoinPrice"

interface UnifiedTransaction {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  date: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  asset: string
  sent_amount: number | null
  sent_currency: string | null
  sent_cost_basis: number | null
  from_address: string | null
  from_address_name: string | null
  to_address: string | null
  to_address_name: string | null
  received_amount: number | null
  received_currency: string | null
  received_cost_basis: number | null
  fee_amount: number | null
  fee_currency: string | null
  fee_cost_basis: number | null
  realized_return: number | null
  fee_realized_return: number | null
  transaction_hash: string | null
  comment: string | null
  price: number | null
  csv_upload_id: string | null
}

interface TransactionHistoryRowProps {
  transaction: UnifiedTransaction
  isSelected: boolean
  onSelect: () => void
}

/**
 * Enhanced transaction history row with condensed structure and accordion details
 * Structure: [✓] [Date] [Type] [Term] [From] [To] [Amount] [PNL] [Gain] [Balance] [⚙️] [▼]
 */
export const TransactionHistoryRow = memo(function TransactionHistoryRow({
  transaction,
  isSelected,
  onSelect
}: TransactionHistoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Get current Bitcoin price for PNL calculations
  const { price: currentBitcoinPrice, loading: priceLoading } = useBitcoinPrice()
  
  // Helper functions
  const getTransactionBadge = (type: string) => {
    const variants = {
      buy: "bg-green-900/50 text-green-400 border-green-700/50",
      sell: "bg-red-900/50 text-red-400 border-red-700/50",
      deposit: "bg-blue-900/50 text-blue-400 border-blue-700/50",
      withdrawal: "bg-orange-900/50 text-orange-400 border-orange-700/50",
      interest: "bg-purple-900/50 text-purple-400 border-purple-700/50"
    }
    
    return (
      <Badge className={`${variants[type as keyof typeof variants]} text-xs font-medium min-w-[100px] inline-flex items-center justify-center px-2`}>
        {type.toUpperCase()}
      </Badge>
    )
  }

  // Note: getTermBadge function available for accordion/utility use
  // Term information removed from main row but available in accordion details and via Term filter
  const getTermBadge = (date: string, type: string) => {
    if (type !== 'buy' && type !== 'sell') return null
    
    // Calculate if transaction is short-term (< 1 year) or long-term (>= 1 year)
    const transactionDate = new Date(date)
    const currentDate = new Date()
    const daysDiff = (currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
    const isLongTerm = daysDiff >= 365
    
    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${isLongTerm 
          ? 'border-bitcoin-orange/50 text-bitcoin-orange' 
          : 'border-gray-600 text-gray-400'
        }`}
      >
        {isLongTerm ? 'Long' : 'Short'}
      </Badge>
    )
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      {/* Main Row */}
      <TableRow className="group hover:bg-gray-800/20">
        {/* Selection Checkbox */}
        <TableCell className="text-center px-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select transaction from ${formatDate(transaction.date)}`}
            className={`border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange transition-opacity ${
              isSelected ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
            }`}
          />
        </TableCell>
        
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
          {getTransactionBadge(transaction.type)}
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
        
        {/* Sent Amount */}
        <TableCell className="text-center px-4">
          {transaction.sent_amount && transaction.sent_currency ? (
            <span className="text-sm font-medium">
              {(() => {
                // Net amount that actually got exchanged for BTC (sent_amount - fee_amount)
                const sentAmount = transaction.sent_amount
                const feeAmount = transaction.fee_amount || 0
                const netExchangedAmount = sentAmount - feeAmount
                
                return transaction.sent_currency === 'BTC' 
                  ? formatBTC(netExchangedAmount)
                  : formatCurrency(netExchangedAmount)
              })()}
            </span>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </TableCell>
        
        {/* Received Amount */}
        <TableCell className="text-center px-4">
          {transaction.received_amount && transaction.received_currency ? (
            <span className="text-sm font-medium">
              {transaction.received_currency === 'BTC' 
                ? formatBTC(transaction.received_amount)
                : formatCurrency(transaction.received_amount)
              }
            </span>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </TableCell>
        
        {/* PNL - Placeholder for now */}
        <TableCell className="hidden md:table-cell text-center px-4">
          <span className={(() => {
            // Calculate PNL: current value - adjusted cost basis (sent_amount) (only for buy transactions)
            if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
              const currentValue = transaction.received_amount * currentBitcoinPrice
              const adjustedCostBasis = transaction.sent_amount
              const pnl = currentValue - adjustedCostBasis
              return pnl >= 0 ? "text-green-400 text-xs font-medium" : "text-red-400 text-xs font-medium"
            }
            return "text-xs text-gray-500"
          })()}>
            {(() => {
              if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                const currentValue = transaction.received_amount * currentBitcoinPrice
                const adjustedCostBasis = transaction.sent_amount
                const pnl = currentValue - adjustedCostBasis
                return `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`
              }
              return priceLoading ? "..." : "-"
            })()}
          </span>
        </TableCell>
        
        {/* Gain % - Placeholder for now */}
        <TableCell className="hidden md:table-cell text-center px-4">
          <span className={(() => {
            // Calculate Gain %: ((current value - adjusted cost basis) / adjusted cost basis) * 100 (only for buy transactions)
            if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
              const currentValue = transaction.received_amount * currentBitcoinPrice
              const adjustedCostBasis = transaction.sent_amount
              const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
              return gainPercent >= 0 ? "text-green-400 text-xs font-medium" : "text-red-400 text-xs font-medium"
            }
            return "text-xs text-gray-500"
          })()}>
            {(() => {
              if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                const currentValue = transaction.received_amount * currentBitcoinPrice
                const adjustedCostBasis = transaction.sent_amount
                const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
                return `${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%`
              }
              return priceLoading ? "..." : "-"
            })()}
          </span>
        </TableCell>
        
        {/* Balance - Placeholder for now */}
        <TableCell className="hidden lg:table-cell text-center px-4">
          <span className="text-xs text-gray-500">-</span>
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
        
        {/* Actions Menu */}
        <TableCell className="text-center px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Transaction
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Transaction
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Transaction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      
      {/* Accordion Details Row */}
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={13} className="p-0 border-0">
            <TransactionHistoryAccordion transaction={transaction} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}) 