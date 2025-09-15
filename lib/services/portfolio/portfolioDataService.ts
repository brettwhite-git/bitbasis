/**
 * PortfolioDataService
 * 
 * Service for fetching and processing portfolio data for charts
 */

import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"
import { Order } from "@/lib/core/portfolio/types"
// MonthlyPortfolioCalculator not used in this service
import { 
  PortfolioDataService, 
  PortfolioDataPoint, 
  ChartDataOptions, 
  // SpotPriceData not used
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
   * Gets current Bitcoin price from spot_price table
   */
  async getCurrentPrice(source: string = 'coinpaprika'): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('spot_price')
        .select('price_usd')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.warn('Error fetching current price from database:', error)
        return 0
      }

      return data?.price_usd || 0
    } catch (error) {
      console.error('Error in getCurrentPrice:', error)
      return 0
    }
  }

  /**
   * Gets chart data for performance charts
   */
  async getChartData(userId: string, options: ChartDataOptions): Promise<PortfolioDataPoint[]> {
    try {
      // Get current price
      const currentPrice = await this.getCurrentPrice()
      
      // Get user's transactions (buy/sell only)
      const { data: rawTransactions, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .in('type', ['buy', 'sell'])
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching transactions:', error)
        return []
      }

      // Normalize and process the data
      const transactions = this.normalizeTransactionData(rawTransactions || [])
      const processedData = this.processTransactionsData(transactions, currentPrice)
      
      // Apply filters and options
      const filteredData = this.filterByTimeRange(processedData, options.timeRange)
      return this.applyDataOptions(filteredData, options)
      
    } catch (error) {
      console.error('Error in getChartData:', error)
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