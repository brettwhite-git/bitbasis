"use client"

import { UnifiedTransaction } from '@/types/transactions'
import { BuySellAccordion } from './buy-sell-accordion'
import { TransferAccordion } from './transfer-accordion'

interface TransactionAccordionProps {
  transaction: UnifiedTransaction
  // PHASE 1 OPTIMIZATION: Accept price from parent table level
  currentPrice?: number
  priceLoading?: boolean
}

export function TransactionAccordion({ 
  transaction,
  currentPrice,
  priceLoading
}: TransactionAccordionProps) {
  const renderAccordionContent = () => {
    switch (transaction.type) {
      case 'buy':
      case 'sell':
        return (
          <BuySellAccordion 
            transaction={transaction}
            currentPrice={currentPrice}
            priceLoading={priceLoading}
          />
        )
      case 'deposit':
      case 'withdrawal':
      case 'interest':
        return (
          <TransferAccordion 
            transaction={transaction}
            currentPrice={currentPrice}
            priceLoading={priceLoading}
          />
        )
      default:
        return <div className="text-gray-400">No additional details available</div>
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/5 via-gray-900/10 to-gray-800/5 p-6 border-t border-gray-700/30">
      {renderAccordionContent()}
    </div>
  )
} 