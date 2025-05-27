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
export interface MonthlyOrder {
  id: number
  date: string
  type: 'buy' | 'sell'
  received_btc_amount: number | null
  buy_fiat_amount: number | null
  service_fee: number | null
  service_fee_currency: string | null
  sell_btc_amount: number | null
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
      // Fetch user orders
      const orders = await this.fetchUserOrders(userId)
      if (!orders.length) return []

      // Get date range for calculation
      const { startDate, endDate } = this.getDateRange(orders, options.timeRange)
      
      // Fetch historical BTC prices for the date range
      const historicalPrices = await this.fetchHistoricalPrices(startDate, endDate)
      
      // Get current BTC price for current month
      const currentPrice = await this.getCurrentPrice()
      
      // Calculate monthly data
      return this.processMonthlyData(orders, historicalPrices, currentPrice, startDate, endDate)
    } catch (error) {
      console.error('Error calculating monthly portfolio data:', error)
      return []
    }
  }

  /**
   * Fetches user orders sorted by date
   */
  private async fetchUserOrders(userId: string): Promise<MonthlyOrder[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, price')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (error) throw error
    
    return (data || []).map(order => ({
      id: order.id,
      date: order.date,
      type: order.type as 'buy' | 'sell',
      received_btc_amount: order.received_btc_amount,
      buy_fiat_amount: order.buy_fiat_amount,
      service_fee: order.service_fee,
      service_fee_currency: order.service_fee_currency,
      sell_btc_amount: order.sell_btc_amount,
      price: order.price
    }))
  }

  /**
   * Fetches historical BTC prices from btc_monthly_close table
   */
  private async fetchHistoricalPrices(startDate: Date, endDate: Date): Promise<Map<string, number>> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      // Query the btc_monthly_close table directly
      // Note: Using 'any' cast because btc_monthly_close is not in generated types yet
      const { data, error } = await (this.supabase as any)
        .from('btc_monthly_close')
        .select('date, close')
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true })

      if (error) {
        console.warn('Error fetching historical prices from btc_monthly_close:', error)
        return new Map()
      }

      const priceMap = new Map<string, number>()
      
      data?.forEach((row: any) => {
        const date = new Date(row.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        priceMap.set(monthKey, parseFloat(row.close))
      })

      console.log(`Fetched ${data?.length || 0} historical prices from btc_monthly_close table`)
      return priceMap
      
    } catch (error) {
      console.warn('Error fetching historical prices, falling back to empty map:', error)
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
  private getDateRange(orders: MonthlyOrder[], timeRange?: string): { startDate: Date, endDate: Date } {
    const now = new Date()
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of current month
    
    let startDate: Date
    
    if (timeRange && timeRange !== 'ALL') {
      const monthsBack = this.getMonthsBack(timeRange)
      startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
    } else {
      // Use first order date
      const firstOrder = orders[0]
      if (!firstOrder) {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        const firstOrderDate = new Date(firstOrder.date)
        startDate = new Date(firstOrderDate.getFullYear(), firstOrderDate.getMonth(), 1)
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
    orders: MonthlyOrder[],
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
      
      // Process orders for this month
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.date)
        return orderDate.getFullYear() === currentMonth.getFullYear() && 
               orderDate.getMonth() === currentMonth.getMonth()
      })

      // Update cumulative values with this month's orders
      monthOrders.forEach(order => {
        if (order.type === 'buy') {
          cumulativeBTC += order.received_btc_amount || 0
          cumulativeCostBasis += (order.buy_fiat_amount || 0) + 
                                (order.service_fee && order.service_fee_currency === 'USD' ? order.service_fee : 0)
        } else if (order.type === 'sell') {
          cumulativeBTC -= order.sell_btc_amount || 0
          // Note: We don't subtract from cost basis on sells - this maintains the original investment amount
        }
      })

      // Get BTC price for this month
      let btcPrice: number
      if (isCurrentMonth) {
        btcPrice = currentPrice
      } else {
        btcPrice = historicalPrices.get(monthKey) || 0
        // If no historical price available, try to use the most recent available price
        if (btcPrice === 0 && historicalPrices.size > 0) {
          const availablePrices = Array.from(historicalPrices.values())
          btcPrice = availablePrices[availablePrices.length - 1] || 0
        }
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