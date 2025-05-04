import { Order } from '@/lib/core/portfolio/types';

/**
 * Calculates the difference in days between two dates
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the difference in years between two dates (fractional)
 */
export function calculateYearsBetween(startDate: Date | null | undefined, endDate: Date): number {
  if (!startDate) return 0;
  
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;  // Account for leap years
  const years = (endDate.getTime() - startDate.getTime()) / millisecondsPerYear;
  
  return Math.max(0.01, years); // Ensure we don't return negative or extremely small values
}

/**
 * Gets portfolio state at a specific date
 */
export function getPortfolioStateAtDate(
  portfolioHistory: Array<{ date: Date; btc: number; usdValue: number; investment: number }>,
  targetDate: Date,
  currentPrice: number
): { btc: number; usdValue: number; investment: number } {
  if (portfolioHistory.length === 0) {
    return { btc: 0, usdValue: 0, investment: 0 };
  }
  
  // Initialize with default values in case portfolio history is empty
  let closestPastState = {
    btc: 0,
    usdValue: 0,
    investment: 0,
    date: new Date(0) // Earliest possible date
  };
  
  // Find the most recent state before or on the target date
  for (const entry of portfolioHistory) {
    if (entry.date <= targetDate) {
      closestPastState = entry;
    } else {
      break;
    }
  }
  
  // Return portfolio state, valuing BTC at current price
  return {
    btc: closestPastState.btc,
    usdValue: closestPastState.btc * currentPrice, 
    investment: closestPastState.investment
  };
}

/**
 * Filters orders by type
 */
export function filterOrdersByType(orders: Order[], type: 'buy' | 'sell'): Order[] {
  return orders.filter(order => order.type === type);
}

/**
 * Calculates compound annual growth rate (CAGR)
 */
export function calculateCAGR(endValue: number, startValue: number, years: number): number | null {
  if (startValue <= 0 || years <= 0) return null;
  // (End Value / Start Value)^(1/Years) - 1
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Safely calculates percentage change
 */
export function calculatePercentChange(endValue: number, startValue: number): number {
  if (startValue === 0) return 0;
  return ((endValue - startValue) / Math.abs(startValue)) * 100;
}

/**
 * Safely formats big numbers for display
 * Use for very large numbers that might need abbreviation
 */
export function formatLargeNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}
