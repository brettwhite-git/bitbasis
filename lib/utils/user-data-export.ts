/**
 * User data export utilities for comprehensive data export
 * Exports all user data including transactions, CSV uploads, and account info
 */
import { UnifiedTransaction } from "@/types/transactions"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { exportToCSV } from "@/lib/utils/import-export"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

/**
 * Interface for CSV upload metadata - using the actual database schema
 */
type CSVUploadData = Database['public']['Tables']['csv_uploads']['Row']

/**
 * Interface for user account data
 */
interface UserAccountData {
  id: string
  email: string | undefined
  created_at: string | undefined
  last_sign_in_at: string | undefined
}

/**
 * Format transaction for comprehensive export
 */
export function formatTransactionForFullExport(transaction: UnifiedTransaction) {
  return {
    // Basic transaction info
    Date: formatDate(transaction.date),
    Type: transaction.type,
    Asset: transaction.asset,
    
    // Amount details
    "Sent Amount": transaction.sent_amount || '',
    "Sent Currency": transaction.sent_currency || '',
    "Sent Cost Basis (USD)": transaction.sent_cost_basis ? formatCurrency(transaction.sent_cost_basis) : '',
    "Received Amount": transaction.received_amount || '',
    "Received Currency": transaction.received_currency || '',
    "Received Cost Basis (USD)": transaction.received_cost_basis ? formatCurrency(transaction.received_cost_basis) : '',
    
    // Price and fees
    "Price at Transaction (USD)": formatCurrency(transaction.price),
    "Fee Amount": transaction.fee_amount || '',
    "Fee Currency": transaction.fee_currency || '',
    "Fee Cost Basis (USD)": transaction.fee_cost_basis ? formatCurrency(transaction.fee_cost_basis) : '',
    
    // Address information
    "From Address": transaction.from_address || '',
    "From Address Name": transaction.from_address_name || '',
    "To Address": transaction.to_address || '',
    "To Address Name": transaction.to_address_name || '',
    
    // Additional details
    "Transaction Hash": transaction.transaction_hash || '',
    "Realized Return (USD)": transaction.realized_return ? formatCurrency(transaction.realized_return) : '',
    "Fee Realized Return (USD)": transaction.fee_realized_return ? formatCurrency(transaction.fee_realized_return) : '',
    "Comment": transaction.comment || ''
  }
}

/**
 * Format CSV upload data for export
 */
export function formatCSVUploadForExport(upload: CSVUploadData) {
  return {
    "Upload Date": formatDate(upload.created_at),
    "Original Filename": upload.original_filename,
    "Filename": upload.filename,
    "File Size": `${Math.round((upload.file_size || 0) / 1024)} KB`,
    "Status": upload.status,
    "Total Rows": upload.row_count || 0,
    "Imported Rows": upload.imported_row_count || 0,
    "Error Message": upload.error_message || ''
  }
}

/**
 * Format user account data for export
 */
export function formatUserAccountForExport(user: UserAccountData) {
  return {
    "Email": user.email || '',
    "Account Created": user.created_at ? formatDate(user.created_at) : '',
    "Last Sign In": user.last_sign_in_at ? formatDate(user.last_sign_in_at) : ''
  }
}

/**
 * Fetch all user transactions
 */
export async function fetchUserTransactions(): Promise<UnifiedTransaction[]> {
  const supabase = createClientComponentClient<Database>()
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching transactions for export:', error)
    throw new Error('Failed to fetch transactions')
  }

  return transactions || []
}

/**
 * Fetch all user CSV uploads
 */
export async function fetchUserCSVUploads(): Promise<CSVUploadData[]> {
  const supabase = createClientComponentClient<Database>()
  
  const { data: uploads, error } = await supabase
    .from('csv_uploads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching CSV uploads for export:', error)
    throw new Error('Failed to fetch CSV uploads')
  }

  return uploads || []
}

/**
 * Fetch user account information
 */
export async function fetchUserAccount(): Promise<UserAccountData> {
  const supabase = createClientComponentClient<Database>()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Failed to fetch user account information')
  }

  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at
  }
}

/**
 * Export all user data to multiple CSV files in a ZIP-like structure
 * Since we can't create actual ZIP files in browser easily, we'll export multiple CSVs
 */
export async function exportAllUserData(): Promise<void> {
  try {
    // Fetch all data in parallel
    const [transactions, csvUploads, userAccount] = await Promise.all([
      fetchUserTransactions(),
      fetchUserCSVUploads(),
      fetchUserAccount()
    ])

    // Export transactions
    if (transactions.length > 0) {
      const transactionData = transactions.map(formatTransactionForFullExport)
      await exportToCSV(transactionData, {
        filename: 'bitbasis_transactions',
        addTimestamp: true
      })
    }

    // Export CSV upload history
    if (csvUploads.length > 0) {
      const uploadData = csvUploads.map(formatCSVUploadForExport)
      await exportToCSV(uploadData, {
        filename: 'bitbasis_csv_uploads',
        addTimestamp: true
      })
    }

    // Export account information
    const accountData = [formatUserAccountForExport(userAccount)]
    await exportToCSV(accountData, {
      filename: 'bitbasis_account_info',
      addTimestamp: true
    })

    // Note: Multiple downloads will trigger, which is the best we can do without ZIP support
    
  } catch (error) {
    console.error('Failed to export user data:', error)
    throw error
  }
}

/**
 * Export all user data as a single comprehensive CSV
 * Simplified approach that exports transactions as the main data with metadata
 */
export async function exportAllUserDataSingle(): Promise<void> {
  try {
    // Fetch all data
    const [transactions, csvUploads, userAccount] = await Promise.all([
      fetchUserTransactions(),
      fetchUserCSVUploads(),
      fetchUserAccount()
    ])

    // If user has transactions, export them as the main data
    if (transactions.length > 0) {
      const transactionData = transactions.map(formatTransactionForFullExport)
      await exportToCSV(transactionData, {
        filename: 'bitbasis_complete_export',
        addTimestamp: true
      })
    } else {
      // If no transactions, export a summary with account info and upload history
      const summaryData = [
        {
          "Data Type": "Account Information",
          "Email": userAccount.email || '',
          "Account Created": userAccount.created_at ? formatDate(userAccount.created_at) : '',
          "Last Sign In": userAccount.last_sign_in_at ? formatDate(userAccount.last_sign_in_at) : '',
          "Transaction Count": 0,
          "CSV Uploads Count": csvUploads.length,
          "Export Date": formatDate(new Date().toISOString())
        },
        ...csvUploads.map((upload, index) => ({
          "Data Type": `CSV Upload ${index + 1}`,
          "Upload Date": formatDate(upload.created_at),
          "Filename": upload.filename,
          "Status": upload.status,
          "Total Rows": upload.total_row_count || 0,
          "Imported Rows": upload.imported_row_count || 0,
          "Error Message": upload.error_message || ''
        }))
      ]
      
      await exportToCSV(summaryData, {
        filename: 'bitbasis_complete_export',
        addTimestamp: true
      })
    }
    
  } catch (error) {
    console.error('Failed to export user data:', error)
    throw error
  }
}
