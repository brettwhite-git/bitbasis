import { Database } from "@/types/supabase";

// =============================================
// Database Insert Types (Reference)
// =============================================

// Type helpers for extracting table row types
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Specific insert types needed for the database operations
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type TransferInsert = Database['public']['Tables']['transfers']['Insert'];
export type CSVUploadInsert = Database['public']['Tables']['csv_uploads']['Insert'];
export type CSVUploadUpdate = Database['public']['Tables']['csv_uploads']['Update'];

// =============================================
// Parsed Transaction Types
// =============================================

// Represents a row read from a CSV, potentially with variations in headers
export interface CSVRow {
  [header: string]: string | undefined;
}

// Base properties common to all parsed transactions
interface ParsedBase {
  id: string; // Unique identifier for the row/entry during processing
  originalRowData?: CSVRow | Record<string, any>; // Store original for reference/debugging
  source: 'csv' | 'manual'; // Origin of the data
  date: Date | null; // Parsed transaction date
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'unknown'; // Normalized type
  asset?: string | null; // Primarily BTC for now
  exchange?: string | null;
}

// Represents a parsed order (buy/sell) transaction
export interface ParsedOrder extends ParsedBase {
  type: 'buy' | 'sell';
  price: number | null; // Price per unit
  // Buy specific
  buyFiatAmount?: number | null;
  buyCurrency?: string | null;
  receivedBtcAmount?: number | null; // BTC received
  // Sell specific
  sellBtcAmount?: number | null; // BTC sold
  sellBtcCurrency?: string | null;
  receivedFiatAmount?: number | null;
  receivedFiatCurrency?: string | null;
  // Fees
  serviceFee?: number | null;
  serviceFeeCurrency?: string | null;
}

// Represents a parsed transfer (deposit/withdrawal) transaction
export interface ParsedTransfer extends ParsedBase {
  type: 'deposit' | 'withdrawal';
  amountBtc: number | null; // Amount of BTC transferred
  feeAmountBtc?: number | null; // Network fee (withdrawal specific)
  // Optional fields often missing in transfers
  amountFiat?: number | null; // Fiat value at time of transfer
  price?: number | null; // BTC price at time of transfer
  hash?: string | null; // Transaction hash
}

// Union type for any parsed transaction
export type ParsedTransaction = ParsedOrder | ParsedTransfer;

// =============================================
// Validation & Preview Types
// =============================================

// Represents a specific validation issue found in a transaction
export interface ValidationIssue {
  transactionId: string; // Links back to the ParsedTransaction id
  // Allow any key from ParsedOrder or ParsedTransfer, plus 'general'
  field: keyof ParsedOrder | keyof ParsedTransfer | 'general'; 
  message: string; // Description of the issue
  severity: 'error' | 'warning'; // Errors block import, warnings are informational
}

// Data structure for the import preview component
export interface ImportPreviewData {
  transactions: ParsedTransaction[];
  validationIssues: ValidationIssue[];
  fileName?: string; // Optional: name of the uploaded file
  source: 'csv' | 'manual';
  // Add calculated stats if needed here later
  // Example: totalBuys, totalSells etc.
}

// =============================================
// CSV Upload Management Types
// =============================================

// Represents a previously uploaded CSV file record
export type UploadedCSV = Tables<'csv_uploads'>; // Use the Row type from Supabase

// =============================================
// Utility Types (Example)
// =============================================

// Could add more general utility types if needed 