/**
 * Transaction-specific import/export utilities
 */
import { UnifiedTransaction } from "@/types/transactions"
import { formatBTC, formatCurrency, formatDate } from "@/lib/utils/format"
import { exportToCSV, importFromCSV } from "@/lib/utils/import-export"

/**
 * Format a transaction for CSV export
 * 
 * @param transaction Transaction to format
 * @returns Formatted object ready for CSV export
 */
export function formatTransactionForCSV(transaction: UnifiedTransaction) {
  // Calculate BTC amount based on transaction type
  const btcAmount = transaction.type === 'buy' || transaction.type === 'deposit' 
    ? transaction.received_amount 
    : transaction.sent_amount

  // Calculate USD value based on transaction type  
  const usdValue = transaction.type === 'buy' || transaction.type === 'withdrawal'
    ? transaction.sent_amount
    : transaction.received_amount

  return {
    Date: formatDate(transaction.date),
    Type: transaction.type,
    Asset: transaction.asset,
    "Amount (BTC)": formatBTC(btcAmount, 8, false),
    "Price at Tx (USD)": formatCurrency(transaction.price),
    "Value (USD)": formatCurrency(usdValue),
    "Fees (USD)": formatCurrency(transaction.fee_currency === 'USD' ? transaction.fee_amount : null),
    Exchange: transaction.from_address_name || transaction.to_address_name || "-",
    "Fees (BTC)": formatBTC(transaction.fee_currency === 'BTC' ? transaction.fee_amount : null, 8, false),
    "Transaction ID": transaction.transaction_hash || "-"
  }
}

/**
 * Export transactions to CSV
 * 
 * @param transactions Array of transactions to export
 * @returns Promise that resolves when the export is complete
 */
export async function exportTransactionsToCSV(transactions: UnifiedTransaction[]): Promise<void> {
  try {
    // Map transactions to CSV format
    const csvData = transactions.map(formatTransactionForCSV)
    
    // Export using the generic CSV export utility
    await exportToCSV(csvData, {
      filename: 'transactions',
      addTimestamp: true
    })
  } catch (error) {
    console.error('Failed to export transactions:', error)
    throw error
  }
}

/**
 * Parse a CSV file into transactions
 * This is a placeholder - actual implementation will need to 
 * handle mapping CSV fields to the transaction model.
 * 
 * @param file CSV file to parse
 * @returns Promise that resolves with parsed transactions
 */
export async function importTransactionsFromCSV(file: File): Promise<Partial<UnifiedTransaction>[]> {
  try {
    // Import the CSV file
    const rawData = await importFromCSV(file)
    
    // This will need additional processing to map CSV fields to transaction fields
    // and validate the data before returning
    
    return (rawData as Record<string, unknown>[]).map((row: Record<string, unknown>) => {
      // Basic mapping of fields - this needs enhancement based on actual CSV format
      return {
        // Map fields and convert types as needed
        // This is just a placeholder implementation
        date: typeof row.Date === 'string' ? row.Date : undefined,
        type: typeof row.Type === 'string' ? row.Type.toLowerCase() : undefined,
        asset: typeof row.Asset === 'string' ? row.Asset : 'BTC',
        // Add other fields...
      } as Partial<UnifiedTransaction>
    })
  } catch (error) {
    console.error('Failed to import transactions:', error)
    throw error
  }
} 