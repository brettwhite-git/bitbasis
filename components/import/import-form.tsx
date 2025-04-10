"use client"

import React, { useState } from "react"
import type { ChangeEvent, DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Papa from 'papaparse'
import { ImportPreview } from "@/components/import/import-preview"
import { insertTransactions } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileIcon, Trash2Icon } from "lucide-react"
import { CheckCircle2Icon } from "lucide-react"
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/providers/supabase-auth-provider"
import { useRouter } from 'next/navigation'

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type TransferInsert = Database['public']['Tables']['transfers']['Insert']

// Base interface for parsed transactions during import
interface ParsedTransactionBase {
  date: string
  asset: string
  price: number
  user_id: string
}

interface ParsedOrder extends ParsedTransactionBase {
  type: 'buy' | 'sell'
  exchange: string | null
  buy_fiat_amount: number | null
  buy_currency: string | null
  buy_btc_amount: number | null
  received_btc_amount: number | null
  received_currency: string | null
  sell_btc_amount: number | null
  sell_btc_currency: string | null
  received_fiat_amount: number | null
  received_fiat_currency: string | null
  service_fee: number | null
  service_fee_currency: string | null
}

interface ParsedTransfer extends ParsedTransactionBase {
  type: 'withdrawal' | 'deposit'
  amount_btc: number
  fee_amount_btc: number | null
  amount_fiat: number | null
  hash: string | null
}

type ParsedTransaction = ParsedOrder | ParsedTransfer

interface ValidationIssue {
  row: number;
  field: string;
  issue: string;
  suggestion: string;
  severity: 'error' | 'warning';
}

interface CSVRow {
  date: string
  type: string
  asset: string
  price?: string
  exchange?: string
  // Order specific fields
  buy_fiat_amount?: string
  received_btc_amount?: string
  sell_btc_amount?: string
  received_fiat_amount?: string
  service_fee?: string
  // Transfer specific fields
  amount_btc?: string
  fee_amount_btc?: string
  amount_fiat?: string
  hash?: string
  // Alternative field names for flexibility
  fiat_amount?: string
  btc_amount?: string
}

interface ImportStatus {
  totalRows: number
  parsedRows: number
  importedRows: number
  failedRows: number
  failedRowDetails: Array<{
    rowNumber: number
    error: string
  }>
}

interface UploadedCSV {
  id: string
  filename: string
  uploadDate: string
  size: number
  status: 'success' | 'error'
}

interface ImportPreviewProps {
  transactions: (ParsedOrder | ParsedTransfer)[]
  validationIssues: ValidationIssue[]
  originalRows: any[]
  closeAction: () => void
}

interface StatusMessage {
  text: string | JSX.Element
  color: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const parseDate = (dateStr: string): string => {
  try {
    // Parse MM/DD/YY HH:mm format
    const parts = dateStr.split(' ')
    if (parts.length !== 2) {
      throw new Error(`Invalid date format: ${dateStr}`)
    }

    const [datePart, timePart] = parts
    if (!datePart || !timePart) {
      throw new Error(`Invalid date format: ${dateStr}`)
    }

    const dateParts = datePart.split('/')
    const timeParts = timePart.split(':')
    
    if (dateParts.length !== 3 || timeParts.length !== 2) {
      throw new Error(`Invalid date format: ${dateStr}`)
    }

    const [month, day, yearShort] = dateParts
    const [hours, minutes] = timeParts

    if (!month || !day || !yearShort || !hours || !minutes) {
      throw new Error(`Invalid date format: ${dateStr}`)
    }

    // Convert 2-digit year to 4-digit year
    const year = yearShort.length === 2 ? `20${yearShort}` : yearShort

    // Create date string in ISO format but preserve local time
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
    
    // Validate the date is not in the future
    const parsedDate = new Date(isoDate)
    const now = new Date()
    if (parsedDate.getTime() > now.getTime()) {
      throw new Error('Future date not allowed')
    }

    return isoDate
  } catch (err) {
    throw new Error(`Invalid date format: ${dateStr}. Expected MM/DD/YY HH:mm`)
  }
}

const normalizeTransactionType = (type: string): string => {
  // Convert to lowercase and remove extra spaces
  const normalized = type.toLowerCase().trim()

  // Common misspellings and variations
  const withdrawalVariants = ['withdrawl', 'withdraw', 'withdrawal', 'withdrawel', 'withdrawls']
  const depositVariants = ['deposit', 'deposits', 'dep']
  
  if (withdrawalVariants.includes(normalized)) {
    return 'withdrawal'
  }
  if (depositVariants.includes(normalized)) {
    return 'deposit'
  }
  
  return normalized
}

const transformCSVToTransaction = (row: CSVRow, currentUserId: string): ParsedTransaction => {
  try {
    // 1. Normalize and validate type
    if (!row.type) {
      throw new Error('Missing transaction type')
    }

    const type = normalizeTransactionType(row.type.toString())
    if (!type) {
      throw new Error(`Invalid transaction type: ${row.type}`)
    }

    // 2. Parse and validate date
    if (!row.date) {
      throw new Error('Missing transaction date')
    }
    const date = parseDate(row.date)

    // 3. Parse amounts with sign handling
    const parseAmount = (value: string | undefined, allowNegative: boolean = false): number | null => {
      if (!value || value.trim() === '') return null
      const cleanValue = value.toString().replace(/[$,]/g, '').trim()
      const numValue = Number(cleanValue)
      if (isNaN(numValue)) return null
      // If negative values aren't allowed, take absolute value
      return allowNegative ? numValue : Math.abs(numValue)
    }

    // 4. Handle transfer transactions
    if (type === 'withdrawal' || type === 'deposit') {
      // Parse all amounts, allowing negative values
      const rawAmount = parseAmount(row.amount_btc || row.btc_amount, true)
      const rawFeeAmount = parseAmount(row.fee_amount_btc, true)
      const rawFiatAmount = parseAmount(row.amount_fiat || row.fiat_amount, true)

      if (rawAmount === null) {
        throw new Error('Transfer transaction requires valid BTC amount')
      }

      // For withdrawals: convert negative to positive, warn if positive
      // For deposits: convert negative to positive, warn if negative
      let amount_btc: number
      if (type === 'withdrawal') {
        amount_btc = Math.abs(rawAmount)
        if (rawAmount > 0) {
          console.warn(`Withdrawal amount was positive (${rawAmount}), converting to positive value for storage`)
        }
      } else { // deposit
        amount_btc = Math.abs(rawAmount)
        if (rawAmount < 0) {
          console.warn(`Deposit amount was negative (${rawAmount}), converting to positive value for storage`)
        }
      }

      // Always store fees as positive values, warn if negative
      let fee_amount_btc: number | null = null
      if (rawFeeAmount !== null) {
        fee_amount_btc = Math.abs(rawFeeAmount)
        if (rawFeeAmount < 0) {
          console.warn(`Network fee was negative (${rawFeeAmount}), converting to positive value for storage`)
        }
      }

      // Handle fiat amount similarly to BTC amount
      let amount_fiat: number | null = null
      if (rawFiatAmount !== null) {
        amount_fiat = Math.abs(rawFiatAmount)
        if ((type === 'withdrawal' && rawFiatAmount > 0) || 
            (type === 'deposit' && rawFiatAmount < 0)) {
          console.warn(`Fiat amount sign was opposite of expected for ${type} (${rawFiatAmount}), converting to proper sign for storage`)
        }
      }

      const price = parseAmount(row.price)

      const transfer: ParsedTransfer = {
        type: type as 'withdrawal' | 'deposit',
        date,
        asset: 'BTC',
        amount_btc: amount_btc,
        amount_fiat: amount_fiat,
        fee_amount_btc: fee_amount_btc,
        price: price || 0,
        hash: row.hash?.trim() || null,
        user_id: currentUserId
      }

      return transfer
    }

    // 5. Handle buy/sell transactions
    const buy_fiat_amount = parseAmount(row.buy_fiat_amount || row.fiat_amount)
    const received_btc_amount = parseAmount(row.received_btc_amount || row.btc_amount)
    const sell_btc_amount = parseAmount(row.sell_btc_amount || row.btc_amount)
    const received_fiat_amount = parseAmount(row.received_fiat_amount || row.fiat_amount)
    const service_fee = parseAmount(row.service_fee)
    const price = parseAmount(row.price)

    const order: ParsedOrder = {
      type: type as 'buy' | 'sell',
      date,
      asset: 'BTC',
      exchange: row.exchange || null,
      price: price || 0,
      user_id: currentUserId,
      buy_fiat_amount: type === 'buy' ? buy_fiat_amount : null,
      buy_currency: type === 'buy' ? 'USD' : null,
      buy_btc_amount: type === 'buy' ? received_btc_amount : null,
      received_btc_amount: type === 'buy' ? received_btc_amount : null,
      received_currency: type === 'buy' ? 'BTC' : null,
      sell_btc_amount: type === 'sell' ? sell_btc_amount : null,
      sell_btc_currency: type === 'sell' ? 'BTC' : null,
      received_fiat_amount: type === 'sell' ? received_fiat_amount : null,
      received_fiat_currency: type === 'sell' ? 'USD' : null,
      service_fee: type === 'buy' ? service_fee : null,
      service_fee_currency: type === 'buy' ? 'USD' : null
    }

    if (type === 'buy') {
      if (!buy_fiat_amount || !received_btc_amount) {
        throw new Error('Buy transaction requires buy_fiat_amount and received_btc_amount')
      }
      order.price = price || (buy_fiat_amount / received_btc_amount)
    } else { // sell
      if (!sell_btc_amount || !received_fiat_amount) {
        throw new Error('Sell transaction requires sell_btc_amount and received_fiat_amount')
      }
      order.price = price || (received_fiat_amount / sell_btc_amount)
    }

    return order
  } catch (err) {
    console.error('Error transforming CSV row:', {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      row
    })
    throw err
  }
}

const LoadingDots = () => {
  return (
    <span className="inline-flex">
      <span className="animate-dot1 text-lg leading-none">.</span>
      <span className="animate-dot2 text-lg leading-none">.</span>
      <span className="animate-dot3 text-lg leading-none">.</span>
    </span>
  )
}

function useUserId() {
  const { user } = useAuth();
  if (!user?.id) {
    throw new Error('User ID not found in session');
  }
  return user.id;
}

export function ImportForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parsedData, setParsedData] = useState<ParsedTransaction[] | null>(null)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [originalRows, setOriginalRows] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    totalRows: 0,
    parsedRows: 0,
    importedRows: 0,
    failedRows: 0,
    failedRowDetails: []
  })

  const userId = useUserId();

  const validateTransaction = (row: any, index: number): ValidationIssue[] => {
    const issues: ValidationIssue[] = []

    // Helper to validate numeric amount
    const isValidAmount = (value: any, allowZero: boolean = false): boolean => {
      if (!value) return false
      const cleanValue = value.toString().replace(/[$,]/g, '').trim()
      const num = Number(cleanValue)
      return !isNaN(num) && (allowZero ? true : num !== 0)
    }

    // Validate date format and future dates
    if (!row.date) {
      issues.push({
        row: index + 1,
        field: 'date',
        issue: 'Missing date',
        suggestion: 'Add a valid date in MM/DD/YY HH:mm format',
        severity: 'error'
      })
    } else {
      try {
        const parsedDate = new Date(parseDate(row.date))
        const now = new Date()
        if (parsedDate.getTime() > now.getTime()) {
          issues.push({
            row: index + 1,
            field: 'date',
            issue: 'Future date detected',
            suggestion: 'Use a past date',
            severity: 'error'
          })
        }
      } catch (err) {
        issues.push({
          row: index + 1,
          field: 'date',
          issue: 'Invalid date format',
          suggestion: 'Use MM/DD/YY HH:mm format',
          severity: 'error'
        })
      }
    }

    // Required fields for all transactions
    if (!row.type) {
      issues.push({
        row: index + 1,
        field: 'type',
        issue: 'Missing transaction type',
        suggestion: 'Add a valid transaction type',
        severity: 'error'
      })
      return issues
    }

    // Normalize and validate type
    const originalType = row.type.toString()
    const normalizedType = normalizeTransactionType(originalType)
    const validTypes = ['buy', 'sell', 'withdrawal', 'deposit']
    
    if (!validTypes.includes(normalizedType)) {
      issues.push({
        row: index + 1,
        field: 'type',
        issue: `Invalid transaction type: "${originalType}"`,
        suggestion: `Use one of the valid types: ${validTypes.join(', ')}`,
        severity: 'error'
      })
      return issues
    }

    // Type-specific validations for transfers
    if (normalizedType === 'withdrawal' || normalizedType === 'deposit') {
      const btcAmount = parseFloat(row.amount_btc || row.btc_amount || '')
      
      // Validate BTC amount
      if (!row.amount_btc && !row.btc_amount) {
        issues.push({
          row: index + 1,
          field: 'amount_btc',
          issue: 'Missing BTC amount',
          suggestion: `Add the ${normalizedType} amount`,
          severity: 'error'
        })
      } else if (isNaN(btcAmount)) {
        issues.push({
          row: index + 1,
          field: 'amount_btc',
          issue: 'Invalid BTC amount format',
          suggestion: 'Amount should be a valid number',
          severity: 'error'
        })
      } else if (btcAmount === 0) {
        issues.push({
          row: index + 1,
          field: 'amount_btc',
          issue: 'BTC amount cannot be zero',
          suggestion: `Enter a non-zero amount for the ${normalizedType}`,
          severity: 'error'
        })
      }

      // Note: We're removing the fee validation since we handle negative values internally
    } else {
      // Buy/sell validations
      if (normalizedType === 'buy') {
        const hasBuyAmount = isValidAmount(row.buy_fiat_amount || row.fiat_amount)
        const hasReceivedBtc = isValidAmount(row.received_btc_amount || row.btc_amount)

        if (!hasBuyAmount) {
          issues.push({
            row: index + 1,
            field: 'buy_fiat_amount',
            issue: 'Missing or invalid fiat amount',
            suggestion: 'Add the USD amount spent',
            severity: 'error'
          })
        }
        if (!hasReceivedBtc) {
          issues.push({
            row: index + 1,
            field: 'received_btc_amount',
            issue: 'Missing or invalid BTC amount received',
            suggestion: 'Add the BTC amount received',
            severity: 'error'
          })
        }
      } else { // sell
        const hasSellBtc = isValidAmount(row.sell_btc_amount || row.btc_amount)
        const hasReceivedFiat = isValidAmount(row.received_fiat_amount || row.fiat_amount)

        if (!hasSellBtc) {
          issues.push({
            row: index + 1,
            field: 'sell_btc_amount',
            issue: 'Missing or invalid BTC amount to sell',
            suggestion: 'Add the BTC amount sold',
            severity: 'error'
          })
        }
        if (!hasReceivedFiat) {
          issues.push({
            row: index + 1,
            field: 'received_fiat_amount',
            issue: 'Missing or invalid USD amount received',
            suggestion: 'Add the USD amount received',
            severity: 'error'
          })
        }
      }
    }

    return issues
  }

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as any[]
        if (!data || data.length === 0) {
          setError('CSV file is empty or invalid')
          return
        }

        // Filter out empty rows and rows with no data
        const validRows = data.filter(row => {
          // Check if row has any non-empty values
          return row && 
                 Object.values(row).some(value => 
                   value !== null && 
                   value !== undefined && 
                   value.toString().trim() !== ''
                 )
        })

        if (validRows.length === 0) {
          setError('No valid data rows found in CSV')
          return
        }

        // Normalize headers to ensure consistent casing
        const normalizedData = validRows.map(row => {
          const normalizedRow: any = {}
          Object.entries(row).forEach(([key, value]) => {
            // Convert header to lowercase for consistent matching
            const normalizedKey = key.toLowerCase().trim()
            // Handle special case for 'type' field
            if (normalizedKey === 'type' && value) {
              normalizedRow[normalizedKey] = String(value).trim().toLowerCase()
            } else {
              normalizedRow[normalizedKey] = value
            }
          })
          return normalizedRow
        })

        setImportStatus(prev => ({
          ...prev,
          totalRows: normalizedData.length,
          parsedRows: 0,
          failedRows: 0,
          failedRowDetails: []
        }))

        setOriginalRows(normalizedData)
        const issues: ValidationIssue[] = []
        const transactions: ParsedTransaction[] = []
        let successfullyParsed = 0
        let failed = 0
        const failedDetails: Array<{ rowNumber: number, error: string }> = []

        // Process each valid row
        normalizedData.forEach((row, index) => {
          try {
            const rowIssues = validateTransaction(row, index)
            const errorIssues = rowIssues.filter(issue => issue.severity === 'error')
            const warningIssues = rowIssues.filter(issue => issue.severity === 'warning')
            
            if (errorIssues.length > 0) {
              failed++
              failedDetails.push({
                rowNumber: index + 1,
                error: errorIssues.map(i => i.issue).join(', ')
              })
              issues.push(...errorIssues)
            } else {
              const transformed = transformCSVToTransaction(row, userId)
              transactions.push(transformed)
              successfullyParsed++
              // Still keep track of warnings
              if (warningIssues.length > 0) {
                issues.push(...warningIssues)
              }
            }
          } catch (err) {
            failed++
            failedDetails.push({
              rowNumber: index + 1,
              error: err instanceof Error ? err.message : 'Unknown error'
            })
          }
        })

        setImportStatus(prev => ({
          ...prev,
          parsedRows: successfullyParsed,
          failedRows: failed,
          failedRowDetails: failedDetails
        }))

        // Update the validation issues state with both errors and warnings
        const typedIssues: ValidationIssue[] = issues.map(issue => ({
          row: issue.row,
          field: issue.field,
          issue: issue.issue,
          suggestion: issue.suggestion,
          severity: issue.severity
        }));
        setValidationIssues(typedIssues);

        setParsedData(transactions)
        setError(null)
      },
      header: true,
      skipEmptyLines: 'greedy', // Skip empty lines and lines with only whitespace
      // Disable dynamic typing to prevent automatic conversions
      dynamicTyping: false,
      transform: (value) => {
        if (!value) return value
        return value.toString().trim()
      }
    })
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null) // Clear any previous errors

    const files = e.dataTransfer.files
    if (!files || files.length === 0) {
      setError('No file dropped')
      return
    }

    // Only process the first file if multiple files are dropped
    if (files.length > 1) {
      setError('Please drop only one file')
      return
    }

    const droppedFile = files[0]
    if (!droppedFile) {
      setError('Invalid file')
      return
    }

    const validationError = validateFile(droppedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setFile(droppedFile)
    parseCSV(droppedFile)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null) // Clear any previous errors
    const files = e.target.files

    if (!files || files.length === 0) {
      setError('No file selected')
      return
    }

    const selectedFile = files[0]
    if (!selectedFile) {
      setError('Invalid file')
      return
    }

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      // Reset the input
      e.target.value = ''
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const handleUpload = async () => {
    if (!file || !parsedData) return

    setIsLoading(true)
    setError(null)
    setUploadProgress(10)

    try {
      setUploadProgress(30)

      // Split transactions into orders and transfers
      const { orders, transfers } = await previewTransactions(parsedData)

      // Insert transactions
      const result = await insertTransactions({ orders, transfers })
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to upload transactions')
      }

      const successfulImports = (result.data?.orders?.length || 0) + (result.data?.transfers?.length || 0)
      const failedImports = parsedData.length - successfulImports

      // Update import status with final counts
      setImportStatus(prev => ({
        ...prev,
        importedRows: successfulImports,
        failedRows: failedImports,
        failedRowDetails: failedImports > 0 ? [{
          rowNumber: -1, // We don't know which specific rows failed
          error: 'Failed to import some rows. Please try again or contact support if the issue persists.'
        }] : []
      }))

      setUploadProgress(100)

      // Reset form only if all rows were imported successfully
      if (successfulImports === parsedData.length) {
        setTimeout(() => {
          setFile(null)
          setParsedData(null)
          setValidationIssues([])
          setUploadProgress(0)
        }, 2000) // Give user time to see success message
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload transactions')
      setImportStatus(prev => ({
        ...prev,
        failedRows: parsedData.length,
        failedRowDetails: [{
          rowNumber: -1,
          error: err instanceof Error ? err.message : 'Failed to upload transactions'
        }]
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const validateFile = (file: File): string | null => {
    // Check if a file was provided
    if (!file) {
      return 'No file selected'
    }

    // Check file size (10MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    }

    // Check file type
    const validTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      return 'Please upload a valid CSV file'
    }

    return null
  }

  const handleClose = () => {
    setFile(null)
    setParsedData(null)
    setValidationIssues([])
    setUploadProgress(0)
    setError(null)
    // Reset the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
    router.refresh()
  }

  // Add ImportStatus component to render
  const ImportStatusSummary = () => {
    if (!importStatus.totalRows || !importStatus.failedRowDetails.length) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-red-500">Import Errors</CardTitle>
          <CardDescription>
            Please fix the following errors before continuing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {importStatus.failedRowDetails.map((detail, index) => (
              <Alert key={index} variant="destructive">
                <AlertTitle>Row {detail.rowNumber}</AlertTitle>
                <AlertDescription>{detail.error}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ManageCSVs = () => {
    // Placeholder data - this would come from your database in production
    const [uploadedFiles, setUploadedFiles] = useState<UploadedCSV[]>([
      {
        id: '1',
        filename: 'transactions_2024.csv',
        uploadDate: '2024-03-28',
        size: 1024 * 15, // 15KB
        status: 'success'
      },
      {
        id: '2',
        filename: 'coinbase_exports.csv',
        uploadDate: '2024-03-27',
        size: 1024 * 8, // 8KB
        status: 'success'
      }
    ])

    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

    const toggleFileSelection = (id: string) => {
      const newSelection = new Set(selectedFiles)
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
      setSelectedFiles(newSelection)
    }

    const deleteFile = (id: string) => {
      setUploadedFiles(files => files.filter(f => f.id !== id))
      setSelectedFiles(selected => {
        const newSelection = new Set(selected)
        newSelection.delete(id)
        return newSelection
      })
    }

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`
      const kb = bytes / 1024
      if (kb < 1024) return `${kb.toFixed(2)} KB`
      const mb = kb / 1024
      return `${mb.toFixed(2)} MB`
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage CSV Files</CardTitle>
          <CardDescription>View and manage your uploaded CSV files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center p-4 bg-card border rounded-lg shadow-sm">
                <div className="flex items-center flex-1 min-w-0">
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={() => toggleFileSelection(file.id)}
                    className="mr-4"
                  />
                  <FileIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.filename}
                      </p>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-4">
                          {formatFileSize(file.size)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFile(file.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center">
                      <CheckCircle2Icon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Uploaded successfully on {new Date(file.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ManualEntryForm = () => {
    const [formData, setFormData] = useState({
      date: '',
      type: 'buy',
      btcAmount: '',
      price: '',
      usdAmount: '',
      fees: '',
      exchange: '',
      network_fee: '',
      wallet_address: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      // TODO: Implement form submission
      console.log('Form submitted:', formData)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    const isNetworkFeeEnabled = formData.type === 'send'

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div>
            <CardTitle>Manual Transaction Entry</CardTitle>
            <CardDescription>Add a new transaction manually</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              Clear
            </Button>
            <Button className="bg-bitcoin-orange hover:bg-bitcoin-orange/90">
              Add Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="send">Send</option>
                  <option value="receive">Receive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange/Source</Label>
                <Input
                  id="exchange"
                  name="exchange"
                  type="text"
                  placeholder="Enter exchange or source"
                  value={formData.exchange}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="btcAmount">Amount (BTC)</Label>
                <Input
                  id="btcAmount"
                  name="btcAmount"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={formData.btcAmount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per BTC (USD)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usdAmount">Total Amount (USD)</Label>
                <Input
                  id="usdAmount"
                  name="usdAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.usdAmount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fees">Service Fee (USD)</Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.fees}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet_address">Wallet Address</Label>
                <Input
                  id="wallet_address"
                  name="wallet_address"
                  type="text"
                  placeholder="Enter wallet address"
                  value={formData.wallet_address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label 
                  htmlFor="network_fee" 
                  className={!isNetworkFeeEnabled ? "text-muted-foreground" : ""}
                >
                  Network Fee (BTC)
                </Label>
                <Input
                  id="network_fee"
                  name="network_fee"
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={formData.network_fee}
                  onChange={handleInputChange}
                  className={!isNetworkFeeEnabled ? "opacity-50" : ""}
                  disabled={!isNetworkFeeEnabled}
                />
              </div>
            </div>
          </form>

          {/* Preview Table */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Transaction Preview</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount (BTC)</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>Total (USD)</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Exchange</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.date && (
                  <TableRow>
                    <TableCell>{new Date(formData.date).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={formData.type === "buy" ? "default" : "destructive"}
                        className={`w-[100px] flex items-center justify-center ${
                          formData.type === "buy" 
                            ? "bg-bitcoin-orange" 
                            : "bg-red-500"
                        }`}
                      >
                        {formData.type === "buy" ? (
                          <ArrowDownRight className="mr-2 h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                        )}
                        {formData.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{formData.btcAmount || '0.00000000'} BTC</TableCell>
                    <TableCell>${formData.price || '0.00'}</TableCell>
                    <TableCell>${formData.usdAmount || '0.00'}</TableCell>
                    <TableCell>${formData.fees || '0.00'}</TableCell>
                    <TableCell>{formData.exchange || '-'}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  const previewTransactions = async (parsedTransactions: ParsedTransaction[]): Promise<{ orders: OrderInsert[], transfers: TransferInsert[] }> => {
    const orders: OrderInsert[] = [];
    const transfers: TransferInsert[] = [];

    parsedTransactions.forEach((transaction) => {
      if ('buy_fiat_amount' in transaction || 'sell_btc_amount' in transaction) {
        orders.push(transaction as OrderInsert);
      } else {
        transfers.push(transaction as TransferInsert);
      }
    });

    return { orders, transfers };
  };

  return (
    <Tabs defaultValue="csv" className="w-full">
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        <TabsTrigger value="manage">Manage CSVs</TabsTrigger>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
      </TabsList>
      
      <TabsContent value="csv">
        {!parsedData && (
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 min-h-[400px] text-center ${
              isDragging ? "border-bitcoin-orange bg-bitcoin-orange/10" : "border-border"
            } cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!file && !isLoading && !parsedData) {
                document.getElementById('file-upload')?.click()
              }
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-bitcoin-orange" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              Drag and drop your CSV file
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              or click here to browse
            </p>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {parsedData && validationIssues.length === 0 && (
          <>
            <ImportStatusSummary />
            <ImportPreview 
              transactions={parsedData} 
              validationIssues={validationIssues}
              originalRows={originalRows}
            />
          </>
        )}

        {validationIssues.length > 0 && (
          <div className="mt-4">
            <h4 className="text-lg font-semibold">Validation Issues</h4>
            {validationIssues.map((issue, index) => (
              <Alert
                key={index}
                variant={issue.severity === 'error' ? 'destructive' : 'default'}
                className="mt-2"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Row {issue.row}: {issue.field}</AlertTitle>
                <AlertDescription>
                  {issue.issue}
                  {issue.suggestion && (
                    <p className="mt-1 text-sm">Suggestion: {issue.suggestion}</p>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="manage">
        <ManageCSVs />
      </TabsContent>
      
      <TabsContent value="manual">
        <ManualEntryForm />
      </TabsContent>
    </Tabs>
  )
}