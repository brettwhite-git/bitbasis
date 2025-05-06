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
  return {
    Date: formatDate(transaction.date),
    Type: transaction.type,
    Asset: transaction.asset,
    "Amount (BTC)": formatBTC(transaction.btc_amount, 8, false),
    "Price at Tx (USD)": formatCurrency(transaction.price_at_tx),
    "Value (USD)": formatCurrency(transaction.usd_value),
    "Fees (USD)": formatCurrency(transaction.fee_usd),
    Exchange: transaction.exchange || "-",
    "Fees (BTC)": formatBTC(transaction.network_fee_btc, 8, false),
    "Transaction ID": transaction.txid || "-"
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
    
    return rawData.map(row => {
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