/**
 * Monthly Portfolio Calculator
 * 
 * Calculates monthly portfolio data using:
 * - btc_monthly_close table for historical month-end prices
 * - spot_price table for current month real-time pricing
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Simplified Order interface for monthly calculations
export interface MonthlyTransaction {
  id: number
  date: string
  type: 'buy' | 'sell'
  sent_amount: number | null
  sent_currency: string | null
  received_amount: number | null
  received_currency: string | null
  fee_amount: number | null
  fee_currency: string | null
  price: number | null
}

export interface MonthlyPortfolioData {
  month: string // YYYY-MM format
  date: Date // Month-end date
  portfolioValue: number
  costBasis: number
  cumulativeBTC: number
  btcPrice: number
  isCurrentMonth: boolean
}

export interface MonthlyCalculatorOptions {
  timeRange?: '6M' | '1Y' | '2Y' | '3Y' | '5Y' | 'ALL'
  includeCurrentMonth?: boolean
}

export class MonthlyPortfolioCalculator {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Calculates monthly portfolio data for a user
   */
  async calculateMonthlyData(
    userId: string, 
    options: MonthlyCalculatorOptions = {}
  ): Promise<MonthlyPortfolioData[]> {
    try {
      // Fetch user transactions
      const transactions = await this.fetchUserTransactions(userId)
      if (!transactions.length) return []

      // Get date range for calculation
      const { startDate, endDate } = this.getDateRange(transactions, options.timeRange)
      
      // Fetch historical BTC prices for the date range
      const historicalPrices = await this.fetchHistoricalPrices(startDate, endDate)
      
      // Get current BTC price for current month
      const currentPrice = await this.getCurrentPrice()
      
      // Calculate monthly data
      return this.processMonthlyData(transactions, historicalPrices, currentPrice, startDate, endDate)
    } catch (error) {
      console.error('Error calculating monthly portfolio data:', error)
      return []
    }
  }

  /**
   * Fetches user transactions sorted by date
   */
  private async fetchUserTransactions(userId: string): Promise<MonthlyTransaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('id, date, type, sent_amount, sent_currency, received_amount, received_currency, fee_amount, fee_currency, price')
      .eq('user_id', userId)
      .in('type', ['buy', 'sell'])
      .order('date', { ascending: true })

    if (error) throw error
    
    return (data || []).map(transaction => ({
      id: transaction.id,
      date: transaction.date,
      type: transaction.type as 'buy' | 'sell',
      sent_amount: transaction.sent_amount,
      sent_currency: transaction.sent_currency,
      received_amount: transaction.received_amount,
      received_currency: transaction.received_currency,
      fee_amount: transaction.fee_amount,
      fee_currency: transaction.fee_currency,
      price: transaction.price
    }))
  }

  /**
   * Fetches historical BTC prices from btc_monthly_close table
   */
  private async fetchHistoricalPrices(startDate: Date, endDate: Date): Promise<Map<string, number>> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      console.log(`🔍 MonthlyCalculator: Fetching historical prices from ${startDateStr} to ${endDateStr}`)
      
      // Query the btc_monthly_close table directly
      // Note: Using unknown cast because btc_monthly_close is not in generated types yet
      const { data, error } = await (this.supabase as unknown as SupabaseClient<{ btc_monthly_close: { Row: { date: string; close: number } } }>)
        .from('btc_monthly_close')
        .select('date, close')
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true })

      if (error) {
        console.warn('❌ Error fetching historical prices from btc_monthly_close:', error)
        return new Map()
      }

      const priceMap = new Map<string, number>()
      
      data?.forEach((row: { date: string; close: number }) => {
        const date = new Date(row.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        priceMap.set(monthKey, row.close)
      })

      console.log(`✅ MonthlyCalculator: Fetched ${data?.length || 0} historical prices from btc_monthly_close table`)
      console.log(`📊 MonthlyCalculator: Price map keys:`, Array.from(priceMap.keys()).slice(0, 5))
      return priceMap
      
    } catch (error) {
      console.warn('❌ Error fetching historical prices, falling back to empty map:', error)
      return new Map()
    }
  }

  /**
   * Gets current BTC price from spot_price table
   */
  private async getCurrentPrice(): Promise<number> {
    const { data, error } = await this.supabase
      .from('spot_price')
      .select('price_usd')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return data?.price_usd || 0
  }

  /**
   * Determines the date range for calculations
   */
  private getDateRange(transactions: MonthlyTransaction[], timeRange?: string): { startDate: Date, endDate: Date } {
    const now = new Date()
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of current month
    
    let startDate: Date
    
    if (timeRange && timeRange !== 'ALL') {
      const monthsBack = this.getMonthsBack(timeRange)
      startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
    } else {
      // Use first transaction date
      const firstTransaction = transactions[0]
      if (!firstTransaction) {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        const firstTransactionDate = new Date(firstTransaction.date)
        startDate = new Date(firstTransactionDate.getFullYear(), firstTransactionDate.getMonth(), 1)
      }
    }

    return { startDate, endDate: currentMonthEnd }
  }

  /**
   * Converts time range to months back
   */
  private getMonthsBack(timeRange: string): number {
    switch (timeRange) {
      case '6M': return 6
      case '1Y': return 12
      case '2Y': return 24
      case '3Y': return 36
      case '5Y': return 60
      default: return 12
    }
  }

  /**
   * Processes orders and calculates monthly portfolio data
   */
  private processMonthlyData(
    transactions: MonthlyTransaction[],
    historicalPrices: Map<string, number>,
    currentPrice: number,
    startDate: Date,
    endDate: Date
  ): MonthlyPortfolioData[] {
    const monthlyData: MonthlyPortfolioData[] = []
    let cumulativeBTC = 0
    let cumulativeCostBasis = 0

    // Create month series from start to end
    const currentMonth = new Date(startDate)
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    while (currentMonth <= endDate) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
      const isCurrentMonth = monthKey === currentMonthKey
      
      // Process transactions for this month
      const monthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        return transactionDate.getFullYear() === currentMonth.getFullYear() && 
               transactionDate.getMonth() === currentMonth.getMonth()
      })

      // Update cumulative values with this month's transactions
      monthTransactions.forEach(transaction => {
        if (transaction.type === 'buy') {
          // For buy: received_amount = BTC, sent_amount = USD + fee_amount (USD)
          cumulativeBTC += transaction.received_amount || 0
          const feeAmount = (transaction.fee_amount && transaction.fee_currency === 'USD') ? transaction.fee_amount : 0
          cumulativeCostBasis += (transaction.sent_amount || 0) + feeAmount
        } else if (transaction.type === 'interest') {
          // For interest: received_amount = BTC, cost basis = $0 (taxable income)
          cumulativeBTC += transaction.received_amount || 0
          // Interest has $0 cost basis - it's taxable income when received
        } else if (transaction.type === 'sell') {
          // For sell: sent_amount = BTC sold
          cumulativeBTC -= transaction.sent_amount || 0
          // Note: We don't subtract from cost basis on sells - this maintains the original investment amount
        }
      })

      // Get BTC price for this month
      let btcPrice: number
      if (isCurrentMonth) {
        btcPrice = currentPrice
        console.log(`💰 MonthlyCalculator: Using current price for ${monthKey}: $${btcPrice.toLocaleString()}`)
      } else {
        btcPrice = historicalPrices.get(monthKey) || 0
        // If no historical price available, try to use the most recent available price
        if (btcPrice === 0 && historicalPrices.size > 0) {
          const availablePrices = Array.from(historicalPrices.values())
          btcPrice = availablePrices[availablePrices.length - 1] || 0
        }
        console.log(`📈 MonthlyCalculator: Using historical price for ${monthKey}: $${btcPrice.toLocaleString()} (from btc_monthly_close)`)
      }

      // Calculate portfolio value
      const portfolioValue = cumulativeBTC * btcPrice

      // Create month-end date
      const monthEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      monthlyData.push({
        month: monthKey,
        date: monthEndDate,
        portfolioValue,
        costBasis: cumulativeCostBasis,
        cumulativeBTC,
        btcPrice,
        isCurrentMonth
      })

      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1)
    }

    return monthlyData
  }

  /**
   * Filters monthly data by time range
   */
  filterByTimeRange(data: MonthlyPortfolioData[], timeRange: string): MonthlyPortfolioData[] {
    if (timeRange === 'ALL') return data

    const monthsBack = this.getMonthsBack(timeRange)
    return data.slice(-monthsBack)
  }
} 