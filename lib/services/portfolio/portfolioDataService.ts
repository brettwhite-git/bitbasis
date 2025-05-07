/**
 * PortfolioDataService
 * 
 * Service for fetching and processing portfolio data for charts
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"
import { Order } from "@/lib/core/portfolio/types"
import { 
  PortfolioDataService, 
  PortfolioDataPoint, 
  ChartDataOptions, 
  SpotPriceData,
  TimeRange
} from "./types"

// Define a type for the raw order data from database
type RawOrderData = {
  id?: number;
  date: string;
  type: string;
  received_btc_amount: number | null;
  buy_fiat_amount: number | null;
  service_fee: number | null;
  service_fee_currency: string | null;
  sell_btc_amount: number | null;
  received_fiat_amount: number | null;
  price: number | null;
  [key: string]: any;
};

export class PortfolioDataServiceImpl implements PortfolioDataService {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Fetches the current BTC spot price
   */
  async getCurrentPrice(source: string = 'coinpaprika'): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('spot_price')
        .select('price_usd, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      if (!data) throw new Error('No price data available')

      return data.price_usd
    } catch (error) {
      console.error('Error fetching current price:', error)
      // Default to 0 or throw an error based on your error handling strategy
      return 0
    }
  }

  /**
   * Fetches and processes portfolio data for charts
   */
  async getChartData(userId: string, options: ChartDataOptions): Promise<PortfolioDataPoint[]> {
    try {
      // Fetch orders
      const { data: orders, error } = await this.supabase
        .from('orders')
        .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price')
        .eq('user_id', userId)
        .order('date', { ascending: true })

      if (error) throw error
      if (!orders || orders.length === 0) return []

      // Normalize the order data to ensure type safety
      const normalizedOrders = this.normalizeOrderData(orders)

      // Get current price for up-to-date portfolio valuation
      const currentPrice = await this.getCurrentPrice()

      // Process orders into portfolio data points
      const processedData = this.processOrdersData(normalizedOrders, currentPrice)
      
      // Filter based on time range
      const filteredData = this.filterByTimeRange(processedData, options.timeRange)
      
      // Apply any additional data processing based on options
      return this.applyDataOptions(filteredData, options)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      return []
    }
  }

  /**
   * Gets monthly data for summary chart
   */
  async getMonthlyData(userId: string, timeRange: '6M' | '1Y'): Promise<PortfolioDataPoint[]> {
    try {
      // Fetch orders
      const { data: orders, error } = await this.supabase
        .from('orders')
        .select('date, type, received_btc_amount, sell_btc_amount, buy_fiat_amount, service_fee, price')
        .eq('user_id', userId)
        .order('date', { ascending: true })

      if (error) throw error
      if (!orders || orders.length === 0) return []

      // Get current price for updating the current month
      const currentPrice = await this.getCurrentPrice()

      // Normalize the order data to ensure type safety
      // Cast to RawOrderData[] to satisfy TypeScript
      const normalizedOrders = this.normalizeOrderData(orders as RawOrderData[])

      // Calculate monthly data
      const monthlyData = this.calculateMonthlyData(normalizedOrders, currentPrice)
      
      // Filter based on time range
      return this.filterByTimeRange(monthlyData, timeRange)
    } catch (error) {
      console.error('Error fetching monthly data:', error)
      return []
    }
  }

  /**
   * Normalizes raw order data to match the expected Order type
   */
  private normalizeOrderData(rawOrders: RawOrderData[]): Order[] {
    return rawOrders.map(order => {
      // Convert type to lowercase to match 'buy' | 'sell' type
      const normalizedType = order.type?.toLowerCase();
      
      // Only include 'buy' or 'sell' orders, skip others
      if (normalizedType !== 'buy' && normalizedType !== 'sell') {
        console.warn(`Skipping order with invalid type: ${order.type}`, order);
        return null;
      }
      
      return {
        ...order,
        type: normalizedType as 'buy' | 'sell',
        // Ensure numeric fields are properly typed
        received_btc_amount: order.received_btc_amount ?? null,
        sell_btc_amount: order.sell_btc_amount ?? null,
        buy_fiat_amount: order.buy_fiat_amount ?? null,
        service_fee: order.service_fee ?? null,
        price: order.price ?? 0, // Default to 0 if price is missing
      };
    }).filter((order): order is Order => order !== null);
  }

  /**
   * Processes raw orders into portfolio data points
   */
  private processOrdersData(orders: Order[], currentPrice: number): PortfolioDataPoint[] {
    // Check for empty orders
    if (!orders || orders.length === 0) return [];

    // Sort orders by date
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    const dataPoints: PortfolioDataPoint[] = []
    let cumulativeBTC = 0
    let cumulativeCostBasis = 0
    let lastPrice = currentPrice || 0 // Default to current price for portfolio valuation, fallback to 0

    // Create comprehensive timeline (daily, weekly, or monthly based on time span)
    const firstOrder = sortedOrders[0]
    
    if (!firstOrder?.date) return []
    
    const startDate = new Date(firstOrder.date)
    const endDate = new Date() // Today

    // We'll use a daily resolution for data processing
    // This can be optimized later for performance
    const currentDate = new Date(startDate)
    const dailyData = new Map<string, PortfolioDataPoint>()

    while (currentDate <= endDate) {
      // Use a non-null assertion to guarantee the string is valid
      const dateStr = currentDate.toISOString().split('T')[0] as string;
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Initialize data point for this date
      dailyData.set(dateStr, {
        date: new Date(currentDate),
        month: monthStr,
        portfolioValue: cumulativeBTC * lastPrice,
        costBasis: cumulativeCostBasis,
        cumulativeBTC: cumulativeBTC,
        btcPrice: lastPrice
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process each order and update the data points
    sortedOrders.forEach(order => {
      if (!order.date) return; // Skip orders with no date
      
      const orderDate = new Date(order.date);
      // Type assertion to guarantee string
      const dateStr = orderDate.toISOString().split('T')[0] as string;
      
      const dataPoint = dailyData.get(dateStr);
      
      if (!dataPoint) return; // Skip if no data point exists for this date
      
      // Update last known price if available from this order
      if (order.price) {
        lastPrice = order.price;
        dataPoint.btcPrice = lastPrice;
      }
      
      // Update portfolio based on order type
      if (order.type === 'buy') {
        cumulativeBTC += order.received_btc_amount ?? 0;
        cumulativeCostBasis += (order.buy_fiat_amount ?? 0) + (order.service_fee ?? 0);
      } else if (order.type === 'sell') {
        cumulativeBTC -= order.sell_btc_amount ?? 0;
        // Sells don't add to cost basis in this calculation method
      }
      
      // Update data point with new values
      dataPoint.cumulativeBTC = cumulativeBTC;
      dataPoint.costBasis = cumulativeCostBasis;
      dataPoint.portfolioValue = cumulativeBTC * lastPrice;
    })

    // Update all dates after the last transaction to use current values
    let lastValidDataPoint: PortfolioDataPoint | null = null
    
    const orderedDates = Array.from(dailyData.keys()).sort()
    
    for (const dateStr of orderedDates) {
      // Type assertion to guarantee string
      const dataPoint = dailyData.get(dateStr as string);
      
      if (!dataPoint) continue; // Skip if data point doesn't exist
      
      // If this point has no transactions, use the last valid values
      if (dataPoint.portfolioValue === 0 && lastValidDataPoint) {
        dataPoint.cumulativeBTC = lastValidDataPoint.cumulativeBTC;
        dataPoint.costBasis = lastValidDataPoint.costBasis;
        dataPoint.portfolioValue = dataPoint.cumulativeBTC * 
          (dataPoint.btcPrice || lastValidDataPoint.btcPrice || currentPrice);
      }
      
      // Use current price for today's valuation
      const today = new Date().toISOString().split('T')[0];
      if (dateStr === today) {
        dataPoint.btcPrice = currentPrice;
        dataPoint.portfolioValue = dataPoint.cumulativeBTC * currentPrice;
      }
      
      if (dataPoint.portfolioValue > 0) {
        lastValidDataPoint = dataPoint;
      }
      
      dataPoints.push(dataPoint);
    }

    return dataPoints
  }

  /**
   * Calculates monthly aggregated data from orders
   */
  private calculateMonthlyData(orders: Order[], currentPrice: number): PortfolioDataPoint[] {
    // Check for empty orders
    if (!orders || orders.length === 0) return [];

    // Sort orders by date
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    const monthlyData = new Map<string, PortfolioDataPoint>()
    let cumulativeBTC = 0
    let cumulativeCostBasis = 0
    let lastPrice = 0

    // Get min and max dates to fill in all months
    const firstOrder = sortedOrders[0]
    
    if (!firstOrder?.date) return []
    
    const startDate = new Date(firstOrder.date)
    const currentDate = new Date()
    
    // Fill in all months between start date and current date
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    let month = new Date(start)
    while (month <= end) {
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      
      monthlyData.set(monthKey, {
        date: new Date(month),
        month: monthKey,
        portfolioValue: 0,
        costBasis: cumulativeCostBasis,
        cumulativeBTC: cumulativeBTC,
        btcPrice: lastPrice
      })
      
      // Move to next month
      month.setMonth(month.getMonth() + 1)
    }

    // Process each order
    sortedOrders.forEach(order => {
      if (!order.date) return; // Skip orders with no date
      
      const date = new Date(order.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (order.price) {
        lastPrice = order.price
      }
      
      // Adjust cumulative BTC and cost basis based on order type
      if (order.type === 'buy') {
        cumulativeBTC += order.received_btc_amount ?? 0
        cumulativeCostBasis += (order.buy_fiat_amount ?? 0) + (order.service_fee ?? 0)
      } else if (order.type === 'sell') {
        cumulativeBTC -= order.sell_btc_amount ?? 0
      }

      let monthData = monthlyData.get(monthKey)
      
      if (!monthData) return
      
      monthData.costBasis = cumulativeCostBasis
      monthData.cumulativeBTC = cumulativeBTC
      monthData.btcPrice = order.price || monthData.btcPrice
      
      // Calculate portfolio value using the price from this order
      monthData.portfolioValue = monthData.cumulativeBTC * (monthData.btcPrice || 0)
    })

    // Convert map to array and sort by month
    const monthlyDataArray = Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month))

    // Fill forward values for months with no transactions
    let lastValidData: PortfolioDataPoint | null = null
    
    const result = monthlyDataArray.map(data => {
      if (data.portfolioValue === 0 && lastValidData) {
        return {
          ...data,
          portfolioValue: lastValidData.cumulativeBTC * (data.btcPrice || lastValidData.btcPrice || 0),
          costBasis: lastValidData.costBasis,
          cumulativeBTC: lastValidData.cumulativeBTC,
          btcPrice: data.btcPrice || lastValidData.btcPrice || 0
        }
      }
      
      if (data.portfolioValue > 0) {
        lastValidData = data
      }
      
      return data
    })

    // Update the current month with the latest price
    const currentMonth = new Date();
    const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    
    // Find the current month in the result
    const currentMonthIndex = result.findIndex(d => d.month === currentMonthKey);
    
    if (currentMonthIndex !== -1) {
      const currentMonthData = result[currentMonthIndex];
      
      if (currentMonthData) {
        // Update price and portfolio value with current price while preserving all required properties
        result[currentMonthIndex] = {
          date: currentMonthData.date,
          month: currentMonthData.month,
          portfolioValue: currentMonthData.cumulativeBTC * currentPrice,
          costBasis: currentMonthData.costBasis,
          cumulativeBTC: currentMonthData.cumulativeBTC,
          btcPrice: currentPrice
        };
        
        console.log(`Updated current month (${currentMonthKey}) with price: ${currentPrice}`);
      }
    }
    
    return result;
  }

  /**
   * Filters data points based on time range
   */
  private filterByTimeRange(data: PortfolioDataPoint[], timeRange: TimeRange): PortfolioDataPoint[] {
    if (!data || data.length === 0) return [];
    if (timeRange === 'ALL') return data;
    
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '6M':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1Y':
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case '2Y':
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 2)
        break
      case '3Y':
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 3)
        break
      case '5Y':
        startDate = new Date(now)
        startDate.setFullYear(now.getFullYear() - 5)
        break
      default:
        return data
    }
    
    return data.filter(point => point.date >= startDate)
  }

  /**
   * Applies additional data processing options
   */
  private applyDataOptions(data: PortfolioDataPoint[], options: ChartDataOptions): PortfolioDataPoint[] {
    if (!data || data.length === 0) return [];
    
    // Apply downsampling if needed
    if (options.resolution && data.length > 100) {
      let targetPoints = 0;
      switch(options.resolution) {
        case 'low': 
          targetPoints = 30;
          break;
        case 'medium':
          targetPoints = 60;
          break;
        case 'high':
          targetPoints = 120;
          break;
        default:
          // No downsampling
          return data;
      }
      
      // Simple downsampling - can be replaced with more sophisticated algorithm
      const step = Math.ceil(data.length / targetPoints);
      const downsampled: PortfolioDataPoint[] = [];
      
      // Always include first and last point
      if (data.length > 0 && data[0]) {
        downsampled.push(data[0]);
      }
      
      for (let i = step; i < data.length - step; i += step) {
        const point = data[i];
        if (point) {
          downsampled.push(point);
        }
      }
      
      if (data.length > 1) {
        const lastPoint = data[data.length - 1];
        if (lastPoint) {
          downsampled.push(lastPoint);
        }
      }
      
      return downsampled;
    }
    
    // If no specific processing, return the original data
    return data;
  }
} 