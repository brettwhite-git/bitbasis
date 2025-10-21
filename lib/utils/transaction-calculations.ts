import { UnifiedTransaction } from '@/types/transactions'

/**
 * Transaction data with pre-computed gains and current value
 * Used to avoid redundant calculations in row-level components
 */
export interface TransactionWithGains extends UnifiedTransaction {
  gainIncome?: number
  gainPercent?: number
  currentValue?: number
}

/**
 * Pre-compute gains for all transactions at once
 * This eliminates per-row calculations and enables efficient memoization
 * 
 * @param transactions Array of unified transactions
 * @param currentPrice Current Bitcoin price in USD
 * @returns Transactions with pre-computed gain metrics
 */
export function computeTransactionGains(
  transactions: UnifiedTransaction[],
  currentPrice: number
): TransactionWithGains[] {
  return transactions.map(tx => {
    // Only compute gains for buy transactions
    if (tx.type === 'buy' && tx.received_amount && tx.sent_amount && currentPrice > 0) {
      const currentValue = tx.received_amount * currentPrice
      const adjustedCostBasis = tx.sent_amount + (tx.fee_amount || 0)
      const gainIncome = currentValue - adjustedCostBasis
      const gainPercent = adjustedCostBasis > 0 ? (gainIncome / adjustedCostBasis) * 100 : 0
      
      return {
        ...tx,
        gainIncome,
        gainPercent,
        currentValue
      }
    }
    return tx
  })
}
