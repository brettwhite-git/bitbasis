import { TransactionType } from "@/lib/utils/transaction-utils";

/**
 * Represents a unified transaction structure for display in the UI
 */
export interface UnifiedTransaction {
  id: string; 
  date: string;
  type: TransactionType;
  asset: string;
  btc_amount: number | null;
  usd_value: number | null;
  fee_usd: number | null;
  price_at_tx: number | null;
  exchange: string | null;
  network_fee_btc: number | null;
  txid: string | null;
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