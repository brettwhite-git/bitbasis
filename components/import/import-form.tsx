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

type DbTransaction = Database['public']['Tables']['transactions']['Insert']

interface ValidationIssue {
  row: number
  field: string
  issue: string
  suggestion?: string
  severity: 'error' | 'warning'
}

interface CSVRow {
  date: string
  type: string
  buy_amount?: string
  sell_amount?: string
  sent_amount?: string
  received_amount?: string
  exchange?: string
  network_fee?: string
  network_currency?: string
  service_fee?: string
  service_fee_currency?: string
  [key: string]: string | undefined
}

interface ParsedTransaction {
  date: string
  type: 'Buy' | 'Sell' | 'Send' | 'Receive'
  asset: string
  price: number
  sent_amount: number | null
  sent_currency: string | null
  received_amount: number | null
  received_currency: string | null
  buy_amount: number | null
  buy_currency: string | null
  sell_amount: number | null
  sell_currency: string | null
  network_fee: number | null
  network_currency: string | null
  service_fee: number | null
  service_fee_currency: string | null
  exchange: string | null
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date
  }

  // Try MM/DD/YY format
  const parts = dateStr.split(' ')
  const datePart = parts[0]
  const timePart = parts[1] || '00:00'

  if (!datePart) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  const [month, day, yearShort] = datePart.split('/')
  const [hours, minutes] = timePart.split(':')

  if (!month || !day || !yearShort || !hours || !minutes) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  const year = yearShort.length === 2 ? `20${yearShort}` : yearShort
  
  const parsedDate = new Date()
  parsedDate.setFullYear(parseInt(year))
  parsedDate.setMonth(parseInt(month) - 1)
  parsedDate.setDate(parseInt(day))
  parsedDate.setHours(parseInt(hours))
  parsedDate.setMinutes(parseInt(minutes))

  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  return parsedDate
}

const transformCSVToTransaction = (row: CSVRow): ParsedTransaction => {
  try {
    // 1. Normalize and validate type
    if (!row.type) {
      throw new Error('Missing transaction type')
    }

    const rawType = row.type.toString().trim()
    let type: 'Buy' | 'Sell' | 'Send' | 'Receive'

    // Normalize type with case-insensitive matching
    const normalizedType = rawType.toLowerCase()
    switch (normalizedType) {
      case 'buy':
        type = 'Buy'
        break
      case 'sell':
        type = 'Sell'
        break
      case 'send':
        type = 'Send'
        break
      case 'receive':
        type = 'Receive'
        break
      default:
        throw new Error(`Invalid transaction type: ${rawType}`)
    }

    // 2. Parse and validate date
    if (!row.date) {
      throw new Error('Missing transaction date')
    }

    const date = parseDate(row.date).toISOString()

    // Helper function to parse amount
    const parseAmount = (value: string | undefined): number | null => {
      if (!value || value.trim() === '') return null
      const strValue = value.toString().trim()
      const numValue = Number(strValue.split(' ')[0])
      return isNaN(numValue) ? null : numValue
    }

    // Parse all amounts
    const sent_amount = parseAmount(row.sent_amount)
    const received_amount = parseAmount(row.received_amount)
    const buy_amount = parseAmount(row.buy_amount)
    const sell_amount = parseAmount(row.sell_amount)
    const network_fee = parseAmount(row.network_fee)
    const service_fee = parseAmount(row.service_fee)

    // Build transaction object matching database schema
    const baseTransaction: ParsedTransaction = {
      date,
      type,
      asset: 'BTC',
      sent_amount: null,
      sent_currency: null,
      received_amount: null,
      received_currency: null,
      buy_amount: null,
      buy_currency: null,
      sell_amount: null,
      sell_currency: null,
      price: 0,
      network_fee: network_fee || null,
      network_currency: network_fee ? (type === 'Buy' ? 'USD' : 'BTC') : null,
      service_fee: service_fee || null,
      service_fee_currency: service_fee ? (type === 'Buy' ? 'USD' : 'BTC') : null,
      exchange: row.exchange || null
    }

    // Calculate price and set amounts based on transaction type
    switch (type) {
      case 'Buy': {
        if (!buy_amount || !received_amount) {
          throw new Error('Buy transaction requires both USD and BTC amounts')
        }
        return {
          ...baseTransaction,
          buy_amount,
          buy_currency: 'USD',
          received_amount,
          received_currency: 'BTC',
          price: buy_amount / received_amount
        }
      }
      case 'Sell': {
        // For sell transactions, we need both the BTC amount being sold and the USD amount received
        const btcAmount = sell_amount
        const usdAmount = received_amount

        if (!btcAmount || btcAmount <= 0) {
          throw new Error('Sell transaction requires a positive BTC amount')
        }
        if (!usdAmount || usdAmount <= 0) {
          throw new Error('Sell transaction requires a positive USD amount')
        }

        return {
          ...baseTransaction,
          sell_amount: btcAmount,
          sell_currency: 'BTC',
          received_amount: usdAmount,
          received_currency: 'USD',
          price: usdAmount / btcAmount
        }
      }
      case 'Send': {
        if (!sent_amount) {
          throw new Error('Send transaction requires BTC amount')
        }
        return {
          ...baseTransaction,
          sent_amount,
          sent_currency: 'BTC',
          price: 0
        }
      }
      case 'Receive': {
        if (!received_amount) {
          throw new Error('Receive transaction requires BTC amount')
        }
        return {
          ...baseTransaction,
          received_amount,
          received_currency: 'BTC',
          price: 0
        }
      }
    }
  } catch (err) {
    throw err
  }
}

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parsedData, setParsedData] = useState<ParsedTransaction[] | null>(null)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [originalRows, setOriginalRows] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>('upload')

  const validateTransaction = (row: any, index: number): ValidationIssue[] => {
    const issues: ValidationIssue[] = []

    // Debug validation
    console.log(`Validating row ${index + 1}:`, {
      rowData: row,
      type: row.type,
      amounts: {
        sent: row.sent_amount,
        received: row.received_amount,
        buy: row.buy_amount,
        sell: row.sell_amount
      }
    })

    // 1. Required fields for all transactions
    if (!row.date || !row.type) {
      if (!row.date) {
        issues.push({
          row: index + 1,
          field: 'date',
          issue: 'Missing date',
          suggestion: 'Add a date in YYYY-MM-DD HH:mm:ss format',
          severity: 'error'
        })
      }
      if (!row.type) {
        issues.push({
          row: index + 1,
          field: 'type',
          issue: 'Missing transaction type',
          suggestion: 'Add a transaction type (Buy, Sell, Send, or Receive)',
          severity: 'error'
        })
      }
      return issues
    }

    // 2. Validate type
    const type = row.type.toString().toLowerCase().trim()
    if (!['buy', 'sell', 'send', 'receive'].includes(type)) {
      issues.push({
        row: index + 1,
        field: 'type',
        issue: `Invalid transaction type: ${row.type}`,
        suggestion: 'Use one of: Buy, Sell, Send, Receive',
        severity: 'error'
      })
      return issues
    }

    // Helper to validate numeric amount
    const isValidAmount = (value: any): boolean => {
      if (!value) return false
      const num = Number(value.toString().split(' ')[0])
      return !isNaN(num) && num > 0
    }

    // 3. Type-specific validations
    switch (type) {
      case 'buy': {
        // Buy transactions require USD amount in buy_amount and received_amount
        if (!isValidAmount(row.buy_amount)) {
          issues.push({
            row: index + 1,
            field: 'buy_amount',
            issue: 'Missing or invalid USD amount',
            suggestion: 'Add the USD amount spent',
            severity: 'error'
          })
        }
        if (!isValidAmount(row.received_amount)) {
          issues.push({
            row: index + 1,
            field: 'received_amount',
            issue: 'Missing or invalid BTC amount received',
            suggestion: 'Add the BTC amount received',
            severity: 'error'
          })
        }
        break
      }

      case 'sell': {
        // Sell transactions require BTC amount in sell_amount and received_amount
        if (!isValidAmount(row.sell_amount)) {
          issues.push({
            row: index + 1,
            field: 'sell_amount',
            issue: 'Missing or invalid BTC amount to sell',
            suggestion: 'Add the BTC amount to sell',
            severity: 'error'
          })
        }
        if (!isValidAmount(row.received_amount)) {
          issues.push({
            row: index + 1,
            field: 'received_amount',
            issue: 'Missing or invalid USD amount received',
            suggestion: 'Add the USD amount received',
            severity: 'error'
          })
        }
        break
      }

      case 'send': {
        // Send transactions require BTC amount in sent_amount
        if (!isValidAmount(row.sent_amount)) {
          issues.push({
            row: index + 1,
            field: 'sent_amount',
            issue: 'Missing or invalid BTC amount sent',
            suggestion: 'Add the BTC amount sent',
            severity: 'error'
          })
        }
        break
      }

      case 'receive': {
        // Receive transactions require BTC amount in received_amount
        if (!isValidAmount(row.received_amount)) {
          issues.push({
            row: index + 1,
            field: 'received_amount',
            issue: 'Missing or invalid BTC amount received',
            suggestion: 'Add the BTC amount received',
            severity: 'error'
          })
        }
        break
      }
    }

    return issues
  }

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as any[]
        if (!data || data.length < 2) {
          setError('CSV file is empty or invalid')
          return
        }

        // Debug raw CSV data
        console.log('CSV parsing results:', {
          totalRows: data.length,
          headers: Object.keys(data[0]),
          firstRow: data[0],
          sampleRows: data.slice(0, 5).map(row => ({
            date: row.date,
            type: row.type,
            amounts: {
              buy_amount: row.buy_amount,
              sell_amount: row.sell_amount,
              sent_amount: row.sent_amount,
              received_amount: row.received_amount
            }
          }))
        })

        // Normalize headers to ensure consistent casing
        const normalizedData = data.map(row => {
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

        // If first row contains headers, start from second row
        const startIndex = normalizedData[0].date && normalizedData[0].type ? 1 : 0
        const rowsToProcess = normalizedData.slice(startIndex)

        console.log('Processing rows:', {
          startIndex,
          totalRowsToProcess: rowsToProcess.length,
          firstRowToProcess: rowsToProcess[0]
        })

        setOriginalRows(rowsToProcess)
        const issues: ValidationIssue[] = []
        const transactions: ParsedTransaction[] = []

        // Process each row
        rowsToProcess.forEach((row, index) => {
          // Skip empty rows
          if (!row || Object.keys(row).length === 0) {
            console.log(`Skipping empty row ${index + 1}`)
            return
          }

          // Debug row processing
          console.log(`Processing row ${index + 1}:`, {
            originalRowNumber: index + startIndex + 1,
            rowData: row,
            type: row.type,
            amounts: {
              buy_amount: row.buy_amount,
              sell_amount: row.sell_amount,
              sent_amount: row.sent_amount,
              received_amount: row.received_amount
            }
          })

          const rowIssues = validateTransaction(row, index)
          if (rowIssues.length > 0) {
            console.log(`Validation issues for row ${index + 1}:`, rowIssues)
            issues.push(...rowIssues)
          } else {
            try {
              const transformed = transformCSVToTransaction(row)
              console.log(`Successfully transformed row ${index + 1}:`, {
                input: row,
                output: transformed
              })
              transactions.push(transformed)
            } catch (err) {
              console.error(`Error transforming row ${index + 1}:`, {
                error: err,
                errorMessage: err instanceof Error ? err.message : String(err),
                rowData: row
              })
              issues.push({
                row: index + 1,
                field: 'general',
                issue: err instanceof Error ? err.message : 'Unknown error',
                severity: 'error'
              })
            }
          }
        })

        setValidationIssues(issues)
        setParsedData(transactions)
        setError(null)
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        setError(`Error parsing CSV: ${error.message}`)
      },
      header: true,
      skipEmptyLines: true,
      // Disable dynamic typing to prevent automatic conversions
      dynamicTyping: false,
      transform: (value, field: string) => {
        if (!value) return value
        
        // Debug the transformation
        console.log(`Transforming field "${field}":`, {
          originalValue: value,
          type: typeof value,
          field
        })
        
        const strValue = value.toString().trim()
        
        // Special handling for type field
        if (field.toLowerCase() === 'type') {
          return strValue.toLowerCase()
        }
        
        // Handle amounts with currency suffixes
        if (field.toLowerCase().includes('amount')) {
          const parts = strValue.split(' ')
          const numericPart = parts[0]
          const currencyPart = parts[1]
          
          console.log(`Processing amount field "${field}":`, {
            original: strValue,
            numericPart,
            currencyPart,
            hasUSD: currencyPart === 'USD',
            hasBTC: currencyPart === 'BTC'
          })
          
          return numericPart
        }
        
        return strValue
      }
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const droppedFile = files[0]
      if (!droppedFile) return

      const validationError = validateFile(droppedFile)
      if (validationError) {
        setError(validationError)
        return
      }
      setFile(droppedFile)
      parseCSV(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const selectedFile = files[0]
      if (!selectedFile) return

      const validationError = validateFile(selectedFile)
      if (validationError) {
        setError(validationError)
        return
      }
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file || !parsedData) return

    setIsLoading(true)
    setError(null)
    setUploadProgress(10)

    try {
      // Transform the parsed data
      const transactions = parsedData.map((transaction, index) => {
        // Debug log for each transaction being processed
        console.log(`Processing transaction ${index + 1}:`, {
          type: transaction.type,
          amounts: {
            sent: transaction.sent_amount,
            received: transaction.received_amount,
            buy: transaction.buy_amount,
            sell: transaction.sell_amount
          }
        })

        // Validate required fields
        if (!transaction.date) throw new Error(`Row ${index + 1}: Missing date`)
        if (!transaction.type) throw new Error(`Row ${index + 1}: Missing type`)
        if (typeof transaction.price !== 'number') throw new Error(`Row ${index + 1}: Invalid price`)

        // Helper to validate amount
        const validateAmount = (amount: number | null | undefined): number | null => {
          if (amount === null || amount === undefined) return null
          const num = Number(amount)
          if (isNaN(num)) {
            console.error(`Invalid amount value:`, { amount, index: index + 1 })
            return null
          }
          return num
        }

        // Parse all amounts first
        const sent_amount = validateAmount(transaction.sent_amount)
        const received_amount = validateAmount(transaction.received_amount)
        const buy_amount = validateAmount(transaction.buy_amount)
        const sell_amount = validateAmount(transaction.sell_amount)
        const network_fee = validateAmount(transaction.network_fee)
        const service_fee = validateAmount(transaction.service_fee)

        // Debug log for amounts after validation
        if (transaction.type === 'Sell') {
          console.log(`Validating Sell amounts for row ${index + 1}:`, {
            sell_amount,
            received_amount
          })
        }

        // Initialize transaction with required fields
        const transformedTransaction: {
          date: string
          type: 'Buy' | 'Sell' | 'Send' | 'Receive'
          asset: string
          sent_amount: number | null
          sent_currency: string | null
          buy_amount: number | null
          buy_currency: string | null
          sell_amount: number | null
          sell_currency: string | null
          price: number
          received_amount: number | null
          received_currency: string | null
          exchange: string | null
          network_fee: number | null
          network_currency: string | null
          service_fee: number | null
          service_fee_currency: string | null
        } = {
          date: transaction.date,
          type: transaction.type,
          asset: 'BTC',
          price: transaction.price,
          sent_amount: null,
          sent_currency: null,
          received_amount: null,
          received_currency: null,
          buy_amount: null,
          buy_currency: null,
          sell_amount: null,
          sell_currency: null,
          network_fee: network_fee || null,
          network_currency: network_fee ? (transaction.type === 'Buy' ? 'USD' : 'BTC') : null,
          service_fee: service_fee || null,
          service_fee_currency: service_fee ? (transaction.type === 'Buy' ? 'USD' : 'BTC') : null,
          exchange: transaction.exchange || null
        }

        switch (transaction.type) {
          case 'Buy': {
            if (!buy_amount || buy_amount <= 0) {
              throw new Error(`Row ${index + 1}: Buy transaction requires a positive buy_amount`)
            }
            if (!received_amount || received_amount <= 0) {
              throw new Error(`Row ${index + 1}: Buy transaction requires a positive received_amount`)
            }
            transformedTransaction.buy_amount = buy_amount
            transformedTransaction.buy_currency = 'USD'
            transformedTransaction.received_amount = received_amount
            transformedTransaction.received_currency = 'BTC'
            transformedTransaction.price = buy_amount / received_amount
            break
          }
          case 'Sell': {
            // Debug log before validation
            console.log(`Validating Sell amounts for row ${index + 1}:`, {
              sell_amount,
              received_amount
            })

            if (!sell_amount || sell_amount <= 0) {
              throw new Error(`Row ${index + 1}: Sell transaction requires a positive sell_amount`)
            }
            if (!received_amount || received_amount <= 0) {
              console.error(`Invalid received_amount for Sell transaction:`, {
                row: index + 1,
                received_amount,
                original: transaction.received_amount
              })
              throw new Error(`Row ${index + 1}: Sell transaction requires a positive received_amount`)
            }
            transformedTransaction.sell_amount = sell_amount
            transformedTransaction.sell_currency = 'BTC'
            transformedTransaction.received_amount = received_amount
            transformedTransaction.received_currency = 'USD'
            transformedTransaction.price = received_amount / sell_amount
            break
          }
          case 'Send': {
            if (!sent_amount) {
              throw new Error(`Row ${index + 1}: Send transaction requires a positive sent_amount`)
            }
            transformedTransaction.sent_amount = sent_amount
            transformedTransaction.sent_currency = 'BTC'
            transformedTransaction.price = 0
            break
          }
          case 'Receive': {
            if (!received_amount) {
              throw new Error(`Row ${index + 1}: Receive transaction requires a positive received_amount`)
            }
            transformedTransaction.received_amount = received_amount
            transformedTransaction.received_currency = 'BTC'
            transformedTransaction.price = 0
            break
          }
        }

        return transformedTransaction
      })

      setUploadProgress(30)

      // Insert transactions
      const result = await insertTransactions(transactions)
      
      if (result.error) {
        console.error('Upload failed:', result.error)
        throw new Error(result.error.message || 'Failed to upload transactions')
      }

      setUploadProgress(100)

      // Reset form
      setFile(null)
      setParsedData(null)
      setValidationIssues([])
      setUploadProgress(0)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    }
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return 'File must be a CSV'
    }
    return null
  }

  const handleClose = () => {
    setParsedData(null)
    setValidationIssues([])
    setUploadProgress(0)
  }

  return (
    <Tabs defaultValue="csv" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
      </TabsList>
      <TabsContent value="csv" className="mt-4">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center mb-4 ${
            isDragging ? "border-bitcoin-orange bg-bitcoin-orange/10" : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Upload className="h-6 w-6 text-bitcoin-orange" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">
            {file ? file.name : "Drag and drop your CSV file"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {file ? `${(file.size / 1024).toFixed(2)} KB` : "or click to browse"}
          </p>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isLoading && (
            <div className="mt-4 w-full">
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
          {parsedData && !isLoading && (
            <div className="flex gap-4 mt-4">
              <Button onClick={handleUpload}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Transactions'
                )}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        {parsedData && validationIssues.length === 0 && (
          <ImportPreview 
            transactions={parsedData} 
            validationIssues={validationIssues}
            originalRows={originalRows}
            closeAction={handleClose}
          />
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
      <TabsContent value="manual" className="mt-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Manual Entry Coming Soon</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This feature is currently under development.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  )
}