import { PerformanceMetrics } from './portfolio';

/**
 * Calculates the drawdown ratio from All-Time High price
 * @returns Ratio (not percentage) representing the drawdown from ATH
 */
export function calculateDrawdownFromATHRatio(
  athPrice: number | undefined,
  currentPrice: number | undefined
): number {
  if (!athPrice || !currentPrice || athPrice <= 0) {
    return 0;
  }
  
  // Return the raw ratio for amount calculation
  return (athPrice - currentPrice) / athPrice;
}

/**
 * Calculates the drawdown amount from All-Time High
 * @returns Amount in USD representing potential loss from ATH
 */
export function calculateDrawdownFromATHAmount(
  athPrice: number | undefined,
  currentPrice: number | undefined,
  totalBTC: number | undefined
): number {
  if (!athPrice || !currentPrice || !totalBTC || athPrice <= 0 || totalBTC <= 0) {
    return 0;
  }
  
  const amount = (athPrice - currentPrice) * totalBTC;
  return Math.max(0, amount); // Loss amount cannot be negative
}

/**
 * Calculates the maximum drawdown amount based on max drawdown percentage
 * @returns Amount in USD representing potential loss from ATH based on max drawdown
 */
export function calculateMaxDrawdownAmount(
  athPrice: number | undefined,
  totalBTC: number | undefined,
  maxDrawdownPercent: number | undefined
): number {
  if (!athPrice || !totalBTC || !maxDrawdownPercent || athPrice <= 0 || totalBTC <= 0 || maxDrawdownPercent <= 0) {
    return 0;
  }
  
  const maxDrawdownRatio = maxDrawdownPercent / 100;
  return athPrice * maxDrawdownRatio * totalBTC;
}

/**
 * Calculates the number of days since the all-time high
 * @returns Number of days since ATH
 */
export function calculateDaysSinceATH(athDate: string | undefined): number {
  if (!athDate) {
    return 0;
  }
  
  const athDateTime = new Date(athDate);
  const today = new Date();
  
  // Set time to 00:00:00 to compare dates only
  athDateTime.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - athDateTime.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Helper function to safely access nested performance metrics
 * Handles undefined values gracefully
 */
export function safeMetricValue<T>(
  metrics: PerformanceMetrics | undefined,
  path: string,
  defaultValue: T
): T {
  if (!metrics) return defaultValue;
  
  const parts = path.split('.');
  let value: unknown = metrics;
  
  for (const part of parts) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    value = value[part as keyof typeof value];
  }
  
  return (value !== undefined && value !== null) ? value : defaultValue;
} 