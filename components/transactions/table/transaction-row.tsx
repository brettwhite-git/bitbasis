"use client"

import { useState, memo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatBTC, formatCurrency, formatDate } from "@/lib/utils/format"
import { TransactionAccordion } from "../display/accordion"
import { useBitcoinPrice } from "@/lib/hooks"
import { TransactionBadge } from "@/components/shared/badges/transaction-badge"
import { TransactionType } from "@/types/transactions"
import { useEditDrawer } from '@/components/transactions/edit'
import { UnifiedTransaction } from '@/types/transactions'

interface TransactionRowProps {
  transaction: UnifiedTransaction
  isSelected: boolean
  onSelect: () => void
  onDelete?: () => void
}

/**
 * Enhanced transaction history row with condensed structure and accordion details
 * Structure: [✓] [Date] [Type] [Term] [From] [To] [Amount] [Gain/Income] [Gain] [⚙️] [▼]
 */
export const TransactionRow = memo(function TransactionRow({
  transaction,
  isSelected,
  onSelect,
  onDelete
}: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { price: currentBitcoinPrice, loading: priceLoading } = useBitcoinPrice()
  const { openDrawer } = useEditDrawer()
  
  // Helper functions
  const getTransactionBadge = (type: TransactionType) => {
    return <TransactionBadge type={type} />
  }

  // Note: Term information available in accordion details and via Term filter

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleEditTransaction = () => {
    openDrawer(transaction)
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
          {getTransactionBadge(transaction.type as TransactionType)}
        </TableCell>
        
        {/* Sent Amount */}
        <TableCell className="text-center px-4">
          {transaction.sent_amount && transaction.sent_currency ? (
            <span className="text-sm font-medium">
              {(() => {
                // Full sent amount (not subtracting fees)
                const sentAmount = transaction.sent_amount
                
                const formattedValue = transaction.sent_currency === 'BTC' 
                  ? formatBTC(sentAmount)
                  : formatCurrency(sentAmount)
                
                // Always show as negative for sent amounts
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
                
                // Always show as positive for received amounts
                return `+${formattedValue}`
              })()}
            </span>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </TableCell>
        
        {/* Gain/Income - Placeholder for now */}
        <TableCell className="hidden md:table-cell w-[100px] text-center">
          <div className={(() => {
            // Calculate Gain/Income: current value - adjusted cost basis (sent_amount + fee_amount) (only for buy transactions)
            if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
              const currentValue = transaction.received_amount * currentBitcoinPrice
              const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
              const gainIncome = currentValue - adjustedCostBasis
              return gainIncome >= 0 ? "text-green-400 text-sm font-medium" : "text-red-400 text-sm font-medium"
            }
            return "text-sm text-gray-500"
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
        
        {/* Gain % - Placeholder for now */}
        <TableCell className="hidden md:table-cell w-[100px] text-center">
          <div className={(() => {
            // Calculate Gain %: ((current value - adjusted cost basis) / adjusted cost basis) * 100 (only for buy transactions)
            if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
              const currentValue = transaction.received_amount * currentBitcoinPrice
              const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
              const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
              return gainPercent >= 0 ? "text-green-400 text-sm font-medium" : "text-red-400 text-sm font-medium"
            }
            return "text-sm text-gray-500"
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
          </div>
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
              <DropdownMenuItem onClick={handleEditTransaction}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Transaction
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Transaction
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400" onClick={onDelete}>
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
          <TableCell colSpan={100} className="p-0 border-0">
            <TransactionAccordion transaction={transaction} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}) 