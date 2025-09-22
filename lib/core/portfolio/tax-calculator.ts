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
  console.log('🧮 calculateTaxLiability: Starting calculation with:', {
    transactionCount: transactions.length,
    currentPrice,
    method,
    sampleTransactions: transactions.slice(0, 2)
  })

  // Calculate what holdings would remain after applying the selected method
  const remainingHoldings = calculateRemainingHoldings(transactions, method)
  
  console.log('💼 calculateTaxLiability: Remaining holdings after method application:', {
    holdingsCount: remainingHoldings.length,
    sampleHoldings: remainingHoldings.slice(0, 3)
  })
  
  if (remainingHoldings.length === 0) {
    console.log('❌ calculateTaxLiability: No remaining holdings, returning zero liability')
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
  console.log('🏗️ calculateRemainingHoldings: Starting with transactions:', {
    total: transactions.length,
    types: transactions.map(tx => tx.type),
    buyTransactions: transactions.filter(tx => tx.type === 'buy').length,
    sellTransactions: transactions.filter(tx => tx.type === 'sell').length
  })

  // Create holdings from buy transactions
  const holdings: Array<{
    amount: number
    date: string
    costBasis: number
    pricePerCoin: number
  }> = []

  // Add all buy transactions to holdings
  const buyTransactions = transactions.filter(tx => tx.type === 'buy' && tx.received_amount && tx.sent_amount && tx.price)
  console.log('💰 calculateRemainingHoldings: Valid buy transactions:', buyTransactions.length)
  console.log('💰 calculateRemainingHoldings: Sample buy transaction:', buyTransactions[0])

  buyTransactions.forEach(tx => {
    if (tx.received_amount && tx.sent_amount && tx.price) {
      // Calculate cost basis: fiat sent + USD fees
      const fee = (tx.fee_amount && tx.fee_currency === 'USD') ? tx.fee_amount : 0
      const holding = {
        amount: tx.received_amount,
        date: tx.date,
        costBasis: tx.sent_amount + fee,
        pricePerCoin: tx.price
      }
      holdings.push(holding)
      console.log('➕ calculateRemainingHoldings: Added holding:', holding)
    }
  })

  // Clone holdings for processing
  const holdingsToProcess = [...holdings]
  
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
