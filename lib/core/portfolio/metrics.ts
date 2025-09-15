import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { 
  PortfolioMetrics,
  ExtendedPortfolioMetrics
} from './types'

/**
 * Unified Transaction type for the new schema
 */
export interface UnifiedTransaction {
  id: number
  date: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  sent_amount: number | null
  sent_currency: string | null
  received_amount: number | null
  received_currency: string | null
  fee_amount: number | null
  fee_currency: string | null
  price: number | null
  from_address_name: string | null
  to_address_name: string | null
}

/**
 * Calculates total BTC holdings from buy/sell transactions only
 * Formula: Sum of (buy transactions received_amount - sell transactions sent_amount)
 */
export function calculateTotalBTC(transactions: UnifiedTransaction[]): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === 'buy' && transaction.received_amount) {
      return total + transaction.received_amount
    } else if (transaction.type === 'sell' && transaction.sent_amount) {
      return total - transaction.sent_amount
    }
    return total
  }, 0)
}

/**
 * Calculates total cost basis from buy transactions only
 * Formula: Sum of (sent_amount + fee_amount_usd) for all buy transactions
 */
export function calculateCostBasis(transactions: UnifiedTransaction[]): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === 'buy') {
      const buyAmount = transaction.sent_amount || 0
      const serviceFee = (transaction.fee_currency === 'USD' ? transaction.fee_amount : 0) || 0
      return total + buyAmount + serviceFee
    }
    return total
  }, 0)
}

/**
 * Calculates total fees from all transactions
 * Formula: Sum of all fees in USD (convert BTC fees to USD using price)
 */
export function calculateTotalFees(transactions: UnifiedTransaction[]): number {
  return transactions.reduce((total, transaction) => {
    if (!transaction.fee_amount) return total
    
    if (transaction.fee_currency === 'USD') {
      return total + transaction.fee_amount
    } else if (transaction.fee_currency === 'BTC' && transaction.price) {
      // Convert BTC fees to USD using transaction price
      return total + (transaction.fee_amount * transaction.price)
    }
    return total
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
 * Calculates average buy price using buy transactions
 * Formula: Total cost basis / Total BTC purchased
 */
export function calculateAverageBuyPrice(transactions: UnifiedTransaction[]): number {
  const buyTransactions = transactions.filter(t => t.type === 'buy')
  
  if (buyTransactions.length === 0) return 0

  let totalCostBasis = 0
  let totalBtcBought = 0

  buyTransactions.forEach(transaction => {
    if (transaction.received_amount && transaction.sent_amount) {
      const fee = (transaction.fee_amount && transaction.fee_currency === 'USD') ? transaction.fee_amount : 0
      totalCostBasis += transaction.sent_amount + fee
      totalBtcBought += transaction.received_amount
    }
  })
  
  return totalBtcBought > 0 ? totalCostBasis / totalBtcBought : 0
}

/**
 * Calculates short-term holdings (< 1 year)
 */
export function calculateShortTermHoldings(transactions: UnifiedTransaction[]): number {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  let shortTermHoldings = 0
  
  transactions.forEach(transaction => {
    const txDate = new Date(transaction.date)
    const isShortTerm = txDate > oneYearAgo

    if (transaction.type === 'buy' && transaction.received_amount) {
      if (isShortTerm) {
        shortTermHoldings += transaction.received_amount
      }
    } else if (transaction.type === 'sell' && transaction.sent_amount) {
      const amount = transaction.sent_amount
      // Deduct sells proportionally from short term holdings
      if (shortTermHoldings > 0) {
        const totalHoldings = shortTermHoldings
        shortTermHoldings -= amount * (shortTermHoldings / totalHoldings)
      }
    }
  })

  return Math.max(0, shortTermHoldings)
}

/**
 * Calculates long-term holdings (>= 1 year)
 */
export function calculateLongTermHoldings(transactions: UnifiedTransaction[]): number {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  let longTermHoldings = 0
  
  transactions.forEach(transaction => {
    const txDate = new Date(transaction.date)
    const isLongTerm = txDate <= oneYearAgo

    if (transaction.type === 'buy' && transaction.received_amount) {
      if (isLongTerm) {
        longTermHoldings += transaction.received_amount
      }
    } else if (transaction.type === 'sell' && transaction.sent_amount) {
      const amount = transaction.sent_amount
      // Deduct sells proportionally from long term holdings
      if (longTermHoldings > 0) {
        const totalHoldings = longTermHoldings
        longTermHoldings -= amount * (longTermHoldings / totalHoldings)
      }
    }
  })

  return Math.max(0, longTermHoldings)
}

/**
 * Calculates core portfolio metrics based on buy/sell transactions
 * @param transactions Array of unified transactions
 * @param currentPrice Current Bitcoin price in USD
 * @returns Portfolio metrics including total BTC, cost basis, gains, etc.
 */
export function calculatePortfolioMetrics(
  transactions: UnifiedTransaction[],
  currentPrice: number
): PortfolioMetrics {
  if (!transactions.length) {
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

  // Process buy/sell transactions
  let totalBtc = 0
  let totalCostBasis = 0
  let totalFees = 0

  transactions.forEach(transaction => {
    if (transaction.type === 'buy' && transaction.received_amount && transaction.sent_amount) {
      // Add BTC from buy
      totalBtc += transaction.received_amount
      
      // Add to cost basis (fiat amount + USD fees)
      totalCostBasis += transaction.sent_amount
      
      if (transaction.fee_amount && transaction.fee_currency === 'USD') {
        totalCostBasis += transaction.fee_amount
        totalFees += transaction.fee_amount
      }
    } else if (transaction.type === 'sell' && transaction.sent_amount) {
      // Subtract BTC from sell
      totalBtc -= transaction.sent_amount

      // Add sell fees to total fees
      if (transaction.fee_amount && transaction.fee_currency === 'USD') {
        totalFees += transaction.fee_amount
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
    totalTransactions: transactions.filter(t => t.type === 'buy' || t.type === 'sell').length
  }
}

/**
 * Fetches transactions data from unified transactions table
 */
export async function getTransactionsData(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<UnifiedTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, date, type, 
        sent_amount, sent_currency,
        received_amount, received_currency,
        fee_amount, fee_currency,
        price, from_address_name, to_address_name
      `)
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (error) throw error
    return (data || []) as UnifiedTransaction[]
  } catch (error) {
    console.error('Error fetching transactions data:', error)
    return []
  }
}

/**
 * Fetches portfolio metrics from Supabase using unified transactions table
 */
export async function getPortfolioMetrics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<ExtendedPortfolioMetrics> {
  try {
    // Get all transactions and current BTC price
    const [transactionsResult, priceResult] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          id, date, type,
          sent_amount, sent_currency,
          received_amount, received_currency, 
          fee_amount, fee_currency,
          price, from_address_name, to_address_name
        `)
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('spot_price')
        .select('price_usd, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
    ])

    if (transactionsResult.error) throw transactionsResult.error
    if (priceResult.error) throw priceResult.error

    const transactions = transactionsResult.data || []
    
    if (!priceResult.data) throw new Error('No Bitcoin price available')
    const currentPrice = priceResult.data.price_usd

    // Calculate core metrics using only buy/sell transactions
    const coreMetrics = calculatePortfolioMetrics(transactions as UnifiedTransaction[], currentPrice)

    // Calculate tax liability based on unrealized gains and holdings classification
    const shortTermHoldings = calculateShortTermHoldings(transactions as UnifiedTransaction[])
    const longTermHoldings = calculateLongTermHoldings(transactions as UnifiedTransaction[])
    const totalHoldings = shortTermHoldings + longTermHoldings
    
    let potentialTaxLiabilityST = 0
    let potentialTaxLiabilityLT = 0
    
    if (coreMetrics.unrealizedGain > 0 && totalHoldings > 0) {
      // Calculate tax rates (these should eventually come from user settings)
      const SHORT_TERM_TAX_RATE = 0.37 // 37% for short-term capital gains
      const LONG_TERM_TAX_RATE = 0.20  // 20% for long-term capital gains
      
      // Calculate proportional unrealized gains
      const shortTermRatio = shortTermHoldings / totalHoldings
      const longTermRatio = longTermHoldings / totalHoldings
      
      const shortTermUnrealizedGain = coreMetrics.unrealizedGain * shortTermRatio
      const longTermUnrealizedGain = coreMetrics.unrealizedGain * longTermRatio
      
      potentialTaxLiabilityST = shortTermUnrealizedGain * SHORT_TERM_TAX_RATE
      potentialTaxLiabilityLT = longTermUnrealizedGain * LONG_TERM_TAX_RATE
    }

    // Calculate transfer metrics using deposit/withdrawal transactions
    const totalSent = transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((total, t) => total + (t.sent_amount || 0), 0)
    
    const totalReceived = transactions
      .filter(t => t.type === 'deposit')
      .reduce((total, t) => total + (t.received_amount || 0), 0)

    const netTransfers = totalReceived - totalSent

    return {
      ...coreMetrics,
      shortTermHoldings,
      longTermHoldings,
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

// Legacy function - keeping for backward compatibility during migration
export async function getOrdersData(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<unknown[]> {
  console.warn('getOrdersData is deprecated. Use getTransactionsData instead.')
  const transactions = await getTransactionsData(userId, supabase)
  return transactions.filter(t => t.type === 'buy' || t.type === 'sell')
}
