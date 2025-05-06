"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { TableHead, TableRow, TableHeader } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { UnifiedTransaction, SortConfig } from "@/types/transactions"
import { memo } from "react"
import { Button } from "@/components/ui/button"

interface TransactionHeadersProps {
  sortConfig: SortConfig
  onSort: (column: keyof UnifiedTransaction) => void
  areAllSelected: boolean
  onSelectAll: () => void
  hasTransactions: boolean
}

/**
 * Component for transaction table headers with sorting functionality
 */
export const TransactionHeaders = memo(function TransactionHeaders({
  sortConfig,
  onSort,
  areAllSelected,
  onSelectAll,
  hasTransactions
}: TransactionHeadersProps) {
  
  const getSortIcon = (column: keyof UnifiedTransaction) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400 ml-1" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary ml-1" />
    )
  }
  
  const getSortDirection = (column: keyof UnifiedTransaction) => {
    if (sortConfig.column !== column) return undefined
    return sortConfig.direction === 'asc' ? 'ascending' : 'descending'
  }
  
  const renderSortableHeader = (column: keyof UnifiedTransaction, label: string, className: string = '') => (
    <TableHead className={`cursor-pointer text-center ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 p-0 font-semibold text-xs"
        onClick={() => onSort(column)}
        aria-sort={getSortDirection(column)}
        aria-label={`Sort by ${label} ${getSortDirection(column) || 'none'}`}
      >
        <div className="flex items-center justify-center">
          {label}{getSortIcon(column)}
        </div>
      </Button>
    </TableHead>
  )
  
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[32px] text-center px-2">
          <Checkbox
            checked={areAllSelected && hasTransactions}
            onCheckedChange={onSelectAll}
            disabled={!hasTransactions}
            aria-label="Select all transactions"
            className="border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange"
          />
        </TableHead>
        
        {renderSortableHeader('date', 'Date', 'w-[80px]')}
        {renderSortableHeader('type', 'Type', 'w-[80px]')}
        
        <TableHead className="w-[80px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Term
          </div>
        </TableHead>
        
        {renderSortableHeader('btc_amount', 'Amount (BTC)', 'w-[80px]')}
        {renderSortableHeader('price_at_tx', 'Price (BTC/USD)', 'hidden md:table-cell w-[80px]')}
        {renderSortableHeader('usd_value', 'Amount (USD)', 'w-[80px]')}
        {renderSortableHeader('fee_usd', 'Fees (USD)', 'hidden md:table-cell w-[80px]')}
        {renderSortableHeader('exchange', 'Exchange', 'hidden lg:table-cell w-[80px]')}
        {renderSortableHeader('network_fee_btc', 'Fees (BTC)', 'hidden lg:table-cell w-[80px]')}
        
        <TableHead className="hidden lg:table-cell w-[60px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            TXID
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}) 