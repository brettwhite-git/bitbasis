/**
 * Formats a number as a currency string in USD
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
}

/**
 * Formats a number as a percentage string
 * @param value - Number to format (expected as a percentage value, e.g. 10 for 10%)
 * @param options - Intl.NumberFormat options
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value / 100); // Divide by 100 to convert to proper value for percentage formatting
}

/**
 * Formats a number with commas as thousands separators
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formats a number as a BTC amount
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 8)
 * @returns Formatted BTC string
 */
export function formatBTC(
  value: number,
  decimals: number = 8
): string {
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)} BTC`;
} 