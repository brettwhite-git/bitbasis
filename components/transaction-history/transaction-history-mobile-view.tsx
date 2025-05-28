"use client"

import { TransactionHistoryRowMobile } from "./transaction-history-row-mobile"

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

interface TransactionHistoryMobileViewProps {
  transactions: UnifiedTransaction[]
  selectedTransactions: Set<string>
  toggleSelection: (id: string) => void
}

/**
 * Mobile-optimized view for displaying transaction history
 */
export function TransactionHistoryMobileView({
  transactions,
  selectedTransactions,
  toggleSelection
}: TransactionHistoryMobileViewProps) {
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
        <TransactionHistoryRowMobile
          key={transaction.id}
          transaction={transaction}
          isSelected={selectedTransactions.has(transaction.id)}
          onSelect={() => toggleSelection(transaction.id)}
        />
      ))}
    </div>
  )
} 