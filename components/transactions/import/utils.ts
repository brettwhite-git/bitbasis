import { parse, isValid } from 'date-fns'
import type { CSVRow, ColumnMapping, UnifiedTransaction, ValidationIssue } from './import-context'

// Transform CSV data using column mappings into unified transactions
export function transformCSVData(
  csvData: CSVRow[],
  columnMappings: ColumnMapping[]
): UnifiedTransaction[] {
  return csvData.map((row, index) => {
    const transaction: UnifiedTransaction = {
      id: `csv-${index}`,
      originalRowData: row,
      date: null,
      type: 'unknown',
      asset: 'BTC',
      sent_amount: null,
      sent_currency: null,
      received_amount: null,
      received_currency: null,
      fee_amount: null,
      fee_currency: null,
      from_address: null,
      from_address_name: null,
      to_address: null,
      to_address_name: null,
      transaction_hash: null,
      price: null,
      comment: null
    }

    // Apply column mappings
    columnMappings.forEach(mapping => {
      if (!mapping.transactionField || mapping.transactionField === 'ignore') return
      
      const csvValue = row[mapping.csvColumn]
      if (!csvValue || csvValue.trim() === '') return

      const value = csvValue.trim()

      switch (mapping.transactionField) {
        case 'date':
          transaction.date = parseDate(value)
          break
        case 'type':
          transaction.type = normalizeTransactionType(value)
          break
        case 'sent_amount':
          transaction.sent_amount = parseNumber(value)
          break
        case 'sent_currency':
          transaction.sent_currency = value.toUpperCase()
          break
        case 'received_amount':
          transaction.received_amount = parseNumber(value)
          break
        case 'received_currency':
          transaction.received_currency = value.toUpperCase()
          break
        case 'fee_amount':
          transaction.fee_amount = parseNumber(value)
          break
        case 'fee_currency':
          transaction.fee_currency = value.toUpperCase()
          break
        case 'from_address':
          transaction.from_address = value
          break
        case 'from_address_name':
          transaction.from_address_name = value
          break
        case 'to_address':
          transaction.to_address = value
          break
        case 'to_address_name':
          transaction.to_address_name = value
          break
        case 'transaction_hash':
          transaction.transaction_hash = value
          break
        case 'price':
          transaction.price = parseNumber(value)
          break
        case 'comment':
          transaction.comment = value
          break
      }
    })

    // Post-process to handle negative values appropriately
    const normalizedTransaction = normalizeAmountsForTransactionType(transaction)

    return normalizedTransaction
  })
}

// Normalize amounts based on transaction type and common CSV export patterns
function normalizeAmountsForTransactionType(transaction: UnifiedTransaction): UnifiedTransaction {
  // Handle withdrawal transactions with negative sent_amount (common in CSV exports)
  if (transaction.type === 'withdrawal') {
    // If sent_amount is negative, make it positive (withdrawals should have positive sent amounts)
    if (transaction.sent_amount && transaction.sent_amount < 0) {
      transaction.sent_amount = Math.abs(transaction.sent_amount)
    }
  }

  // Handle deposit transactions with negative received_amount (less common but possible)
  if (transaction.type === 'deposit') {
    // If received_amount is negative, make it positive (deposits should have positive received amounts)
    if (transaction.received_amount && transaction.received_amount < 0) {
      transaction.received_amount = Math.abs(transaction.received_amount)
    }
  }

  // Always make fee amounts positive (fees are always costs, never negative)
  if (transaction.fee_amount && transaction.fee_amount < 0) {
    transaction.fee_amount = Math.abs(transaction.fee_amount)
  }

  // Handle cases where exchanges export withdrawals as negative received_amount instead of positive sent_amount
  if (transaction.type === 'withdrawal' && !transaction.sent_amount && transaction.received_amount && transaction.received_amount < 0) {
    transaction.sent_amount = Math.abs(transaction.received_amount)
    transaction.received_amount = null
  }

  // Handle cases where exchanges export deposits as negative sent_amount instead of positive received_amount  
  if (transaction.type === 'deposit' && !transaction.received_amount && transaction.sent_amount && transaction.sent_amount < 0) {
    transaction.received_amount = Math.abs(transaction.sent_amount)
    transaction.sent_amount = null
  }

  return transaction
}

// Parse date from various formats
function parseDate(dateString: string): Date | null {
  if (!dateString) return null

  // Common date formats to try
  const formats = [
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd\'T\'HH:mm:ss',
    'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
    'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
    'yyyy-MM-dd',
    'MM/dd/yyyy HH:mm:ss',
    'MM/dd/yyyy',
    'dd/MM/yyyy HH:mm:ss',
    'dd/MM/yyyy',
    'MM-dd-yyyy HH:mm:ss',
    'MM-dd-yyyy',
    'dd-MM-yyyy HH:mm:ss',
    'dd-MM-yyyy'
  ]

  // Try to parse as ISO date first
  const isoDate = new Date(dateString)
  if (isValid(isoDate)) {
    return isoDate
  }

  // Try different formats
  for (const format of formats) {
    try {
      const parsed = parse(dateString, format, new Date())
      if (isValid(parsed)) {
        return parsed
      }
    } catch {
      // Continue to next format
    }
  }

  return null
}

// Parse number from string (handles currency symbols, commas, etc.)
function parseNumber(numberString: string): number | null {
  if (!numberString) return null

  // Remove common currency symbols and whitespace
  const cleaned = numberString
    .replace(/[$£€¥₿,\s]/g, '')
    .replace(/[()]/g, '-') // Handle negative numbers in parentheses
    .trim()

  if (cleaned === '') return null

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

// Normalize transaction type from various formats
function normalizeTransactionType(typeString: string): UnifiedTransaction['type'] {
  if (!typeString) return 'unknown'

  const type = typeString.toLowerCase().trim()

  // Buy patterns
  if (type.includes('buy') || type.includes('purchase') || type.includes('market buy')) {
    return 'buy'
  }

  // Sell patterns
  if (type.includes('sell') || type.includes('market sell')) {
    return 'sell'
  }

  // Deposit patterns
  if (type.includes('deposit') || type.includes('receive') || type.includes('credit') || 
      type.includes('incoming') || type.includes('transfer in')) {
    return 'deposit'
  }

  // Withdrawal patterns
  if (type.includes('withdraw') || type.includes('send') || type.includes('debit') || 
      type.includes('outgoing') || type.includes('transfer out')) {
    return 'withdrawal'
  }

  // Interest patterns
  if (type.includes('interest') || type.includes('earn') || type.includes('reward') || 
      type.includes('staking') || type.includes('dividend')) {
    return 'interest'
  }

  return 'unknown'
}

// Validate transformed transactions
export function validateTransactions(transactions: UnifiedTransaction[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  transactions.forEach(transaction => {
    // Validate required fields
    if (!transaction.date) {
      issues.push({
        transactionId: transaction.id,
        field: 'date',
        message: 'Date is required',
        severity: 'error'
      })
    }

    if (transaction.type === 'unknown') {
      issues.push({
        transactionId: transaction.id,
        field: 'type',
        message: 'Transaction type could not be determined',
        severity: 'error'
      })
    }

    // Validate price field (required by API)
    if (!transaction.price || transaction.price <= 0) {
      issues.push({
        transactionId: transaction.id,
        field: 'price',
        message: 'BTC price is required and must be greater than 0',
        severity: 'error'
      })
    }

    // Validate transaction-specific fields
    switch (transaction.type) {
      case 'buy':
        if (!transaction.received_amount || transaction.received_amount <= 0) {
          issues.push({
            transactionId: transaction.id,
            field: 'received_amount',
            message: 'Buy transactions must have a positive received amount',
            severity: 'error'
          })
        }
        if (!transaction.sent_amount || transaction.sent_amount <= 0) {
          issues.push({
            transactionId: transaction.id,
            field: 'sent_amount',
            message: 'Buy transactions must have a positive sent amount (fiat paid)',
            severity: 'error'
          })
        }
        break

      case 'sell':
        if (!transaction.sent_amount || transaction.sent_amount <= 0) {
          issues.push({
            transactionId: transaction.id,
            field: 'sent_amount',
            message: 'Sell transactions must have a positive sent amount (BTC sold)',
            severity: 'error'
          })
        }
        if (!transaction.received_amount || transaction.received_amount <= 0) {
          issues.push({
            transactionId: transaction.id,
            field: 'received_amount',
            message: 'Sell transactions must have a positive received amount (fiat received)',
            severity: 'error'
          })
        }
        break

      case 'deposit':
        if (!transaction.received_amount || transaction.received_amount <= 0) {
          issues.push({
            transactionId: transaction.id,
            field: 'received_amount',
            message: 'Deposit transactions must have a positive received amount',
            severity: 'error'
          })
        }
        break

      case 'withdrawal':
        if (!transaction.sent_amount || transaction.sent_amount <= 0) {
          issues.push({
            transactionId: transaction.id,
            field: 'sent_amount',
            message: 'Withdrawal transactions must have a positive sent amount',
            severity: 'error'
          })
        }
        break

      case 'interest':
        if (!transaction.received_amount || transaction.received_amount <= 0) {
          issues.push({
            transactionId: transaction.id,
            field: 'received_amount',
            message: 'Interest transactions must have a positive received amount',
            severity: 'error'
          })
        }
        break
    }

    // Validate dates are not in the future
    if (transaction.date && transaction.date > new Date()) {
      issues.push({
        transactionId: transaction.id,
        field: 'date',
        message: 'Transaction date cannot be in the future',
        severity: 'warning'
      })
    }

    // Validate negative amounts
    if (transaction.fee_amount && transaction.fee_amount < 0) {
      issues.push({
        transactionId: transaction.id,
        field: 'fee_amount',
        message: 'Fee amount cannot be negative',
        severity: 'error'
      })
    }

    // Validate reasonable amounts (optional warnings)
    if (transaction.sent_amount && transaction.sent_amount > 1000000) {
      issues.push({
        transactionId: transaction.id,
        field: 'sent_amount',
        message: 'Sent amount seems unusually large - please verify',
        severity: 'warning'
      })
    }

    if (transaction.received_amount && transaction.received_amount > 1000) {
      issues.push({
        transactionId: transaction.id,
        field: 'received_amount',
        message: 'Received BTC amount seems unusually large - please verify',
        severity: 'warning'
      })
    }
  })

  return issues
}

// Get summary statistics for validation display
export function getTransactionSummary(transactions: UnifiedTransaction[]) {
  const summary = {
    total: transactions.length,
    byType: {
      buy: 0,
      sell: 0,
      deposit: 0,
      withdrawal: 0,
      interest: 0,
      unknown: 0
    },
    dateRange: {
      earliest: null as Date | null,
      latest: null as Date | null
    }
  }

  transactions.forEach(transaction => {
    if (transaction.type in summary.byType) {
      summary.byType[transaction.type as keyof typeof summary.byType]++
    }

    if (transaction.date) {
      if (!summary.dateRange.earliest || transaction.date < summary.dateRange.earliest) {
        summary.dateRange.earliest = transaction.date
      }
      if (!summary.dateRange.latest || transaction.date > summary.dateRange.latest) {
        summary.dateRange.latest = transaction.date
      }
    }
  })

  return summary
} 