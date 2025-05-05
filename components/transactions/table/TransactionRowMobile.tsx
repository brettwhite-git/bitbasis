"use client"

import { useState, memo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { TransactionBadge } from "@/components/transactions/badges/TransactionBadge"
import { TermBadge } from "@/components/transactions/badges/TermBadge"
import { formatBTC, formatCurrency, formatDate } from "@/lib/utils/format"
import { capitalizeExchange } from "@/lib/utils/format"
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { TransactionRowProps } from "@/types/transactions"
import { Button } from "@/components/ui/button"

/**
 * Mobile-optimized transaction row with expandable details
 */
export const TransactionRowMobile = memo(function TransactionRowMobile({
  transaction,
  isSelected,
  onSelect,
  currentDate
}: TransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isBuyOrSell = transaction.type === 'buy' || transaction.type === 'sell'
  
  const toggleExpand = () => {
    setIsExpanded(prev => !prev)
  }

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Main row (always visible) */}
      <div className="grid grid-cols-[auto,1fr,auto] items-center p-3 gap-x-3">
        <div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(transaction.id)}
            aria-label={`Select transaction from ${new Date(transaction.date).toLocaleDateString()}`}
            className="border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange"
          />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <TransactionBadge type={transaction.type} />
            {isBuyOrSell && (
              <TermBadge date={transaction.date} currentDate={currentDate} />
            )}
          </div>
          
          <div className="text-sm font-medium">
            {formatBTC(transaction.btc_amount, 8, false)} BTC
          </div>
          
          <div className="text-xs text-muted-foreground">
            {formatDate(transaction.date)}
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-medium">
            {formatCurrency(transaction.usd_value)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 ml-auto"
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
        <div className="px-4 pb-3 pt-0 bg-muted/20">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Price at Tx:</div>
            <div className="text-right">{formatCurrency(transaction.price_at_tx)}</div>
            
            <div className="text-muted-foreground">Fees (USD):</div>
            <div className="text-right">{formatCurrency(transaction.fee_usd)}</div>
            
            <div className="text-muted-foreground">Fees (BTC):</div>
            <div className="text-right">{formatBTC(transaction.network_fee_btc, 8, false)}</div>
            
            <div className="text-muted-foreground">Exchange:</div>
            <div className="text-right">{capitalizeExchange(transaction.exchange)}</div>
            
            {transaction.txid && (
              <>
                <div className="text-muted-foreground">Transaction ID:</div>
                <div className="text-right">
                  <a 
                    href={`https://mempool.space/tx/${transaction.txid}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700"
                    title="View transaction on Mempool.space"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    <span className="text-xs">View</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}) 