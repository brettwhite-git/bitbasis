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
 * For portfolios with cash flows, this represents the growth rate of the portfolio value
 * Note: This is a time-weighted return, not money-weighted (IRR)
 */
export function calculateCAGR(endValue: number, startValue: number, years: number): number | null {
  if (startValue <= 0 || years <= 0 || endValue <= 0) return null;
  
  // Ensure we have meaningful time period (at least 1 month)
  if (years < 0.083) return null; // Less than 1 month
  
  // (End Value / Start Value)^(1/Years) - 1
  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  
  // Cap extreme values to prevent display issues
  return Math.min(Math.max(cagr, -99.99), 9999.99);
}

/**
 * Calculates approximate CAGR for short periods (less than 1 year)
 * This annualizes the return to show what the equivalent annual rate would be
 */
export function calculateApproximateCAGR(endValue: number, startValue: number, years: number): number | null {
  if (startValue <= 0 || years <= 0 || endValue <= 0) return null;
  
  // For very short periods (less than 3 months), return null to avoid extreme values
  if (years < 0.25) return null;
  
  // Calculate the annualized return
  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  
  // Cap extreme values more aggressively for short periods
  return Math.min(Math.max(cagr, -95), 500);
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

/**
 * Calculates BTC holdings at a specific historical date
 * This is used for transaction-based CAGR calculations
 */
export function calculateBTCHoldingsAtDate(
  transactions: Array<{ date: string; type: string; sent_amount?: number | null; received_amount?: number | null; sent_currency?: string | null; received_currency?: string | null }>,
  targetDate: Date
): number {
  let btcHoldings = 0;
  
  // Process all transactions up to the target date
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    
    // Only process transactions that occurred before or on the target date
    if (transactionDate <= targetDate) {
      if (transaction.type === 'buy' && transaction.received_currency === 'BTC' && transaction.received_amount) {
        btcHoldings += transaction.received_amount;
      } else if (transaction.type === 'sell' && transaction.sent_currency === 'BTC' && transaction.sent_amount) {
        btcHoldings -= transaction.sent_amount;
      }
      // Note: We don't include deposits/withdrawals in CAGR calculation as they don't affect cost basis
    }
  });
  
  return Math.max(0, btcHoldings); // Ensure non-negative
}

/**
 * Gets the closest historical BTC price for a given date
 * This will be used to calculate portfolio values at historical points
 */
export async function getHistoricalBTCPrice(
  targetDate: Date,
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<number | null> {
  try {
    // Format the target date to find the closest month-end price
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth(); // 0-indexed
    
    // Try to get the exact month first
    const exactMonthEnd = new Date(targetYear, targetMonth + 1, 0); // Last day of target month
    const exactDateStr = exactMonthEnd.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('btc_monthly_close')
      .select('close')
      .eq('date', exactDateStr)
      .single();
    
    if (!error && data) {
      return parseFloat(data.close);
    }
    
    // If exact month not found, get the closest available price
    const { data: closestData, error: closestError } = await supabase
      .from('btc_monthly_close')
      .select('close, date')
      .lte('date', exactDateStr)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (!closestError && closestData) {
      return parseFloat(closestData.close);
    }
    return null;
  } catch (error) {
    console.error('❌ Historical Price Debug: Error fetching historical BTC price:', error);
    return null;
  }
}
