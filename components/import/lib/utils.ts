import { ParsedOrder, ParsedTransaction, ParsedTransfer } from "./types";

// =============================================
// Type Guards
// =============================================

/**
 * Type guard to check if a parsed transaction is an order.
 */
export function isOrder(transaction: ParsedTransaction): transaction is ParsedOrder {
  return transaction.type === 'buy' || transaction.type === 'sell';
}

/**
 * Type guard to check if a parsed transaction is a transfer.
 */
export function isTransfer(transaction: ParsedTransaction): transaction is ParsedTransfer {
  return transaction.type === 'deposit' || transaction.type === 'withdrawal';
}

// =============================================
// Formatting Utilities
// =============================================

/**
 * Formats a date string or Date object into a locale-specific string.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-'; // Handle invalid date strings
  return dateObj.toLocaleString();
}

/**
 * Formats a number to a string with a specified number of decimal places.
 */
export function formatNumber(num: number | null | undefined, decimals: number = 8): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formats a number as a USD currency string.
 */
export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Formats file size in bytes into a human-readable string (KB, MB).
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Capitalizes the first letter of each word in an exchange name.
 */
export function capitalizeExchange(exchange: string | null | undefined): string {
  if (!exchange) return '-';
  return exchange.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// =============================================
// Data Transformation Utilities
// =============================================

/**
 * Normalizes transaction type strings, handling common variations and misspellings.
 */
export function normalizeTransactionType(type: string | null | undefined): 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'unknown' {
  if (!type) return 'unknown';

  // Convert to lowercase and remove extra spaces
  const normalized = type.toLowerCase().trim();

  // Common misspellings and variations
  const buyVariants = ['buy'];
  const sellVariants = ['sell'];
  const withdrawalVariants = ['withdrawl', 'withdraw', 'withdrawal', 'withdrawel', 'withdrawls', 'send']; // Added 'send'
  const depositVariants = ['deposit', 'deposits', 'dep', 'receive']; // Added 'receive'

  if (buyVariants.includes(normalized)) {
    return 'buy';
  }
  if (sellVariants.includes(normalized)) {
    return 'sell';
  }
  if (withdrawalVariants.includes(normalized)) {
    return 'withdrawal';
  }
  if (depositVariants.includes(normalized)) {
    return 'deposit';
  }

  console.warn(`Unknown transaction type encountered during normalization: "${type}"`);
  return 'unknown';
}

// =============================================
// Calculation Utilities
// =============================================

/**
 * Determines if a transaction date is within the last year (short-term).
 */
export function isShortTerm(date: string | Date | null | undefined): boolean {
  if (!date) return false; // Or handle as needed, maybe default to false
  const transactionDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(transactionDate.getTime())) return false; // Invalid date

  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  // Return true if the transaction date is AFTER one year ago (held less than 1 year)
  return transactionDate > oneYearAgo;
} 