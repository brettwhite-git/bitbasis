"use client"

import { TransactionRowMobile } from "./transaction-row-mobile"
import { UnifiedTransaction } from "@/types/transactions"

// Using canonical UnifiedTransaction from types/transactions.ts

interface TransactionMobileViewProps {
  transactions: UnifiedTransaction[]
  selectedTransactions: Set<string>
  toggleSelection: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * Mobile-optimized view for displaying transaction history
 */
export function TransactionMobileView({
  transactions,
  selectedTransactions,
  toggleSelection,
  onDelete
}: TransactionMobileViewProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 my-4">
        <div className="text-center text-gray-400">
          No transactions found
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 divide-y divide-gray-700/50">
      {transactions.map(transaction => (
        <TransactionRowMobile
          key={transaction.id}
          transaction={transaction}
          isSelected={selectedTransactions.has(String(transaction.id))}
          onSelect={() => toggleSelection(String(transaction.id))}
          onDelete={() => onDelete(String(transaction.id))}
        />
      ))}
    </div>
  )
} 