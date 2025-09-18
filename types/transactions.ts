/**
 * Unified transaction type that matches the database schema exactly
 * This is the canonical type - all other UnifiedTransaction definitions should be removed
 */
export interface UnifiedTransaction {
  // Database fields (matching supabase.ts exactly)
  id: number;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  date: string;
  type: string; // Allows all transaction types from database
  asset: string;
  sent_amount: number | null;
  sent_currency: string | null;
  sent_cost_basis: number | null;
  from_address: string | null;
  from_address_name: string | null;
  to_address: string | null;
  to_address_name: string | null;
  received_amount: number | null;
  received_currency: string | null;
  received_cost_basis: number | null;
  fee_amount: number | null;
  fee_currency: string | null;
  fee_cost_basis: number | null;
  realized_return: number | null;
  fee_realized_return: number | null;
  transaction_hash: string | null;
  comment: string | null;
  price: number | null;
  csv_upload_id: string | null;
}

// Specific transaction types (for UI type safety)
export type TransactionType = 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest';

// Type guard to ensure transaction type is valid
export function isValidTransactionType(type: string): type is TransactionType {
  return ['buy', 'sell', 'deposit', 'withdrawal', 'interest'].includes(type);
}

// Type guard for database query results
export function isUnifiedTransaction(obj: any): obj is UnifiedTransaction {
  return obj && 
    typeof obj.id === 'number' &&
    typeof obj.date === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.user_id === 'string';
}

/**
 * Configuration for sorting transaction tables
 */
export type SortConfig = {
  column: keyof UnifiedTransaction | null;
  direction: 'asc' | 'desc';
}

/**
 * Filter state for transaction tables
 */
export interface TransactionFilterState {
  searchQuery: string;
  dateRange: {
    from?: Date;
    to?: Date;
  } | undefined;
  typeFilter: string;
  termFilter: string;
  exchangeFilter: string;
}

/**
 * Props for the TransactionsTable component
 */
export interface TransactionsTableProps {
  currentDateISO: string;
  paginationContainerId: string;
  transactionCountContainerId: string;
}

/**
 * Props for the TransactionRow component
 */
export interface TransactionRowProps {
  transaction: UnifiedTransaction;
  isSelected: boolean;
  onSelect: (id: string) => void;
  currentDate: Date;
}

/**
 * Props for the TransactionBadge component
 */
export interface TransactionBadgeProps {
  type: TransactionType;
  className?: string;
}

/**
 * Props for the TermBadge component
 */
export interface TermBadgeProps {
  date: string;
  currentDate: Date;
  className?: string;
} 