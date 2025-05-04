import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { 
  Order,
  PortfolioMetrics,
  ExtendedPortfolioMetrics
} from './types'

/**
 * Calculates total BTC holdings from buy/sell orders only
 * Formula: Sum of (buy orders received BTC - sell orders BTC)
 */
export function calculateTotalBTC(orders: Order[]): number {
  return orders.reduce((total, order) => {
    if (order.type === 'buy' && order.received_btc_amount) {
      return total + order.received_btc_amount
    } else if (order.type === 'sell' && order.sell_btc_amount) {
      return total - order.sell_btc_amount
    }
    return total
  }, 0)
}

/**
 * Calculates total cost basis from buy orders only
 * Formula: Sum of (buy_fiat_amount + service_fee) for all buy orders
 */
export function calculateCostBasis(orders: Order[]): number {
  return orders.reduce((total, order) => {
    if (order.type === 'buy') {
      const buyAmount = order.buy_fiat_amount || 0
      const serviceFee = (order.service_fee_currency === 'USD' ? order.service_fee : 0) || 0
      return total + buyAmount + serviceFee
    }
    return total
  }, 0)
}

/**
 * Calculates total fees from all orders
 * Formula: Sum of all service fees in USD
 */
export function calculateTotalFees(orders: Order[]): number {
  return orders.reduce((total, order) => {
    const serviceFee = (order.service_fee_currency === 'USD' ? order.service_fee : 0) || 0
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
  const totalBtcBought = buyOrders.reduce((total, order) => total + (order.received_btc_amount || 0), 0)
  
  return totalBtcBought > 0 ? totalCostBasis / totalBtcBought : 0
}

/**
 * Calculates short-term holdings (< 1 year)
 */
export function calculateShortTermHoldings(orders: Order[]): number {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  let shortTermHoldings = 0
  
  orders.forEach(order => {
    const txDate = new Date(order.date)
    const isShortTerm = txDate > oneYearAgo

    if (order.type === 'buy' && order.received_btc_amount) {
      if (isShortTerm) {
        shortTermHoldings += order.received_btc_amount
      }
    } else if (order.type === 'sell' && order.sell_btc_amount) {
      const amount = order.sell_btc_amount
      // Deduct sells proportionally from short term holdings
      const totalHoldings = shortTermHoldings
      if (totalHoldings > 0) {
        shortTermHoldings -= amount * (shortTermHoldings / totalHoldings)
      }
    }
  })

  return Math.max(0, shortTermHoldings)
}

/**
 * Calculates long-term holdings (>= 1 year)
 */
export function calculateLongTermHoldings(orders: Order[]): number {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  let longTermHoldings = 0
  
  orders.forEach(order => {
    const txDate = new Date(order.date)
    const isLongTerm = txDate <= oneYearAgo

    if (order.type === 'buy' && order.received_btc_amount) {
      if (isLongTerm) {
        longTermHoldings += order.received_btc_amount
      }
    } else if (order.type === 'sell' && order.sell_btc_amount) {
      const amount = order.sell_btc_amount
      // Deduct sells proportionally from long term holdings
      const totalHoldings = longTermHoldings
      if (totalHoldings > 0) {
        longTermHoldings -= amount * (longTermHoldings / totalHoldings)
      }
    }
  })

  return Math.max(0, longTermHoldings)
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
    if (order.type === 'buy' && order.received_btc_amount) {
      // Add BTC from buy
      totalBtc += order.received_btc_amount
      
      // Add to cost basis (including fees)
      if (order.buy_fiat_amount) {
        totalCostBasis += order.buy_fiat_amount
      }
      if (order.service_fee && order.service_fee_currency === 'USD') {
        totalCostBasis += order.service_fee
        totalFees += order.service_fee
      }
    } else if (order.type === 'sell' && order.sell_btc_amount) {
      // Subtract BTC from sell
      totalBtc -= order.sell_btc_amount

      // Add sell fees to total fees
      if (order.service_fee && order.service_fee_currency === 'USD') {
        totalFees += order.service_fee
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
  const averageBuyPrice = totalBtc > 0 ? totalCostBasis / totalBtc : 0

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

/**
 * Fetches portfolio metrics from Supabase and calculates derived metrics
 */
export async function getPortfolioMetrics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<ExtendedPortfolioMetrics> {
  try {
    // Get all transactions from orders and transfers tables AND price
    const [ordersResult, transfersResult, priceResult] = await Promise.all([
      supabase
        .from('orders')
        // Fetch necessary columns for both core metrics and cost basis calculation
        .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price') 
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('transfers')
        .select('*') // Keep '*' for transfers for now
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('spot_price')
        .select('price_usd, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
    ])

    if (ordersResult.error) throw ordersResult.error
    if (transfersResult.error) throw transfersResult.error
    if (priceResult.error) throw priceResult.error

    const orders = ordersResult.data || []
    const transfers = transfersResult.data || []
    
    if (!priceResult.data) throw new Error('No Bitcoin price available')
    const currentPrice = priceResult.data.price_usd

    // Calculate core metrics using only buy/sell orders
    const coreMetrics = calculatePortfolioMetrics(orders as any, currentPrice)

    // For the tax liability calculation, we'll use imports from other modules
    // This will be properly integrated when we refactor the tax module
    // For now, we'll provide placeholder values
    const potentialTaxLiabilityST = 0
    const potentialTaxLiabilityLT = 0

    // Calculate transfer metrics
    const totalSent = transfers
      .filter(t => t.type === 'withdrawal')
      .reduce((total, t) => total + (t.amount_btc || 0), 0)
    
    const totalReceived = transfers
      .filter(t => t.type === 'deposit')
      .reduce((total, t) => total + (t.amount_btc || 0), 0)

    const netTransfers = totalReceived - totalSent

    return {
      ...coreMetrics,
      shortTermHoldings: calculateShortTermHoldings(orders as any),
      longTermHoldings: calculateLongTermHoldings(orders as any),
      sendReceiveMetrics: {
        totalSent,
        totalReceived,
        netTransfers
      },
      potentialTaxLiabilityST,
      potentialTaxLiabilityLT
    }
  } catch (error) {
    console.error('Error in getPortfolioMetrics:', error)
    // Return a default structure in case of error
    return { 
      totalBtc: 0,
      totalCostBasis: 0,
      totalFees: 0,
      currentValue: 0,
      unrealizedGain: 0,
      unrealizedGainPercent: 0,
      averageBuyPrice: 0,
      totalTransactions: 0,
      shortTermHoldings: 0,
      longTermHoldings: 0,
      sendReceiveMetrics: { totalSent: 0, totalReceived: 0, netTransfers: 0 },
      potentialTaxLiabilityST: 0,
      potentialTaxLiabilityLT: 0
    }
  }
}
