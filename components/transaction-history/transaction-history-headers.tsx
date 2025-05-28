"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { TableHead, TableRow, TableHeader } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { memo } from "react"
import { Button } from "@/components/ui/button"

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

interface SortConfig {
  column: keyof UnifiedTransaction
  direction: 'asc' | 'desc'
}

interface TransactionHistoryHeadersProps {
  sortConfig: SortConfig
  onSort: (column: keyof UnifiedTransaction) => void
  areAllSelected: boolean
  onSelectAll: () => void
  hasTransactions: boolean
}

/**
 * Enhanced transaction history table headers with new condensed structure
 * Based on our vision: [✓] [Date] [Type] [Term] [From] [To] [Amount] [PNL] [Gain] [Balance] [⚙️] [▼]
 */
export const TransactionHistoryHeaders = memo(function TransactionHistoryHeaders({
  sortConfig,
  onSort,
  areAllSelected,
  onSelectAll,
  hasTransactions
}: TransactionHistoryHeadersProps) {
  
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
        {/* Selection Checkbox */}
        <TableHead className="w-[40px] text-center px-2">
          <Checkbox
            checked={areAllSelected && hasTransactions}
            onCheckedChange={onSelectAll}
            disabled={!hasTransactions}
            aria-label="Select all transactions"
            className="border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange"
          />
        </TableHead>
        
        {/* Date - shows date on top, time below */}
        {renderSortableHeader('date', 'Date', 'w-[120px]')}
        
        {/* Transaction Type */}
        {renderSortableHeader('type', 'Type', 'w-[100px]')}
        
        {/* From - source address/name */}
        {renderSortableHeader('from_address_name', 'From', 'w-[140px]')}
        
        {/* Flow Arrow */}
        <TableHead className="w-[40px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            {/* Empty column for flow arrow */}
          </div>
        </TableHead>
        
        {/* To - destination address/name */}
        {renderSortableHeader('to_address_name', 'To', 'w-[140px]')}
        
        {/* Sent Amount - what was sent out */}
        <TableHead className="w-[120px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Sent
          </div>
        </TableHead>
        
        {/* Received Amount - what was received */}
        <TableHead className="w-[120px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Received
          </div>
        </TableHead>
        
        {/* PNL - Profit & Loss (coming soon) */}
        <TableHead className="hidden md:table-cell w-[100px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            PNL
          </div>
        </TableHead>
        
        {/* Gain - Percentage gain/loss (coming soon) */}
        <TableHead className="hidden md:table-cell w-[100px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Gain %
          </div>
        </TableHead>
        
        {/* Balance - Running BTC balance (coming soon) */}
        <TableHead className="hidden lg:table-cell w-[120px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Balance
          </div>
        </TableHead>
        
        {/* Accordion toggle column */}
        <TableHead className="w-[60px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Details
          </div>
        </TableHead>
        
        {/* Actions column */}
        <TableHead className="w-[80px] text-center">
          <div className="flex items-center justify-center font-semibold text-xs">
            Actions
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}) 