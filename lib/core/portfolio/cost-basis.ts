import { 
  Order, 
  BTCHolding, 
  CostBasisMethodResult 
} from './types'

// Shared Tax Rates (Consider making these configurable or constants)
const SHORT_TERM_TAX_RATE = 0.37 // Updated placeholder ST rate
const LONG_TERM_TAX_RATE = 0.20  // Updated placeholder LT rate

/**
 * Calculates cost basis using the specified method (FIFO, LIFO, or Average Cost)
 * @param userId User ID for logging purposes
 * @param method Cost basis calculation method
 * @param orders Array of buy/sell orders
 * @param currentPrice Current Bitcoin price in USD
 * @returns Cost basis calculation results
 */
export async function calculateCostBasis(
  userId: string,
  method: 'FIFO' | 'LIFO' | 'Average Cost',
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
    let totalBtcBought = 0
    let totalSold = 0
    let totalShortTermBtcBought = 0
    let totalLongTermBtcBought = 0
    const oneYearAgoForProportion = new Date()
    oneYearAgoForProportion.setFullYear(oneYearAgoForProportion.getFullYear() - 1)

    orders.forEach(order => {
      if (order.type === 'buy' && order.received_btc_amount) {
        const amount = order.received_btc_amount
        totalBtcBought += amount
        runningBalance += amount
        const acquisitionDate = new Date(order.date)
        if (acquisitionDate > oneYearAgoForProportion) {
          totalShortTermBtcBought += amount
        } else {
          totalLongTermBtcBought += amount
        }
      } else if (order.type === 'sell' && order.sell_btc_amount) {
        totalSold += order.sell_btc_amount
        runningBalance -= order.sell_btc_amount
      }
    })

    const remainingBtc = Math.max(0, runningBalance)

    // --- Average Cost Method --- 
    if (method === 'Average Cost') {
      let totalUsdSpent = 0
      let totalUsdReceived = 0

      orders.forEach(order => {
        if (order.type === 'buy') {
          if (order.buy_fiat_amount) {
            totalUsdSpent += order.buy_fiat_amount
          }
          // Ensure service_fee and currency are checked correctly
          if (order.service_fee && order.service_fee_currency === 'USD') {
            totalUsdSpent += order.service_fee
          }
        } else if (order.type === 'sell') {
          if (order.received_fiat_amount) {
            totalUsdReceived += order.received_fiat_amount
          }
        }
      })

      const averageCost = totalBtcBought > 0 ? totalUsdSpent / totalBtcBought : 0 
      const currentValue = remainingBtc * currentPrice
      const costBasisOfRemaining = remainingBtc * averageCost
      const realizedGains = totalUsdReceived - (totalSold * averageCost) // Gain/loss from sales
      const unrealizedGain = currentValue - costBasisOfRemaining // Gain/loss on remaining holdings
      const unrealizedGainPercent = costBasisOfRemaining > 0 
        ? (unrealizedGain / costBasisOfRemaining) * 100 
        : 0

      // Calculate potential tax liability using proportions
      let potentialTaxLiabilityST = 0
      let potentialTaxLiabilityLT = 0
      if (unrealizedGain > 0 && totalBtcBought > 0) {
        const shortTermProportion = totalBtcBought > 0 ? totalShortTermBtcBought / totalBtcBought : 0
        const longTermProportion = totalBtcBought > 0 ? totalLongTermBtcBought / totalBtcBought : 0
        potentialTaxLiabilityST = unrealizedGain * shortTermProportion * SHORT_TERM_TAX_RATE
        potentialTaxLiabilityLT = unrealizedGain * longTermProportion * LONG_TERM_TAX_RATE
      }

      return {
        totalCostBasis: costBasisOfRemaining, // Cost basis of *remaining* BTC
        averageCost, // Average cost of *all* bought BTC
        unrealizedGain,
        unrealizedGainPercent,
        potentialTaxLiabilityST,
        potentialTaxLiabilityLT,
        realizedGains,
        remainingBtc
      }
    }

    // --- FIFO and LIFO Methods --- 
    let btcHoldings: BTCHolding[] = []
    let realizedGains = 0

    // Populate holdings only from buy orders
    orders.forEach(order => {
      if (order.type === 'buy' && order.received_btc_amount && order.buy_fiat_amount && order.price != null) { // Ensure price exists
        // Calculate cost basis per buy, including fees
        const fee = (order.service_fee && order.service_fee_currency === 'USD') ? order.service_fee : 0
        const costBasisPerBuy = order.buy_fiat_amount + fee

        btcHoldings.push({
          date: order.date,
          amount: order.received_btc_amount,
          costBasis: costBasisPerBuy,
          pricePerCoin: order.price // Store price per coin at purchase
        })
      }
    })

    // Clone and sort holdings based on method for processing sells
    let holdingsToProcess = [...btcHoldings] // Work on a copy
    holdingsToProcess.sort((a, b) => 
      method === 'FIFO' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Process only sell transactions against the sorted holdings
    orders.forEach(order => {
      if (order.type === 'sell' && order.sell_btc_amount && order.received_fiat_amount) {
        let remainingSellAmount = order.sell_btc_amount
        // Calculate sell price safely
        const sellPrice = order.sell_btc_amount > 0 
            ? order.received_fiat_amount / order.sell_btc_amount
            : 0

        while (remainingSellAmount > 0 && holdingsToProcess.length > 0) {
          const holding = method === 'FIFO' ? holdingsToProcess[0] : holdingsToProcess[holdingsToProcess.length - 1] // Get first for FIFO, last for LIFO
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
            if (method === 'FIFO') {
              holdingsToProcess.shift() // Remove from beginning
            } else {
              holdingsToProcess.pop() // Remove from end
            }
          }

          remainingSellAmount -= sellAmountFromHolding
        }
      }
    })

    // --- Calculate final metrics for FIFO/LIFO based on remaining holdings --- 
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
