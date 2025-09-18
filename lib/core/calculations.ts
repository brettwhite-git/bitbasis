import { UnifiedTransaction } from '@/types/transactions'

// Using UnifiedTransaction from the canonical type definition
type Order = UnifiedTransaction

export interface PortfolioMetrics {
  totalBtc: number
  totalCostBasis: number
  totalFees: number
  currentValue: number
  unrealizedGain: number
  unrealizedGainPercent: number
  averageBuyPrice: number
  totalTransactions: number
}

/**
 * Calculates total BTC holdings from buy/sell orders only
 * Formula: Sum of (buy orders received_amount - sell orders sent_amount)
 */
export function calculateTotalBTC(orders: Order[]): number {
  return orders.reduce((total, order) => {
    if (order.type === 'buy' && order.received_amount && order.received_currency === 'BTC') {
      return total + order.received_amount
    } else if (order.type === 'sell' && order.sent_amount && order.sent_currency === 'BTC') {
      return total - order.sent_amount
    }
    return total
  }, 0)
}

/**
 * Calculates total cost basis from buy orders only
 * Formula: Sum of (sent_amount + fee_amount) for all buy orders
 */
export function calculateCostBasis(orders: Order[]): number {
  return orders.reduce((total, order) => {
    if (order.type === 'buy') {
      const buyAmount = (order.sent_amount && order.sent_currency === 'USD') ? order.sent_amount : 0
      const serviceFee = (order.fee_currency === 'USD' ? order.fee_amount : 0) || 0
      return total + buyAmount + serviceFee
    }
    return total
  }, 0)
}

/**
 * Calculates total fees from all orders
 * Formula: Sum of all fees in USD
 */
export function calculateTotalFees(orders: Order[]): number {
  return orders.reduce((total, order) => {
    const serviceFee = (order.fee_currency === 'USD' ? order.fee_amount : 0) || 0
    return total + serviceFee
  }, 0)
}

/**
 * Calculates unrealized gains
 * Formula: (Current BTC Price × Total BTC) - Total Cost Basis
 */
export function calculateUnrealizedGains(totalBtc: number, currentPrice: number, costBasis: number): number {
  const currentValue = totalBtc * currentPrice
  return currentValue - costBasis
}

/**
 * Calculates average buy price
 * Formula: Total Cost Basis / Total BTC Bought
 */
export function calculateAverageBuyPrice(orders: Order[]): number {
  const buyOrders = orders.filter(order => order.type === 'buy')
  const totalCostBasis = calculateCostBasis(buyOrders)
  const totalBtcBought = buyOrders.reduce((total, order) => {
    if (order.received_amount && order.received_currency === 'BTC') {
      return total + order.received_amount
    }
    return total
  }, 0)
  
  return totalBtcBought > 0 ? totalCostBasis / totalBtcBought : 0
}

/**
 * Calculates core portfolio metrics based on buy/sell orders
 * @param orders Array of buy/sell orders
 * @param currentPrice Current Bitcoin price in USD
 * @returns Portfolio metrics including total BTC, cost basis, gains, etc.
 */
export function calculatePortfolioMetrics(
  orders: Order[],
  currentPrice: number
): PortfolioMetrics {
  if (!orders.length) {
    return {
      totalBtc: 0,
      totalCostBasis: 0,
      totalFees: 0,
      currentValue: 0,
      unrealizedGain: 0,
      unrealizedGainPercent: 0,
      averageBuyPrice: 0,
      totalTransactions: 0
    }
  }

  // Process buy/sell orders
  let totalBtc = 0
  let totalCostBasis = 0
  let totalFees = 0

  orders.forEach(order => {
    if (order.type === 'buy' && order.received_amount && order.received_currency === 'BTC') {
      // Add BTC from buy
      totalBtc += order.received_amount
      
      // Add to cost basis (including fees)
      if (order.sent_amount && order.sent_currency === 'USD') {
        totalCostBasis += order.sent_amount
      }
      if (order.fee_amount && order.fee_currency === 'USD') {
        totalCostBasis += order.fee_amount
        totalFees += order.fee_amount
      }
    } else if (order.type === 'sell' && order.sent_amount && order.sent_currency === 'BTC') {
      // Subtract BTC from sell
      totalBtc -= order.sent_amount

      // Add sell fees to total fees
      if (order.fee_amount && order.fee_currency === 'USD') {
        totalFees += order.fee_amount
      }
    }
  })

  // Ensure non-negative values
  totalBtc = Math.max(0, totalBtc)
  totalCostBasis = Math.max(0, totalCostBasis)

  // Calculate derived metrics
  const currentValue = totalBtc * currentPrice
  const unrealizedGain = currentValue - totalCostBasis
  const unrealizedGainPercent = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0
  
  // Calculate average buy price using only buy orders
  const buyOrders = orders.filter(order => order.type === 'buy')
  const totalBtcBought = buyOrders.reduce((total, order) => {
    if (order.received_amount && order.received_currency === 'BTC') {
      return total + order.received_amount
    }
    return total
  }, 0)
  const averageBuyPrice = totalBtcBought > 0 ? totalCostBasis / totalBtcBought : 0

  return {
    totalBtc,
    totalCostBasis,
    totalFees,
    currentValue,
    unrealizedGain,
    unrealizedGainPercent,
    averageBuyPrice,
    totalTransactions: orders.length
  }
} 