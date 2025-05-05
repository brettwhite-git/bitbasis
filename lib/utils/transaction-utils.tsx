import { 
  ArrowUpRight,
  ArrowDownRight, 
  CircleArrowRight, 
  CircleArrowLeft, 
  CircleArrowDown, 
  CircleArrowUp 
} from "lucide-react";

/**
 * Transaction types supported by the application
 */
export type TransactionType = 'buy' | 'sell' | 'deposit' | 'withdrawal';

/**
 * Get the appropriate icon component for a transaction type
 * @param type - Transaction type
 * @returns React component for the icon
 */
export function getTransactionIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'buy':
      return <CircleArrowRight className="mr-1 h-4 w-4" />;
    case 'sell':
      return <CircleArrowLeft className="mr-1 h-4 w-4" />;
    case 'deposit':
      return <CircleArrowDown className="mr-1 h-4 w-4" />;
    case 'withdrawal':
      return <CircleArrowUp className="mr-1 h-4 w-4" />;
    default:
      return null;
  }
}

/**
 * Get CSS class names for styling based on transaction type
 * @param type - Transaction type
 * @returns CSS class string
 */
export function getTransactionTypeStyles(type: string): string {
  switch (type.toLowerCase()) {
    case 'buy':
      return "bg-gradient-to-r from-bitcoin-orange/90 to-bitcoin-orange/70 border-bitcoin-orange/40 text-white";
    case 'sell':
      return "bg-gradient-to-r from-red-500/90 to-red-400/70 border-red-500/40 text-white";
    case 'deposit':
      return "bg-gradient-to-r from-green-500/90 to-green-400/70 border-green-500/40 text-white";
    case 'withdrawal':
      return "bg-gradient-to-r from-blue-500/90 to-blue-400/70 border-blue-500/40 text-white";
    default:
      return "";
  }
}

/**
 * Get CSS class names for styling term badges (SHORT/LONG)
 * @param isShortTerm - Whether the transaction is short-term
 * @returns CSS class string
 */
export function getTermStyles(isShortTerm: boolean): string {
  return isShortTerm
    ? "border-purple-500 text-purple-500"
    : "border-green-500 text-green-500";
}

/**
 * Check if a transaction date is within the short-term period (less than 1 year)
 * @param date - Transaction date
 * @param currentDate - Current date for comparison (defaults to now)
 * @returns True if the transaction is short-term
 */
export function isShortTerm(date: string | Date, currentDate: Date = new Date()): boolean {
  const transactionDate = typeof date === 'string' ? new Date(date) : date;
  const oneYearAgo = new Date(currentDate);
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
  
  // Return true if the transaction date is AFTER one year ago (less than 1 year hold)
  return transactionDate > oneYearAgo;
}

/**
 * Normalize transaction type strings, handling common variations
 * @param type - Raw transaction type string
 * @returns Normalized transaction type
 */
export function normalizeTransactionType(type: string | null | undefined): TransactionType | 'unknown' {
  if (!type) return 'unknown';

  // Convert to lowercase and remove extra spaces
  const normalized = type.toLowerCase().trim();

  // Common variations
  const buyVariants = ['buy', 'bought', 'purchase', 'acquire'];
  const sellVariants = ['sell', 'sold', 'sale'];
  const withdrawalVariants = ['withdrawl', 'withdraw', 'withdrawal', 'withdrawel', 'send', 'sent'];
  const depositVariants = ['deposit', 'deposits', 'receive', 'received', 'incoming'];

  if (buyVariants.includes(normalized)) return 'buy';
  if (sellVariants.includes(normalized)) return 'sell';
  if (withdrawalVariants.includes(normalized)) return 'withdrawal';
  if (depositVariants.includes(normalized)) return 'deposit';

  return 'unknown';
} 