import { TaxMethod } from '@/providers/tax-method-provider'
import { Database } from '@/types/supabase'

// Tax rates - these could be made configurable later
export const SHORT_TERM_TAX_RATE = 0.37 // 37% for short-term capital gains
export const LONG_TERM_TAX_RATE = 0.20  // 20% for long-term capital gains

type Transaction = Database['public']['Tables']['transactions']['Row']

interface TaxLiabilityResult {
  shortTermLiability: number
  longTermLiability: number
  totalLiability: number
}

/**
 * Calculates tax liability based on unrealized gains and selected cost basis method
 * This function properly simulates the impact of the chosen tax method on holdings classification
 */
export function calculateTaxLiability(
  transactions: Transaction[],
  currentPrice: number,
  method: TaxMethod = 'fifo'
): TaxLiabilityResult {
  // Calculate what holdings would remain after applying the selected method
  const remainingHoldings = calculateRemainingHoldings(transactions, method)
  
  if (remainingHoldings.length === 0) {
    return {
      shortTermLiability: 0,
      longTermLiability: 0,
      totalLiability: 0
    }
  }

  // Calculate tax liability based on actual remaining holdings
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  let shortTermLiability = 0
  let longTermLiability = 0

  remainingHoldings.forEach(holding => {
    const holdingValue = holding.amount * currentPrice
    const holdingUnrealizedGain = holdingValue - holding.costBasis
    
    if (holdingUnrealizedGain > 0) {
      const acquisitionDate = new Date(holding.date)
      const isLongTerm = acquisitionDate <= oneYearAgo
      
      if (isLongTerm) {
        longTermLiability += holdingUnrealizedGain * LONG_TERM_TAX_RATE
      } else {
        shortTermLiability += holdingUnrealizedGain * SHORT_TERM_TAX_RATE
      }
    }
  })

  return {
    shortTermLiability,
    longTermLiability,
    totalLiability: shortTermLiability + longTermLiability
  }
}

/**
 * Calculates what holdings would remain after applying the selected cost basis method
 * This simulates the impact of sells using FIFO, LIFO, or HIFO logic
 */
function calculateRemainingHoldings(
  transactions: Transaction[],
  method: TaxMethod
): Array<{
  amount: number
  date: string
  costBasis: number
  pricePerCoin: number
}> {
  // Create holdings from buy transactions
  let holdings: Array<{
    amount: number
    date: string
    costBasis: number
    pricePerCoin: number
  }> = []

  // Add all buy transactions to holdings
  transactions
    .filter(tx => tx.type === 'buy' && tx.received_amount && tx.sent_amount && tx.price)
    .forEach(tx => {
      if (tx.received_amount && tx.sent_amount && tx.price) {
        // Calculate cost basis: fiat sent + USD fees
        const fee = (tx.fee_amount && tx.fee_currency === 'USD') ? tx.fee_amount : 0
        holdings.push({
          amount: tx.received_amount,
          date: tx.date,
          costBasis: tx.sent_amount + fee,
          pricePerCoin: tx.price
        })
      }
    })

  // Clone holdings for processing
  let holdingsToProcess = [...holdings]
  
  // Sort holdings based on the method
  switch (method) {
    case 'fifo':
      holdingsToProcess.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      break
    case 'lifo':
      holdingsToProcess.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      break
    case 'hifo':
      holdingsToProcess.sort((a, b) => b.pricePerCoin - a.pricePerCoin)
      break
  }

  // Process sell transactions to reduce holdings
  const sellTransactions = transactions
    .filter(tx => tx.type === 'sell' && tx.sent_amount)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Process sells chronologically
  
  sellTransactions.forEach(sellTx => {
    if (!sellTx.sent_amount) return
    
    let remainingToSell = sellTx.sent_amount
    
    for (let i = 0; i < holdingsToProcess.length && remainingToSell > 0; i++) {
      const holding = holdingsToProcess[i]
      if (!holding) continue
      
      const amountToSell = Math.min(holding.amount, remainingToSell)
      
      // Reduce holding proportionally
      const reductionRatio = amountToSell / holding.amount
      holding.amount -= amountToSell
      holding.costBasis -= holding.costBasis * reductionRatio
      remainingToSell -= amountToSell
      
      // Remove holding if fully consumed
      if (holding.amount <= 1e-9) {
        holdingsToProcess.splice(i, 1)
        i-- // Adjust index after removal
      }
    }
  })

  return holdingsToProcess.filter(h => h.amount > 1e-9) // Filter out tiny amounts
}

/**
 * DEPRECATED: Legacy function with flawed logic
 * @deprecated Use calculateTaxLiability instead
 */
function calculateHoldingsClassification(
  transactions: Transaction[],
  method: TaxMethod
): { shortTermHoldings: number; longTermHoldings: number } {
  console.warn('calculateHoldingsClassification is deprecated. Use calculateTaxLiability for accurate results.')
  
  const remainingHoldings = calculateRemainingHoldings(transactions, method)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  let shortTermHoldings = 0
  let longTermHoldings = 0

  remainingHoldings.forEach(holding => {
    if (new Date(holding.date) > oneYearAgo) {
      shortTermHoldings += holding.amount
    } else {
      longTermHoldings += holding.amount
    }
  })

  return {
    shortTermHoldings: Math.max(0, shortTermHoldings),
    longTermHoldings: Math.max(0, longTermHoldings)
  }
} 