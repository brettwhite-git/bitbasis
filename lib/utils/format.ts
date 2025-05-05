/**
 * Formats a number as a currency string in USD
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '-';
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
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formats a number as a BTC amount
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 8)
 * @param includeSuffix - Whether to include the "BTC" suffix (default: true)
 * @returns Formatted BTC string
 */
export function formatBTC(
  value: number | null | undefined,
  decimals: number = 8,
  includeSuffix: boolean = true
): string {
  if (value === null || value === undefined) return '-';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
  
  return includeSuffix ? `${formatted} BTC` : formatted;
}

/**
 * Formats a date object or string into a localized date and time string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-'; // Handle invalid dates
  
  return dateObj.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
}

/**
 * Capitalizes the first letter of each word in an exchange name
 * @param exchange - Exchange name to format
 * @returns Formatted exchange name
 */
export function capitalizeExchange(exchange: string | null | undefined): string {
  if (!exchange) return '-';
  return exchange.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
} 