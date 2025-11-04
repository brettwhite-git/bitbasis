import { 
  BTCHolding, 
  CostBasisMethodResult 
} from './types'
import { UnifiedTransaction } from '@/types/transactions'

// Using UnifiedTransaction as Order type
type Order = UnifiedTransaction

// Shared Tax Rates (Consider making these configurable or constants)
const SHORT_TERM_TAX_RATE = 0.37 // Updated placeholder ST rate
const LONG_TERM_TAX_RATE = 0.20  // Updated placeholder LT rate

/**
 * Calculates cost basis using the specified method (FIFO, LIFO, or HIFO)
 * @param userId User ID for logging purposes
 * @param method Cost basis calculation method
 * @param orders Array of buy/sell orders
 * @param currentPrice Current Bitcoin price in USD
 * @returns Cost basis calculation results
 */
export async function calculateCostBasis(
  userId: string,
  method: 'FIFO' | 'LIFO' | 'HIFO',
  orders: Order[],
  currentPrice: number
): Promise<CostBasisMethodResult> {
  try {
    // Validate inputs
    if (!userId) throw new Error('User ID is required')
    if (!method) throw new Error('Cost basis method is required')
    if (!Array.isArray(orders)) throw new Error('Orders data must be an array')
    if (typeof currentPrice !== 'number' || isNaN(currentPrice)) throw new Error('Valid current price is required')

    // Calculate running balance and totals from the provided orders
    let runningBalance = 0
    const oneYearAgoForProportion = new Date()
    oneYearAgoForProportion.setFullYear(oneYearAgoForProportion.getFullYear() - 1)

    orders.forEach(order => {
      if ((order.type === 'buy' || order.type === 'interest') && order.received_amount && order.received_currency === 'BTC') {
        runningBalance += order.received_amount
      } else if (order.type === 'sell' && order.sent_amount && order.sent_currency === 'BTC') {
        runningBalance -= order.sent_amount
      }
    })

    const remainingBtc = Math.max(0, runningBalance)

    // --- FIFO, LIFO, and HIFO Methods --- 
    const btcHoldings: BTCHolding[] = []
    let realizedGains = 0

    // Populate holdings from buy orders and interest (income)
    orders.forEach(order => {
      if (order.type === 'buy' && order.received_amount && order.received_currency === 'BTC' && order.sent_amount && order.sent_currency === 'USD' && order.price != null) {
        // Calculate cost basis per buy, including fees
        const fee = (order.fee_amount && order.fee_currency === 'USD') ? order.fee_amount : 0
        const costBasisPerBuy = order.sent_amount + fee

        btcHoldings.push({
          date: order.date,
          amount: order.received_amount,
          costBasis: costBasisPerBuy,
          pricePerCoin: order.price // Store price per coin at purchase
        })
      } else if (order.type === 'interest' && order.received_amount && order.received_currency === 'BTC') {
        // Interest is taxable income with $0 cost basis
        // When interest BTC is sold, the full amount is a gain
        const interestPrice = order.price || 0
        btcHoldings.push({
          date: order.date,
          amount: order.received_amount,
          costBasis: 0, // $0 cost basis for interest income
          pricePerCoin: interestPrice
        })
      }
    })

    // Clone and sort holdings based on method for processing sells
    const holdingsToProcess = [...btcHoldings] // Work on a copy
    
    if (method === 'FIFO') {
      // Sort by date (oldest first)
      holdingsToProcess.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    } else if (method === 'LIFO') {
      // Sort by date (newest first)
      holdingsToProcess.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    } else if (method === 'HIFO') {
      // Sort by price per coin (highest first)
      holdingsToProcess.sort((a, b) => 
        b.pricePerCoin - a.pricePerCoin
      )
    }

    // Process only sell transactions against the sorted holdings
    orders.forEach(order => {
      if (order.type === 'sell' && order.sent_amount && order.sent_currency === 'BTC' && order.received_amount && order.received_currency === 'USD') {
        let remainingSellAmount = order.sent_amount
        // Calculate sell price safely
        const sellPrice = order.sent_amount > 0 
            ? order.received_amount / order.sent_amount
            : 0

        while (remainingSellAmount > 0 && holdingsToProcess.length > 0) {
          // Get the appropriate holding based on method
          const holdingIndex = 0 // For all methods, we take from the beginning of the sorted array
          const holding = holdingsToProcess[holdingIndex]
          if (!holding) break // Should not happen if length > 0

          const sellAmountFromHolding = Math.min(remainingSellAmount, holding.amount)
          
          // Calculate gain/loss for this portion
          const costBasisForPortion = holding.costBasis * (sellAmountFromHolding / holding.amount) // Proportional cost basis
          const proceedsForPortion = sellAmountFromHolding * sellPrice
          realizedGains += proceedsForPortion - costBasisForPortion

          // Update or remove the holding
          holding.amount -= sellAmountFromHolding
          holding.costBasis -= costBasisForPortion

          if (holding.amount <= 1e-9) { // Use tolerance for floating point comparison
            holdingsToProcess.splice(holdingIndex, 1) // Remove the holding
          }

          remainingSellAmount -= sellAmountFromHolding
        }
      }
    })

    // --- Calculate final metrics --- 
    const remainingHoldings = holdingsToProcess
    const totalCostBasis = remainingHoldings.reduce((sum, h) => sum + h.costBasis, 0)
    const averageCost = remainingBtc > 0 ? totalCostBasis / remainingBtc : 0 // Avg cost of *remaining* holdings
    const currentValue = remainingBtc * currentPrice
    const unrealizedGain = currentValue - totalCostBasis
    const unrealizedGainPercent = totalCostBasis > 0 
        ? (unrealizedGain / totalCostBasis) * 100 
        : 0
    
    // Calculate potential tax liability based on remaining holdings
    let potentialTaxLiabilityST = 0
    let potentialTaxLiabilityLT = 0
    const oneYearAgoForTax = new Date()
    oneYearAgoForTax.setFullYear(oneYearAgoForTax.getFullYear() - 1)

    remainingHoldings.forEach(holding => {
      const holdingValue = holding.amount * currentPrice
      const holdingUnrealizedGain = holdingValue - holding.costBasis
      
      if (holdingUnrealizedGain > 0) {
        const acquisitionDate = new Date(holding.date)
        const isLongTerm = acquisitionDate <= oneYearAgoForTax
        if (isLongTerm) {
          potentialTaxLiabilityLT += holdingUnrealizedGain * LONG_TERM_TAX_RATE
        } else {
          potentialTaxLiabilityST += holdingUnrealizedGain * SHORT_TERM_TAX_RATE
        }
      }
    })

    return {
      totalCostBasis, // Total cost basis of *remaining* holdings
      averageCost,    // Average cost of *remaining* holdings
      realizedGains, // Calculated from sells
      unrealizedGain,
      unrealizedGainPercent,
      potentialTaxLiabilityST,
      potentialTaxLiabilityLT,
      remainingBtc
    }
  } catch (error) {
    console.error(`Error calculating ${method} cost basis:`, error)
    // Return a default error state or re-throw
    // Depending on how you want to handle errors upstream
    return {
      totalCostBasis: 0,
      averageCost: 0,
      realizedGains: 0,
      unrealizedGain: 0,
      unrealizedGainPercent: 0,
      potentialTaxLiabilityST: 0,
      potentialTaxLiabilityLT: 0,
      remainingBtc: 0
    } // Or throw error
  }
}
