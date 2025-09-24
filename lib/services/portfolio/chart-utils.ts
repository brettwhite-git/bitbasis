/**
 * Chart Utilities
 * 
 * Shared utilities for chart functionality
 */

import { PortfolioDataPoint, MovingAverageResult } from "./types"

/**
 * Calculates moving average from array of values
 */
export function calculateMovingAverage(
  data: (number | null)[],
  windowSize: number
): (number | null)[] {
  const result: (number | null)[] = []
  const validData = data.map(d => d === null ? NaN : d) // Treat null as NaN for calculations

  for (let i = 0; i < validData.length; i++) {
    if (i < windowSize - 1) {
      result.push(null) // Not enough data for a full window
    } else {
      const windowSlice = validData.slice(i - windowSize + 1, i + 1)
      const validWindowValues = windowSlice.filter(v => !isNaN(v))
      if (validWindowValues.length > 0) {
        const sum = validWindowValues.reduce((acc, val) => acc + val, 0)
        result.push(sum / validWindowValues.length)
      } else {
        result.push(null) // No valid data in window
      }
    }
  }
  return result
}

/**
 * Calculates multiple moving averages at once
 */
export function calculateMultipleMovingAverages(
  dataPoints: PortfolioDataPoint[],
  periods: number[]
): Record<number, MovingAverageResult> {
  const values = dataPoints.map(point => point.portfolioValue)
  
  const results: Record<number, MovingAverageResult> = {}
  
  periods.forEach(period => {
    results[period] = {
      period,
      values: calculateMovingAverage(values, period)
    }
  })
  
  return results
}

/**
 * Formats date for chart labels based on time range
 */
export function formatChartDate(date: Date, timeRange: string): string {
  if (timeRange === 'ALL' || timeRange === '5Y') {
    // Show only month and year for long time ranges
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } else if (timeRange === '3Y' || timeRange === '2Y') {
    // Show abbreviated month and year for medium ranges
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  } else {
    // Show more detailed date for shorter ranges
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

/**
 * Downsamples data for better performance with large datasets
 */
export function downsampleData(
  data: PortfolioDataPoint[],
  targetPoints: number
): PortfolioDataPoint[] {
  if (!data || data.length <= targetPoints) return data || [];
  
  // Simple downsampling: take every nth point
  const skip = Math.ceil(data.length / targetPoints);
  
  // Always include first and last points
  const result: PortfolioDataPoint[] = [];
  
  // Add the first point if it exists
  if (data.length > 0 && data[0] !== undefined) {
    result.push(data[0]);
  }
  
  for (let i = skip; i < data.length - skip; i += skip) {
    const point = data[i];
    if (point !== undefined) {
      result.push(point);
    }
  }
  
  // Add the last point if it exists and is different from the first point
  const lastIndex = data.length - 1;
  if (lastIndex > 0 && data[lastIndex] !== undefined) {
    result.push(data[lastIndex]);
  }
  
  return result;
}

/**
 * Calculates appropriate point radius based on data length
 */
export function calculatePointRadius(dataLength: number): number {
  if (dataLength > 100) return 0 // Hide points for large datasets
  if (dataLength > 50) return 2 // Small points for medium datasets
  return 4 // Normal points for small datasets
}

/**
 * Calculates maximum number of ticks for x-axis based on data length
 */
export function calculateMaxTicks(dataLength: number, timeRange: string): number {
  if (timeRange === 'ALL' || timeRange === '5Y') return 12 // Show about 1 tick per month for long periods
  if (timeRange === '3Y' || timeRange === '2Y') return 18 // More ticks for medium periods
  if (timeRange === '1Y') return 24 // Even more for 1 year
  return 12 // Default for shorter periods (6M)
} 