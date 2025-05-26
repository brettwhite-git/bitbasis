"use client"

import React from "react"
import { Loader2 } from "lucide-react"
import { TransactionRowMobile } from "./TransactionRowMobile"
import { UnifiedTransaction } from "@/types/transactions"
import { DataTableEmpty } from "@/components/shared/data-table/DataTableEmpty"
import { DataTableError } from "@/components/shared/data-table/DataTableError"

interface TransactionsMobileViewProps {
  transactions: UnifiedTransaction[]
  isLoading: boolean
  error: string | null
  selectedTransactions: Set<string>
  toggleSelection: (id: string) => void
  currentDate: Date
  onRetry?: () => void
}

/**
 * Mobile-optimized view for displaying transactions
 */
export function TransactionsMobileView({
  transactions,
  isLoading,
  error,
  selectedTransactions,
  toggleSelection,
  currentDate,
  onRetry
}: TransactionsMobileViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 my-4">
        <DataTableError 
          colSpan={1} 
          message={`Error loading transactions: ${error}`}
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 my-4">
        <DataTableEmpty 
          colSpan={1} 
          message="No transactions found. Add your first transaction to get started."
        />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 divide-y divide-gray-700/50">
      {transactions.map(transaction => (
        <TransactionRowMobile
          key={transaction.id}
          transaction={transaction}
          isSelected={selectedTransactions.has(transaction.id)}
          onSelect={toggleSelection}
          currentDate={currentDate}
        />
      ))}
    </div>
  )
} 