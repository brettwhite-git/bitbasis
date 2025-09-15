/**
 * Portfolio Chart Service Types
 * 
 * This file contains interfaces and types used by the portfolio chart data services.
 */

// SupabaseClient, Database, Order not used in type definitions

/**
 * Spot price data from database
 */
export interface SpotPriceData {
  price_usd: number
  updated_at: string
  source?: string
}

/**
 * Historical price data point
 */
export interface HistoricalPriceData {
  date: string
  price_usd: number
}

/**
 * Portfolio data point for charting
 */
export interface PortfolioDataPoint {
  date: Date
  month: string // YYYY-MM format for grouping
  portfolioValue: number
  costBasis: number
  cumulativeBTC: number
  btcPrice: number
}

/**
 * Configuration for chart data processing
 */
export interface ChartDataOptions {
  timeRange: TimeRange
  includeMovingAverages?: boolean
  movingAveragePeriods?: number[]
  resolution?: 'high' | 'medium' | 'low'
}

/**
 * Time range for chart data filtering
 */
export type TimeRange = '6M' | '1Y' | '2Y' | '3Y' | '5Y' | 'ALL'

/**
 * Portfolio data service interface
 */
export interface PortfolioDataService {
  /**
   * Fetches and processes portfolio data for chart display
   */
  getChartData(userId: string, options: ChartDataOptions): Promise<PortfolioDataPoint[]>
  
  /**
   * Gets the latest spot price
   */
  getCurrentPrice(source?: string): Promise<number>
}

/**
 * Chart configuration service interface
 */
export interface ChartConfigService {
  /**
   * Creates configuration for portfolio summary chart
   */
  createSummaryChartConfig(data: PortfolioDataPoint[]): any // Replace 'any' with actual return type
  
  /**
   * Creates configuration for performance chart
   */
  createPerformanceChartConfig(data: PortfolioDataPoint[], options: ChartDataOptions): any // Replace 'any' with actual return type
}

/**
 * Base chart component props
 */
export interface BaseChartProps {
  data?: PortfolioDataPoint[]
  options?: ChartDataOptions | {
    data: any;
    options: any;
  }
  height?: number | string
  width?: number | string
  className?: string
}

/**
 * Portfolio summary chart props
 */
export interface PortfolioSummaryChartProps extends Omit<BaseChartProps, 'data'> {
  data?: PortfolioDataPoint[]
  timeframe: '6M' | '1Y'
}

/**
 * Performance chart props
 */
export interface PerformanceChartProps extends Omit<BaseChartProps, 'data'> {
  data?: PortfolioDataPoint[]
  showMovingAverages?: boolean
  showCostBasis?: boolean
}

/**
 * Moving average calculation result
 */
export interface MovingAverageResult {
  period: number
  values: (number | null)[]
}

/**
 * Processed chart data with calculated metrics
 */
export interface ProcessedChartData {
  dataPoints: PortfolioDataPoint[]
  movingAverages?: Record<number, MovingAverageResult>
  trendlines?: {
    support: number[]
    resistance: number[]
  }
} 