"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { ExternalLink } from "lucide-react"
import { formatBTC, formatCurrency, formatDate } from "@/lib/utils/format"
import { capitalizeExchange } from "@/lib/utils/format"
import { TransactionBadge } from "@/components/transactions/badges/TransactionBadge"
import { TermBadge } from "@/components/transactions/badges/TermBadge"
import { memo } from "react"
import { TransactionRowProps } from "@/types/transactions"

/**
 * A component that renders a single transaction row
 */
export const TransactionRow = memo(function TransactionRow({
  transaction,
  isSelected,
  onSelect,
  currentDate
}: TransactionRowProps) {
  const isBuyOrSell = transaction.type === 'buy' || transaction.type === 'sell'
  
  return (
    <TableRow>
      <TableCell className="text-center px-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(transaction.id)}
          aria-label={`Select transaction from ${new Date(transaction.date).toLocaleDateString()}`}
          className="border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange"
        />
      </TableCell>
      
      <TableCell className="text-center px-8">
        {formatDate(transaction.date)}
      </TableCell>
      
      <TableCell className="text-center">
        <TransactionBadge type={transaction.type} />
      </TableCell>
      
      <TableCell className="text-center">
        {isBuyOrSell ? (
          <TermBadge date={transaction.date} currentDate={currentDate} />
        ) : (
          "-"
        )}
      </TableCell>
      
      <TableCell className="text-center">
        {formatBTC(transaction.btc_amount, 8, false)}
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-center">
        {formatCurrency(transaction.price_at_tx)}
      </TableCell>
      
      <TableCell className="text-center">
        {formatCurrency(transaction.usd_value)}
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-center">
        {formatCurrency(transaction.fee_usd)}
      </TableCell>
      
      <TableCell className="hidden lg:table-cell text-center">
        {capitalizeExchange(transaction.exchange)}
      </TableCell>
      
      <TableCell className="hidden lg:table-cell text-center">
        {formatBTC(transaction.network_fee_btc, 8, false)}
      </TableCell>
      
      <TableCell className="hidden lg:table-cell text-center">
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
}) 