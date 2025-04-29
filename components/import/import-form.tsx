"use client"

import React, { useState, useEffect } from "react"
import type { ChangeEvent, DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, AlertCircle, Loader2, CheckCircle2, XCircle, Trash2, CheckCircle, X, FileText, Download, CircleArrowRight, CircleArrowLeft, CircleArrowDown, CircleArrowUp, ExternalLink, Bitcoin, ArrowLeftRight } from "lucide-react"
import Papa from 'papaparse'
import type { ParseError, ParseResult } from 'papaparse'
import { ImportPreview } from "@/components/import/import-preview"
import { insertTransactions } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { FileIcon } from "lucide-react"
import { CheckCircle2Icon } from "lucide-react"
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/providers/supabase-auth-provider"
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  getCSVUploads, 
  deleteCSVUpload,
  updateCSVUploadStatus
} from '@/lib/supabase'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
  csvUploadId: string | null
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

// Function to determine if transaction is short-term or long-term
function isShortTerm(date: string): boolean {
  const transactionDate = new Date(date);
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  // Return true if the transaction date is AFTER one year ago (less than 1 year hold)
  return transactionDate > oneYearAgo;
}

// Define a type for the form data for clarity
type ManualTransactionFormData = {
  date: string;
  type: 'buy' | 'sell' | 'withdrawal' | 'deposit';
  btcAmount: string;
  price: string;
  usdAmount: string;
  fees: string;
  exchange: string;
  network_fee: string;
  txid: string;
  // Add a temporary unique ID for list handling
  tempId?: number;
};

export function ImportForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
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

  const parseCSV = async (file: File) => {
    setIsLoading(true)
    setIsParsing(true)
    setError(null)
    setParsedData(null)
    setValidationIssues([])
    setOriginalRows([])
    setCsvUploadId(null)
    setFileContent(null)
    setFile(file)

    try {
      // Read file contents
      const fileContent = await file.text()
      setFileContent(fileContent)

      // Process CSV data using a promise to handle async
      await new Promise<void>((resolve, reject) => {
        // Define the configuration object separately
        const papaConfig = {
          complete: async (results: ParseResult<Record<string, string | null | undefined>>) => {
            try {
              const data = results.data as any[] // Cast might still be needed or refine type
              if (!data || data.length === 0) {
                setError('CSV file is empty or invalid')
                setIsLoading(false)
                resolve()
                return
              }

              // Filter out empty rows
              const validRows = data.filter(row => 
                row && Object.values(row).some(value => value !== null && value !== undefined && value.toString().trim() !== '')
              );

              if (validRows.length === 0) {
                setError('No valid data rows found in CSV')
                setIsLoading(false)
                resolve()
                return
              }

              // Normalize headers
              const normalizedData = validRows.map(row => {
                const normalizedRow: Record<string, any> = {};
                Object.entries(row).forEach(([key, value]) => {
                  const normalizedKey = key.toLowerCase().trim();
                  normalizedRow[normalizedKey] = value;
                });
                // Assert that the resulting object conforms to CSVRow
                return normalizedRow as CSVRow;
              });

              setImportStatus(prev => ({ ...prev, totalRows: normalizedData.length, parsedRows: 0, failedRows: 0, failedRowDetails: [] }));
              setOriginalRows(normalizedData);
              
              const issues: ValidationIssue[] = [];
              const transactions: ParsedTransaction[] = [];
              let successfullyParsed = 0;
              let failed = 0;
              const failedDetails: Array<{ rowNumber: number, error: string }> = [];

              // Process each valid row
              normalizedData.forEach((row, index) => {
                try {
                  const rowIssues = validateTransaction(row, index);
                  const errorIssues = rowIssues.filter(issue => issue.severity === 'error');
                  const warningIssues = rowIssues.filter(issue => issue.severity === 'warning');
                  
                  if (errorIssues.length > 0) {
                    failed++;
                    failedDetails.push({ rowNumber: index + 1, error: errorIssues.map(i => i.issue).join(', ') });
                    issues.push(...errorIssues);
                  } else {
                    const transformed = transformCSVToTransaction(row, userId);
                    transactions.push(transformed);
                    successfullyParsed++;
                    if (warningIssues.length > 0) {
                      issues.push(...warningIssues);
                    }
                  }
                } catch (err) {
                  failed++;
                  failedDetails.push({ rowNumber: index + 1, error: err instanceof Error ? err.message : 'Unknown error' });
                }
              });

              if (failedDetails.length > 0) {
                setError(failedDetails.map(detail => `Row ${detail.rowNumber}: ${detail.error}`).join('; \n')); // Improved error reporting
                setImportStatus(prev => ({ ...prev, parsedRows: successfullyParsed, failedRows: failed, failedRowDetails: failedDetails }));
                
                const typedIssues: ValidationIssue[] = issues.map(issue => ({ ...issue }));
                setValidationIssues(typedIssues);
                setIsLoading(false);
                resolve();
                return;
              }

              setParsedData(transactions);
              const typedIssues: ValidationIssue[] = issues.map(issue => ({ ...issue }));
              setValidationIssues(typedIssues);
              setIsLoading(false);
              resolve();

            } catch (error: any) {
              setError(error instanceof Error ? error.message : 'Error processing CSV');
              setIsLoading(false);
              reject(error);
            }
          },
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transform: (value: string) => {
            if (!value) return value;
            return value.toString().trim();
          },
          error: (error: ParseError) => {
            setError(`Error parsing CSV: ${error.message}`);
            setIsLoading(false);
            reject(error);
          }
        };

        // Pass the config object to Papa.parse
        Papa.parse(fileContent, papaConfig);
      });
    } catch (err: any) {
      console.error('Error parsing CSV:', err)
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
    } finally {
      setIsParsing(false)
      setIsLoading(false)
    }
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
    if (!file || !parsedData || !csvUploadId) return

    setIsLoading(true)
    setError(null)
    setUploadProgress(10)

    try {
      setUploadProgress(30)

      // Split transactions into orders and transfers, passing the csvUploadId
      const { orders, transfers } = await previewTransactions(parsedData, csvUploadId)

      // Insert transactions with CSV upload ID
      const result = await insertTransactions({ 
        orders, 
        transfers,
        csvUploadId 
      })
      
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
          setCsvUploadId(null)
          setFileContent(null)
        }, 2000) // Give user time to see success message
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload transactions')
      
      // Update CSV upload status to error
      if (csvUploadId) {
        await updateCSVUploadStatus(csvUploadId, 'error', {
          errorMessage: err instanceof Error ? err.message : 'Failed to upload transactions'
        })
      }
      
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
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
    const [selectedFiles, setSelectedFiles] = useState<string[]>([])
    const [isDeleting, setIsDeleting] = useState(false)
    // Add state for success dialog
    const [isDeleteSuccessDialogOpen, setIsDeleteSuccessDialogOpen] = useState(false)
    const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('')
    
    // Fetch uploaded files on component mount
    useEffect(() => {
      fetchUploadedFiles()
    }, [])
    
    // Function to fetch all uploaded files
    const fetchUploadedFiles = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error } = await getCSVUploads()
        
        if (error) throw error
        
        setUploadedFiles(data || [])
      } catch (err) {
        console.error('Failed to fetch uploaded files:', err)
        setError('Failed to load your uploaded CSV files. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    // Function to handle file deletion
    const handleDelete = async () => {
      if (selectedFiles.length === 0) return
      
      setIsDeleting(true)
      setError(null)
      
      try {
        const deletePromises = selectedFiles.map(fileId => 
          deleteCSVUpload(fileId)
        )
        
        const results = await Promise.all(deletePromises)
        const failures = results.filter(result => !result.success)
        const successes = results.length - failures.length
        
        if (failures.length > 0) {
          console.error('Some files failed to delete:', failures)
          setError(`Failed to delete ${failures.length} files. Please try again.`)
          setIsDeleteSuccessDialogOpen(false) // Ensure dialog doesn't show on partial failure
        } else if (successes > 0) { // Only show success if there were no failures and at least one success
          setDeleteSuccessMessage(`Successfully deleted ${successes} CSV file(s).`)
          setIsDeleteSuccessDialogOpen(true)
          setError(null) // Clear any previous error
        }
        
        // Refresh file list and clear selection
        await fetchUploadedFiles()
        setSelectedFiles([])
      } catch (err: any) {
        console.error('Failed to delete files:', err)
        setError('Failed to delete selected files. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
    
    // Function to toggle file selection
    const toggleFileSelection = (fileId: string) => {
      setSelectedFiles(prev => 
        prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId]
      )
    }
    
    // Function to format file size
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    
    // Function to format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleString()
    }
    
    // Function to get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'text-green-600'
        case 'pending': return 'text-yellow-600'
        case 'processing': return 'text-blue-600'
        case 'error': return 'text-red-600'
        default: return 'text-gray-600'
      }
    }

    return (
      <Card>
        {/* Success Dialog for Deletion */}
        <Dialog open={isDeleteSuccessDialogOpen} onOpenChange={setIsDeleteSuccessDialogOpen}>
          <DialogContent className="bg-green-100/80 backdrop-blur-sm border border-green-200 shadow-xl max-w-md">
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-400/90 flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-green-800 mb-2">Success!</DialogTitle>
              <DialogDescription className="text-green-700 mb-8 text-base">
                {deleteSuccessMessage}
              </DialogDescription>
              <Button 
                onClick={() => setIsDeleteSuccessDialogOpen(false)} 
                className="bg-green-500/90 hover:bg-green-600 text-white w-32 shadow-sm transition-all duration-200"
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Manage CSV Files</CardTitle>
            <CardDescription>
              View and manage your uploaded transaction CSV files
            </CardDescription>
          </div>
          {/* Button container */}  
          <div className="flex space-x-2">
            {/* Delete button - Moved here */} 
            {selectedFiles.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'Deleting...' : `Delete Selected (${selectedFiles.length})`}
                </Button>
            )}
           </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Error message */} 
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* File list */}
            {isLoading && <div className="py-4 text-center">Loading...</div>}
            
            {!isLoading && uploadedFiles.length === 0 && (
              <div className="py-4 text-center text-muted-foreground">
                No CSV files uploaded yet
              </div>
            )}
            
            {!isLoading && uploadedFiles.length > 0 && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rows</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={() => toggleFileSelection(file.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <FileIcon className="h-8 w-8 mr-2 text-blue-500" />
                            {file.original_filename}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(file.created_at)}</TableCell>
                        <TableCell>{formatFileSize(file.file_size)}</TableCell>
                        <TableCell>
                          <span className={getStatusColor(file.status)}>
                            {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                          </span>
                          {file.status === 'error' && file.error_message && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-4 w-4 ml-1 inline text-red-600" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{file.error_message}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          {file.imported_row_count !== null
                            ? `${file.imported_row_count}${file.row_count ? ` / ${file.row_count}` : ''}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ManualEntryForm = () => {
    const initialFormData: ManualTransactionFormData = {
      date: '',
      type: 'buy',
      btcAmount: '',
      price: '',
      usdAmount: '',
      fees: '',
      exchange: '',
      network_fee: '',
      txid: ''
    };
    const [formData, setFormData] = useState<ManualTransactionFormData>(initialFormData);
    const [stagedTransactions, setStagedTransactions] = useState<ManualTransactionFormData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Add state for previously imported transactions
    const [importedTransactions, setImportedTransactions] = useState<any[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    const currentUserId = useUserId();
    const router = useRouter();
    
    // Function to fetch previously imported transactions
    const fetchImportedTransactions = async () => {
      setIsLoadingTransactions(true);
      setTransactionError(null);
      
      try {
        // Call your API to fetch transactions - this is a placeholder
        // You'll need to implement the actual API function in your /lib/supabase.ts file
        // Example fetch call structure:
        const response = await fetch('/api/transactions/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: currentPage,
            pageSize,
            search: searchQuery,
            userId: currentUserId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setImportedTransactions(data.transactions || []);
        setTotalTransactions(data.totalCount || 0);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactionError('Failed to load your transactions. Please try again.');
      } finally {
        setIsLoadingTransactions(false);
      }
    };
    
    // Fetch transactions when component mounts or when pagination/search changes
    useEffect(() => {
      fetchImportedTransactions();
    }, [currentPage, pageSize, searchQuery]);
    
    // Refresh transactions after successful submission
    useEffect(() => {
      if (successDialogOpen) {
        fetchImportedTransactions();
      }
    }, [successDialogOpen]);

    // Function to handle page size change
    const handlePageSizeChange = (value: string) => {
      setPageSize(Number(value));
      setCurrentPage(1); // Reset to first page when changing page size
    };
    
    // Function to handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setCurrentPage(1); // Reset to first page when searching
    };
    
    // Functions for pagination
    const handleNextPage = () => {
      if (currentPage * pageSize < totalTransactions) {
        setCurrentPage(prev => prev + 1);
      }
    };
    
    const handlePreviousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    };
    
    // Function to delete a transaction
    const deleteTransaction = async (transactionId: string, transactionType: string) => {
      if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return;
      }
      
      setIsLoadingTransactions(true);
      setTransactionError(null);
      
      try {
        const response = await fetch('/api/transactions/manual/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId,
            transactionType,
            userId: currentUserId
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete transaction');
        }
        
        // Refresh the transaction list after successful deletion
        fetchImportedTransactions();
        
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setTransactionError(error instanceof Error ? error.message : 'Failed to delete transaction');
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    // Function to add current form data to the staged list
    const handleAddToPreview = () => {
      setSubmitError(null);
      setSuccessDialogOpen(false);
      // Basic validation
      if (!formData.date || !formData.btcAmount || !formData.price || !formData.usdAmount) {
        setSubmitError("Please fill in all required fields: Date, Amount (BTC), Price, Amount (USD).");
        return;
      }
      // TODO: Add more specific validation based on type if needed

      const newTransaction = { ...formData, tempId: Date.now() }; 
      setStagedTransactions(prev => [...prev, newTransaction]);
      setFormData(initialFormData);
    };

    // Function to remove a transaction from the staged list
    const handleRemoveFromPreview = (tempIdToRemove: number) => {
      setStagedTransactions(prev => prev.filter(tx => tx.tempId !== tempIdToRemove));
    };

    // Function to clear the input form
    const handleClearForm = () => {
      setFormData(initialFormData);
      setSubmitError(null);
    };

    // Function to submit all staged transactions
    const handleSubmitAll = async () => {
      if (stagedTransactions.length === 0) {
        setSubmitError("No transactions added to preview yet.");
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);

      const manualOrdersToInsert: OrderInsert[] = [];
      const manualTransfersToInsert: TransferInsert[] = [];

      try {
        // Transform staged transactions
        for (const tx of stagedTransactions) {
          const date = new Date(tx.date).toISOString(); // Ensure ISO format
          const btcAmount = parseFloat(tx.btcAmount);
          const price = parseFloat(tx.price);
          const usdAmount = parseFloat(tx.usdAmount);
          const fees = tx.fees ? parseFloat(tx.fees) : null;
          const networkFee = tx.network_fee ? parseFloat(tx.network_fee) : null;

          // Basic NaN checks after parsing
          if (isNaN(btcAmount) || isNaN(price) || isNaN(usdAmount)) {
             throw new Error(`Invalid numeric value found in transaction dated ${tx.date}. Please check amounts and price.`);
          }
          if (tx.fees && fees !== null && isNaN(fees)) {
             throw new Error(`Invalid Service Fee value found in transaction dated ${tx.date}.`);
          }
           if (tx.type === 'withdrawal' && tx.network_fee && networkFee !== null && isNaN(networkFee)) {
             throw new Error(`Invalid Network Fee value found in transaction dated ${tx.date}.`);
          }

          if (tx.type === 'buy' || tx.type === 'sell') {
            const order: OrderInsert = {
              user_id: currentUserId,
              date: date,
              type: tx.type,
              asset: 'BTC', // Assuming BTC only for now
              price: price, // Price is required for orders
              exchange: tx.exchange || null,
              // Assign amounts based on type, ensuring null where appropriate
              buy_fiat_amount: tx.type === 'buy' ? usdAmount : null,
              buy_currency: tx.type === 'buy' ? 'USD' : null,
              received_btc_amount: tx.type === 'buy' ? btcAmount : null,
              received_currency: tx.type === 'buy' ? 'BTC' : null,
              sell_btc_amount: tx.type === 'sell' ? btcAmount : null,
              sell_btc_currency: tx.type === 'sell' ? 'BTC' : null,
              received_fiat_amount: tx.type === 'sell' ? usdAmount : null,
              received_fiat_currency: tx.type === 'sell' ? 'USD' : null,
              service_fee: fees, // Already handles null
              service_fee_currency: fees !== null ? 'USD' : null, // Set currency only if fee exists
              // csv_upload_id is intentionally left out (will be NULL)
            };
            // Additional validation specific to orders
            if (tx.type === 'buy' && (order.buy_fiat_amount === null || order.received_btc_amount === null)) {
              throw new Error(`Buy transaction on ${tx.date} requires Amount (USD) and Amount (BTC).`);
            }
             if (tx.type === 'sell' && (order.sell_btc_amount === null || order.received_fiat_amount === null)) {
              throw new Error(`Sell transaction on ${tx.date} requires Amount (BTC) and Amount (USD).`);
            }
            manualOrdersToInsert.push(order);
          } else { // withdrawal or deposit
            const transfer: TransferInsert = {
              user_id: currentUserId,
              date: date,
              type: tx.type,
              asset: 'BTC', // Assuming BTC only
              amount_btc: btcAmount, // Required, already checked for NaN
              fee_amount_btc: tx.type === 'withdrawal' ? (networkFee ?? null) : null, 
              // Explicitly provide 0 if parsing results in NaN or value is empty/null
              amount_fiat: parseFloat(tx.usdAmount) || 0, // Use || 0 to handle NaN
              price: parseFloat(tx.price) || 0, // Use || 0 to handle NaN
              hash: tx.txid || null,
              // csv_upload_id is intentionally left out (will be NULL)
            };
            manualTransfersToInsert.push(transfer);
          }
        }

        // Call insertTransactions without csvUploadId
        const result = await insertTransactions({ 
          orders: manualOrdersToInsert, 
          transfers: manualTransfersToInsert 
        });

        if (result.error) {
          throw new Error(result.error.message || 'Failed to save transactions to database.')
        }

        // Success - show success dialog
        const transactionCount = manualOrdersToInsert.length + manualTransfersToInsert.length;
        setSuccessMessage(`Successfully added ${manualOrdersToInsert.length} orders and ${manualTransfersToInsert.length} transfers.`);
        setSuccessDialogOpen(true);
        setStagedTransactions([]); // Clear list on success
        setFormData(initialFormData); // Clear form
        console.log("Manual transactions submitted successfully:", result.data);

      } catch (err: any) {
        console.error("Error submitting manual transactions:", err);
        setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred during submission.');
        // Do not clear staged transactions on error
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div>
            <CardTitle>Manual Transaction Entry</CardTitle>
            <CardDescription>Add transactions to preview below</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button className="bg-bitcoin-orange hover:bg-bitcoin-orange/90" onClick={handleAddToPreview}> 
              Add to Preview
            </Button>
            <Button variant="outline" onClick={handleClearForm}> 
              Clear Form
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Display Submission Error */}
          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          
          {/* Success Dialog */}
          <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
            <DialogContent className="bg-green-100/80 backdrop-blur-sm border border-green-200 shadow-xl max-w-md">
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-400/90 flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-green-800 mb-2">Success!</DialogTitle>
                <DialogDescription className="text-green-700 mb-8 text-base">
                  {successMessage}
                </DialogDescription>
                <Button 
                  onClick={() => setSuccessDialogOpen(false)}
                  className="bg-green-500/90 hover:bg-green-600 text-white w-32 shadow-sm transition-all duration-200"
                >
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Manual Transaction Entry Form Container */}
          <div className="mb-8 p-4 rounded-lg border border-border bg-card/50">
            <h3 className="text-lg font-semibold mb-4">Enter Transaction Details</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <input
                    id="date"
                    name="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange({ target: { name: 'type', value } } as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Exchange Input - Conditional */}
                {(formData.type === 'buy' || formData.type === 'sell') && (
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
                )}
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
                {/* USD Amount Input - Moved Here & Conditional */}
                {(formData.type === 'buy' || formData.type === 'sell' || formData.type === 'withdrawal' || formData.type === 'deposit') && (
                  <div className="space-y-2">
                      <Label htmlFor="usdAmount">Amount (USD)</Label>
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
                )}
                {/* Network Fee Input - Conditional */}
                {formData.type === 'withdrawal' && (
                  <div className="space-y-2">
                    <Label htmlFor="network_fee">Network Fee (BTC)</Label>
                    <Input
                      id="network_fee"
                      name="network_fee"
                      type="number"
                      step="0.00000001"
                      placeholder="0.00000000"
                      value={formData.network_fee}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
                {/* Price Input - Always visible */}
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
                {/* Fees Input - Conditional */}
                {(formData.type === 'buy' || formData.type === 'sell') && (
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
                )}
                {/* TXID Input - Conditional */}
                {(formData.type === 'withdrawal' || formData.type === 'deposit') && (
                  <div className="space-y-2">
                    <Label htmlFor="txid">TXID</Label>
                    <Input
                      id="txid"
                      name="txid"
                      type="text"
                      placeholder="Enter transaction ID"
                      value={formData.txid}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Preview Container */}
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <h3 className="text-lg font-semibold mb-4">Transaction Preview ({stagedTransactions.length})</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Term</TableHead>
                    <TableHead className="text-center">Amount (BTC)</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Price (BTC/USD)</TableHead>
                    <TableHead className="text-center">Amount (USD)</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Fees (USD)</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Exchange</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Fees (BTC)</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">TXID</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stagedTransactions.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={11} className="text-center text-muted-foreground py-4">
                         No transactions added to preview yet.
                       </TableCell>
                     </TableRow>
                  )}
                  {stagedTransactions.map((tx) => (
                    <TableRow key={tx.tempId}>
                      <TableCell className="text-center">{new Date(tx.date).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge
                            variant="outline"
                            className={`w-[125px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none ${
                              tx.type === "buy" 
                                ? "bg-gradient-to-r from-bitcoin-orange/90 to-bitcoin-orange/70 border-bitcoin-orange/40 text-white" 
                                : tx.type === "sell"
                                ? "bg-gradient-to-r from-red-500/90 to-red-400/70 border-red-500/40 text-white"
                                : tx.type === "deposit"
                                ? "bg-gradient-to-r from-green-500/90 to-green-400/70 border-green-500/40 text-white"
                                : "bg-gradient-to-r from-blue-500/90 to-blue-400/70 border-blue-500/40 text-white"
                            }`}
                          >
                            {tx.type === "buy" ? (
                              <CircleArrowRight className="mr-1 h-4 w-4" />
                            ) : tx.type === "sell" ? (
                              <CircleArrowLeft className="mr-1 h-4 w-4" />
                            ) : tx.type === "deposit" ? (
                              <CircleArrowDown className="mr-1 h-4 w-4" />
                            ) : (
                              <CircleArrowUp className="mr-1 h-4 w-4" />
                            )}
                            {tx.type.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {tx.type === 'buy' || tx.type === 'sell' ? (
                          <Badge
                            variant="outline"
                            className={`w-[70px] inline-flex items-center justify-center ${
                              isShortTerm(tx.date)
                                ? "border-green-500 text-green-500"
                                : "border-purple-500 text-purple-500"
                            }`}
                          >
                            {isShortTerm(tx.date) ? "SHORT" : "LONG"}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">{tx.btcAmount || '0.00000000'}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">${tx.price || '0.00'}</TableCell>
                      <TableCell className="text-center">${tx.usdAmount || '0.00'}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">${tx.fees || '0.00'}</TableCell>
                      <TableCell className="text-center hidden lg:table-cell">{tx.exchange || '-'}</TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        {tx.type === 'withdrawal' ? (tx.network_fee || '0.00000000') : '-'}
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        {(tx.type === 'withdrawal' || tx.type === 'deposit') && tx.txid ? (
                          <a 
                            href={`https://mempool.space/tx/${tx.txid}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700"
                            title="View transaction on Mempool.space"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive/80 h-8 w-8"
                          onClick={() => handleRemoveFromPreview(tx.tempId!)}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {stagedTransactions.length > 0 && (
               <div className="flex justify-end mt-6">
                  <Button 
                     onClick={handleSubmitAll} 
                     disabled={isSubmitting}
                     className="bg-green-600 hover:bg-green-700"
                   >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Submitting...
                        </>
                     ) : (
                       `Submit ${stagedTransactions.length} Transaction(s)`
                     )}
                   </Button>
               </div>
            )}
          </div>
          
          {/* New Container for Manually Imported Transactions */}
          <div className="mt-8 p-4 rounded-lg border border-border bg-card/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Previously Imported</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search..."
                  className="w-[200px]"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            {transactionError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{transactionError}</AlertDescription>
              </Alert>
            )}
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Term</TableHead>
                    <TableHead className="text-center">Amount (BTC)</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Price (BTC/USD)</TableHead>
                    <TableHead className="text-center">Amount (USD)</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Fees (USD)</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Exchange</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Fees (BTC)</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">TXID</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTransactions ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 text-bitcoin-orange animate-spin mb-2" />
                          <p className="text-muted-foreground">Loading transactions...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : importedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                        <div className="flex flex-col items-center justify-center">
                          <p className="mb-2">No transactions found</p>
                          <p className="text-sm text-muted-foreground mb-4">Your manually entered transactions will appear here after submission</p>
                          <Button variant="outline" size="sm" onClick={fetchImportedTransactions}>
                            Refresh
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    importedTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-center">{new Date(tx.date).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge
                              variant="outline"
                              className={`w-[125px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none ${
                                tx.type === "buy" 
                                  ? "bg-gradient-to-r from-bitcoin-orange/90 to-bitcoin-orange/70 border-bitcoin-orange/40 text-white" 
                                  : tx.type === "sell"
                                  ? "bg-gradient-to-r from-red-500/90 to-red-400/70 border-red-500/40 text-white"
                                  : tx.type === "deposit"
                                  ? "bg-gradient-to-r from-green-500/90 to-green-400/70 border-green-500/40 text-white"
                                  : "bg-gradient-to-r from-blue-500/90 to-blue-400/70 border-blue-500/40 text-white"
                              }`}
                            >
                              {tx.type === "buy" ? (
                                <CircleArrowRight className="mr-1 h-4 w-4" />
                              ) : tx.type === "sell" ? (
                                <CircleArrowLeft className="mr-1 h-4 w-4" />
                              ) : tx.type === "deposit" ? (
                                <CircleArrowDown className="mr-1 h-4 w-4" />
                              ) : (
                                <CircleArrowUp className="mr-1 h-4 w-4" />
                              )}
                              {tx.type.toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.type === 'buy' || tx.type === 'sell' ? (
                            <Badge
                              variant="outline"
                              className={`w-[70px] inline-flex items-center justify-center ${
                                isShortTerm(tx.date)
                                  ? "border-green-500 text-green-500"
                                  : "border-purple-500 text-purple-500"
                              }`}
                            >
                              {isShortTerm(tx.date) ? "SHORT" : "LONG"}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.type === 'buy' 
                            ? tx.received_btc_amount 
                            : tx.type === 'sell' 
                              ? tx.sell_btc_amount 
                              : tx.amount_btc}
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">${tx.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                          ${tx.type === 'buy' 
                            ? tx.buy_fiat_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                            : tx.type === 'sell' 
                              ? tx.received_fiat_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                              : tx.amount_fiat?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          {tx.type === 'withdrawal' 
                            ? (tx.fee_amount_btc && tx.price ? '$' + (tx.fee_amount_btc * tx.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')
                            : (tx.service_fee ? '$' + tx.service_fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-')}
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">{tx.exchange || '-'}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          {tx.type === 'withdrawal' 
                            ? (tx.fee_amount_btc ? Number(tx.fee_amount_btc).toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 }) : '-')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          {tx.hash ? (
                            <a 
                              href={`https://mempool.space/tx/${tx.hash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700"
                              title="View transaction on Mempool.space"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/80 h-8 w-8"
                            onClick={() => deleteTransaction(tx.id, tx.type)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">
                  {importedTransactions.length > 0 
                    ? (currentPage - 1) * pageSize + 1 
                    : 0}
                </span> to <span className="font-medium">
                  {importedTransactions.length > 0 
                    ? Math.min(currentPage * pageSize, totalTransactions) 
                    : 0}
                </span> of <span className="font-medium">{totalTransactions}</span> transactions
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoadingTransactions}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage * pageSize >= totalTransactions || isLoadingTransactions}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const previewTransactions = async (
    parsedTransactions: ParsedTransaction[],
    csvUploadId: string
  ): Promise<{ orders: OrderInsert[], transfers: TransferInsert[] }> => {
    const orders: OrderInsert[] = [];
    const transfers: TransferInsert[] = [];

    parsedTransactions.forEach((transaction) => {
      if ('buy_fiat_amount' in transaction || 'sell_btc_amount' in transaction) {
        orders.push({
          ...transaction as OrderInsert,
          csv_upload_id: csvUploadId
        });
      } else {
        transfers.push({
          ...transaction as TransferInsert,
          csv_upload_id: csvUploadId
        });
      }
    });

    return { orders, transfers };
  };

  // Add csvUploadId state
  const [csvUploadId, setCsvUploadId] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [step, setStep] = useState<number>(1) // 1: Upload, 2: Preview, 3: Success

  // Add a success message component
  const SuccessMessage = () => {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-green-600">Import Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-center text-lg">
              Your transactions have been successfully imported.
            </p>
            <p className="text-center text-muted-foreground">
              You can view them in your transactions list or upload more files.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push('/transactions')}>
            View Transactions
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="import-data" className="w-full">
      <TabsList className="flex w-auto mb-4 bg-transparent p-0 h-auto justify-start gap-x-1 border-b border-border">
        <TabsTrigger 
          value="import-data"
          className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
        >
          Import Data
        </TabsTrigger>
        <TabsTrigger 
          value="manual-entry"
          className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
        >
          Manual Entry
        </TabsTrigger>
        <TabsTrigger 
          value="manage-csvs"
          className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
        >
          Manage CSVs
        </TabsTrigger>
        <TabsTrigger 
          value="csv-template"
          className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
        >
          CSV Template
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="import-data">
        {isParsing && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 min-h-[700px] text-center border-border">
             <Loader2 className="h-12 w-12 text-bitcoin-orange animate-spin mb-4" />
             <h3 className="text-lg font-semibold">Parsing CSV...</h3>
             <p className="mt-2 text-sm text-muted-foreground">Please wait while we process your file.</p>
           </div>
        )}
        
        {!isParsing && !parsedData && (
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 min-h-[700px] text-center ${
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

        {error && !parsedData && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {parsedData && ( 
           <ImportPreview 
             transactions={parsedData} 
             validationIssues={validationIssues}
             originalRows={originalRows}
             file={file}
           />
         )}
      </TabsContent>
      
      <TabsContent value="manual-entry">
        <ManualEntryForm />
      </TabsContent>

      <TabsContent value="manage-csvs">
        <ManageCSVs />
      </TabsContent>
      
      <TabsContent value="csv-template">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders Template Card */}
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
                  <Bitcoin className="h-6 w-6 text-bitcoin-orange" />
                </div>
                <CardTitle>Orders Template</CardTitle>
                <CardDescription>
                  <ul className="list-none text-center mt-2 space-y-1">
                    <li>• Buy and sell transaction records</li>
                    <li>• Fiat amounts and BTC amounts tracking</li>
                    <li>• Price per BTC and exchange information</li>
                    <li>• Service fees and transaction metadata</li>
                  </ul>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-0 pt-0">
                {/* Content if needed, or keep empty */}
              </CardContent>
              <CardFooter className="flex justify-center pt-2">
                <Button variant="outline" className="px-6">
                  <Download className="mr-2 h-4 w-4" />
                  Download Orders Template
                </Button>
              </CardFooter>
            </Card>

            {/* Transfers Template Card */}
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
                  <ArrowLeftRight className="h-6 w-6 text-bitcoin-orange" />
                </div>
                <CardTitle>Transfers Template</CardTitle>
                <CardDescription>
                  <ul className="list-none text-center mt-2 space-y-1">
                    <li>• Deposit and withdrawal transactions</li>
                    <li>• BTC amounts and network fees tracking</li>
                    <li>• Transaction hash for blockchain records</li>
                    <li>• Optional price data at time of transfer</li>
                  </ul>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-0 pt-0">
                {/* Content if needed, or keep empty */}
              </CardContent>
              <CardFooter className="flex justify-center pt-2">
                <Button variant="outline" className="px-6">
                  <Download className="mr-2 h-4 w-4" />
                  Download Transfers Template
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}