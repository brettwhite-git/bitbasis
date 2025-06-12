"use client"

import { useState, memo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { formatBTC, formatCurrency } from "@/lib/utils/format"
import { TransactionAccordion } from "./accordion"
import { TransactionBadge } from "@/components/shared/badges"
import { TransactionType } from "@/lib/utils/transaction-utils"
import { useEditDrawer } from "@/components/transactions/edit"
import { UnifiedTransaction } from "@/types/transactions"

interface TransactionHistoryRowMobileProps {
  transaction: UnifiedTransaction
  isSelected: boolean
  onSelect: () => void
  onDelete?: () => void
}

/**
 * Mobile-optimized transaction row with expandable details
 */
export const TransactionHistoryRowMobile = memo(function TransactionHistoryRowMobile({
  transaction,
  isSelected,
  onSelect,
  onDelete
}: TransactionHistoryRowMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { openDrawer } = useEditDrawer()
  
  // Helper functions
  const getTransactionBadge = (type: TransactionType) => {
    return <TransactionBadge type={type} />
  }

  const getTermBadge = (date: string, type: string) => {
    if (type !== 'buy' && type !== 'sell') return null
    
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

  const toggleExpand = () => {
    setIsExpanded(prev => !prev)
  }

  const handleEditTransaction = () => {
    openDrawer(transaction)
  }

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Main row (always visible) */}
      <div className="grid grid-cols-[auto,1fr,auto,auto] items-center p-3 gap-x-3">
        {/* Checkbox */}
        <div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select transaction from ${new Date(transaction.date).toLocaleDateString()}`}
            className="border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange"
          />
        </div>
        
        {/* Main content */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {getTransactionBadge(transaction.type as TransactionType)}
            {getTermBadge(transaction.date, transaction.type)}
          </div>
          
          <div className="flex flex-col space-y-1">
            {/* Sent Amount */}
            {transaction.sent_amount && transaction.sent_currency && (
              <div className="text-sm">
                <span className="text-muted-foreground text-xs">Sent: </span>
                <span className="font-medium">
                  {(() => {
                    // Fiat value: full sent amount (not subtracting fees)
                    const sentAmount = transaction.sent_amount
                    
                    const formattedValue = transaction.sent_currency === 'BTC' 
                      ? `${formatBTC(sentAmount, 8, false)} ${transaction.sent_currency}`
                      : `${formatCurrency(sentAmount)} ${transaction.sent_currency}`
                    
                    // Always show as negative for sent amounts
                    return `-${formattedValue}`
                  })()}
                </span>
              </div>
            )}
            
            {/* Received Amount */}
            {transaction.received_amount && transaction.received_currency && (
              <div className="text-sm">
                <span className="text-muted-foreground text-xs">Received: </span>
                <span className="font-medium">
                  {(() => {
                    const formattedValue = transaction.received_currency === 'BTC' 
                      ? `${formatBTC(transaction.received_amount, 8, false)} ${transaction.received_currency}`
                      : `${formatCurrency(transaction.received_amount)} ${transaction.received_currency}`
                    
                    // Always show as positive for received amounts
                    return `+${formattedValue}`
                  })()}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(transaction.date).toLocaleDateString()} • {transaction.from_address_name || "Unknown"} → {transaction.to_address_name || "Unknown"}
          </div>
        </div>
        
        {/* Actions menu */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditTransaction}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Expand toggle */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <TransactionAccordion transaction={transaction} />
        </div>
      )}
    </div>
  )
}) 