/**
 * Shared formatting utility functions for calculator components
 */

/**
 * Formats a number with locale-specific formatting and optional custom options
 */
export const formatNumber = (value: string | number, options?: Intl.NumberFormatOptions): string => {
  if (value === '' || value === undefined || value === null) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return typeof value === 'string' ? value : '';
  return num.toLocaleString('en-US', options);
};

/**
 * Formats a BTC value with 8 decimal places
 */
export const formatBTC = (btc: string | number): string => {
  if (!btc) return '0';
  const value = typeof btc === 'string' ? parseFloat(btc.replace(/,/g, '')) : btc;
  if (isNaN(value)) return '0';
  return value.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
};

/**
 * Formats a currency value in USD
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

/**
 * Converts BTC to Satoshis
 */
export const btcToSats = (btc: string): string => {
  const btcValue = parseFloat(btc.replace(/,/g, ''));
  if (isNaN(btcValue)) return '0';
  return Math.round(btcValue * 100000000).toString();
};

/**
 * Converts Satoshis to BTC
 */
export const satsToBtc = (sats: string): string => {
  const satsValue = parseFloat(sats.replace(/,/g, ''));
  if (isNaN(satsValue)) return '0';
  return (satsValue / 100000000).toString();
};

/**
 * Validates if a string is a valid BTC input value
 */
export const isValidSatsInputValue = (value: string): boolean => {
  // Empty is valid (will be treated as 0)
  if (!value) return true;
  
  // Remove commas for validation
  const sanitized = value.replace(/,/g, '');
  
  // Check if it's a valid decimal number
  const regex = /^(\d*\.?\d*)$/;
  if (!regex.test(sanitized)) return false;
  
  // Validate the number isn't too large
  try {
    const num = parseFloat(sanitized);
    return !isNaN(num) && isFinite(num) && num >= 0;
  } catch (e) {
    return false;
  }
}; 