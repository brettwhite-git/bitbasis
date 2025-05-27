import { Order } from './types'
import { TaxMethod } from '@/providers/tax-method-provider'

// Tax rates - these could be made configurable later
export const SHORT_TERM_TAX_RATE = 0.37 // 37% for short-term capital gains
export const LONG_TERM_TAX_RATE = 0.20  // 20% for long-term capital gains

interface TaxLiabilityResult {
  shortTermLiability: number
  longTermLiability: number
  totalLiability: number
}

/**
 * Calculates tax liability based on unrealized gains and selected cost basis method
 */
export function calculateTaxLiability(
  orders: Order[],
  currentPrice: number,
  unrealizedGain: number,
  method: TaxMethod = 'fifo'
): TaxLiabilityResult {
  if (unrealizedGain <= 0) {
    return {
      shortTermLiability: 0,
      longTermLiability: 0,
      totalLiability: 0
    }
  }

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  // Calculate holdings classification based on the selected method
  const { shortTermHoldings, longTermHoldings } = calculateHoldingsClassification(orders, method)
  const totalHoldings = shortTermHoldings + longTermHoldings

  if (totalHoldings <= 0) {
    return {
      shortTermLiability: 0,
      longTermLiability: 0,
      totalLiability: 0
    }
  }

  // Calculate proportional unrealized gains
  const shortTermRatio = shortTermHoldings / totalHoldings
  const longTermRatio = longTermHoldings / totalHoldings

  const shortTermUnrealizedGain = unrealizedGain * shortTermRatio
  const longTermUnrealizedGain = unrealizedGain * longTermRatio

  const shortTermLiability = shortTermUnrealizedGain * SHORT_TERM_TAX_RATE
  const longTermLiability = longTermUnrealizedGain * LONG_TERM_TAX_RATE

  return {
    shortTermLiability,
    longTermLiability,
    totalLiability: shortTermLiability + longTermLiability
  }
}

/**
 * Calculates holdings classification based on the selected cost basis method
 */
function calculateHoldingsClassification(
  orders: Order[],
  method: TaxMethod
): { shortTermHoldings: number; longTermHoldings: number } {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  // Create holdings from buy orders
  let holdings: Array<{
    amount: number
    date: Date
    price: number
    costBasis: number
  }> = []

  // Add all buy orders to holdings
  orders
    .filter(order => order.type === 'buy' && order.received_btc_amount)
    .forEach(order => {
      if (order.received_btc_amount && order.buy_fiat_amount) {
        const fee = (order.service_fee && order.service_fee_currency === 'USD') ? order.service_fee : 0
        holdings.push({
          amount: order.received_btc_amount,
          date: new Date(order.date),
          price: order.price || 0,
          costBasis: order.buy_fiat_amount + fee
        })
      }
    })

  // Sort holdings based on the method
  switch (method) {
    case 'fifo':
      holdings.sort((a, b) => a.date.getTime() - b.date.getTime()) // Oldest first
      break
    case 'lifo':
      holdings.sort((a, b) => b.date.getTime() - a.date.getTime()) // Newest first
      break
    case 'hifo':
      holdings.sort((a, b) => b.price - a.price) // Highest price first
      break
  }

  // Process sell orders to reduce holdings
  const sellOrders = orders.filter(order => order.type === 'sell' && order.sell_btc_amount)
  
  sellOrders.forEach(sellOrder => {
    if (!sellOrder.sell_btc_amount) return
    
    let remainingToSell = sellOrder.sell_btc_amount
    
    for (let i = 0; i < holdings.length && remainingToSell > 0; i++) {
      const holding = holdings[i]
      const amountToSell = Math.min(holding.amount, remainingToSell)
      
      holding.amount -= amountToSell
      remainingToSell -= amountToSell
      
      if (holding.amount <= 0) {
        holdings.splice(i, 1)
        i-- // Adjust index after removal
      }
    }
  })

  // Calculate short-term and long-term holdings
  let shortTermHoldings = 0
  let longTermHoldings = 0

  holdings.forEach(holding => {
    if (holding.date > oneYearAgo) {
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