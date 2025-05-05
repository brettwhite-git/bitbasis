import { Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Base order type from Supabase schema
 */
export type BaseOrder = Database['public']['Tables']['orders']['Row']

/**
 * Enhanced Order interface with specific fields needed for portfolio calculations
 */
export interface Order extends BaseOrder {
  type: 'buy' | 'sell'
  received_btc_amount: number | null
  sell_btc_amount: number | null
}

/**
 * Transaction interface for generic transaction handling
 */
export interface Transaction {
  id: string
  date: string
  type: 'Buy' | 'Sell' | 'Send' | 'Receive'
  received_amount: number | null
  sent_amount: number | null
  buy_amount: number | null
  sell_amount: number | null
  price: number
  network_fee: number | null
  service_fee: number | null
  received_currency: string
  sell_currency: string
  buy_currency: string
}

/**
 * Core portfolio metrics
 */
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
 * Extended portfolio metrics including tax and transfer information
 */
export interface ExtendedPortfolioMetrics extends PortfolioMetrics {
  shortTermHoldings: number
  longTermHoldings: number
  sendReceiveMetrics: {
    totalSent: number
    totalReceived: number
    netTransfers: number
  }
  potentialTaxLiabilityST: number
  potentialTaxLiabilityLT: number
}

/**
 * Cost basis calculation result
 */
export interface CostBasisMethodResult {
  totalCostBasis: number
  averageCost: number
  unrealizedGain: number
  unrealizedGainPercent: number
  potentialTaxLiabilityST: number
  potentialTaxLiabilityLT: number
  realizedGains: number
  remainingBtc: number
}

/**
 * Bitcoin holding for FIFO/LIFO calculations
 */
export interface BTCHolding {
  date: string
  amount: number
  costBasis: number
  pricePerCoin: number
}

/**
 * Performance metrics for UI display
 */
export interface PerformanceMetrics {
  cumulative: {
    total: { percent: number; dollar: number }
    day: { percent: number; dollar: number }
    week: { percent: number; dollar: number }
    month: { percent: number | null; dollar: number | null }
    ytd: { percent: number | null; dollar: number | null }
    threeMonth: { percent: number | null; dollar: number | null }
    year: { percent: number | null; dollar: number | null }
    twoYear: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fourYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
  compoundGrowth: {
    total: number | null
    oneYear: number | null
    twoYear: number | null
    threeYear: number | null
    fourYear: number | null
    fiveYear: number | null
    sixYear: number | null
    sevenYear: number | null
    eightYear: number | null
  }
  allTimeHigh: {
    price: number
    date: string
  }
  maxDrawdown: {
    percent: number
    fromDate: string
    toDate: string
    portfolioATH: number
    portfolioLow: number
  }
  hodlTime: number
  currentPrice?: number
  averageBuyPrice?: number
  lowestBuyPrice?: number
  highestBuyPrice?: number
}

/**
 * Dollar-cost averaging performance comparison result
 */
export interface DCAPerformanceResult {
  dcaReturn: number
  lumpSumReturn: number
  outperformance: number
}

/**
 * Sorting field for cost basis table
 */
export type SortField = 'method' | 'totalBtc' | 'costBasis' | 'averageCost' | 'realizedGains' | 'unrealizedGain' | 'unrealizedGainPercent' | 'taxLiabilityST' | 'taxLiabilityLT'

/**
 * Sorting configuration
 */
export interface SortConfig {
  field: SortField
  direction: 'asc' | 'desc'
}

/**
 * Portfolio function signatures for consistency
 */
export interface PortfolioFunctions {
  getPortfolioMetrics: (userId: string, supabase: SupabaseClient<Database>) => Promise<ExtendedPortfolioMetrics>
  calculateCostBasis: (userId: string, method: 'FIFO' | 'LIFO' | 'HIFO', orders: any[], currentPrice: number) => Promise<CostBasisMethodResult>
  getPerformanceMetrics: (userId: string, supabase: SupabaseClient<Database>) => Promise<PerformanceMetrics>
  calculateDCAPerformance: (orders: any[], currentPrice: number) => DCAPerformanceResult
}
