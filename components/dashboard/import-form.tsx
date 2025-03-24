"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Papa from 'papaparse'
import { ImportPreview } from "./import-preview"
import { insertTransactions } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface ParsedTransaction {
  date: string
  asset: string
  type: 'Buy' | 'Sell' | 'Send' | 'Receive'
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
}

interface ValidationIssue {
  row: number
  field: string
  issue: string
  suggestion?: string
  severity: 'error' | 'warning'
}

const transformCSVToTransaction = (row: any): ParsedTransaction => {
  try {
    // 1. Normalize and validate type
    if (!row.type) {
      throw new Error('Missing transaction type')
    }

    const rawType = row.type.toString().trim()
    let type: 'Buy' | 'Sell' | 'Send' | 'Receive'

    // Debug the raw values with more detail
    console.log('Raw transaction data:', {
      rawType,
      rawTypeToString: row.type?.toString(),
      rawTypeClass: row.type?.constructor.name,
      rawValues: {
        type: row.type,
        buy_amount: row.buy_amount,
        sell_amount: row.sell_amount,
        sent_amount: row.sent_amount,
        received_amount: row.received_amount
      },
      allFields: Object.entries(row).map(([key, value]) => ({
        key,
        value,
        type: typeof value,
        class: value?.constructor.name
      }))
    })

    // Normalize type with case-insensitive matching and debug
    const normalizedType = rawType.toLowerCase()
    console.log('Type normalization:', {
      original: row.type,
      rawType,
      normalizedType,
      matchesBuy: normalizedType === 'buy',
      matchesSell: normalizedType === 'sell',
      matchesSend: normalizedType === 'send',
      matchesReceive: normalizedType === 'receive'
    })

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

    let date: Date
    try {
      const rawDate = row.date.toString().trim()
      date = new Date(rawDate)
      
      if (isNaN(date.getTime())) {
        // Try MM/DD/YY format
        const [datePart, timePart] = rawDate.split(' ')
        const [month, day, yearShort] = datePart.split('/')
        const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00']
        const year = yearShort.length === 2 ? `20${yearShort}` : yearShort
        
        date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        )
      }

      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${rawDate}`)
      }
    } catch (err) {
      throw new Error(`Invalid date format: ${row.date}`)
    }

    // Helper function to parse amount
    const parseAmount = (value: any, field: string): number | null => {
      if (!value) return null
      const strValue = value.toString().trim()
      const numValue = Number(strValue.split(' ')[0])
      if (isNaN(numValue)) {
        throw new Error(`Invalid ${field}: ${value}`)
      }
      return numValue
    }

    // 3. Build base transaction
    const baseTransaction = {
      date: date.toISOString(),
      asset: row.asset || 'BTC',
      type,
      exchange: row.exchange || null,
      network_fee: parseAmount(row.network_fee, 'network_fee'),
      network_currency: row.network_currency || null,
      service_fee: parseAmount(row.service_fee, 'service_fee'),
      service_fee_currency: row.service_fee_currency || null
    }

    // 4. Add type-specific fields
    switch (type) {
      case 'Buy': {
        const buy_amount = parseAmount(row.buy_amount, 'buy_amount')
        const received_amount = parseAmount(row.received_amount, 'received_amount')

        if (!buy_amount) {
          throw new Error('Buy transaction requires USD amount')
        }
        if (!received_amount) {
          throw new Error('Buy transaction requires BTC amount')
        }

        return {
          ...baseTransaction,
          buy_amount,
          buy_currency: 'USD',
          received_amount,
          received_currency: 'BTC',
          sent_amount: null,
          sent_currency: null,
          sell_amount: null,
          sell_currency: null,
          price: buy_amount / received_amount
        }
      }
      
      case 'Sell': {
        const sell_amount = parseAmount(row.sell_amount, 'sell_amount')
        const received_amount = parseAmount(row.received_amount, 'received_amount')

        if (!sell_amount) {
          throw new Error('Sell transaction requires BTC amount')
        }
        if (!received_amount) {
          throw new Error('Sell transaction requires USD amount')
        }

        return {
          ...baseTransaction,
          sell_amount,
          sell_currency: 'BTC',
          received_amount,
          received_currency: 'USD',
          sent_amount: null,
          sent_currency: null,
          buy_amount: null,
          buy_currency: null,
          price: received_amount / sell_amount
        }
      }
      
      case 'Send': {
        const sent_amount = parseAmount(row.sent_amount, 'sent_amount')
        if (!sent_amount) {
          throw new Error('Send transaction requires BTC amount')
        }

        return {
          ...baseTransaction,
          sent_amount,
          sent_currency: 'BTC',
          received_amount: null,
          received_currency: null,
          buy_amount: null,
          buy_currency: null,
          sell_amount: null,
          sell_currency: null,
          price: 0
        }
      }
      
      case 'Receive': {
        const received_amount = parseAmount(row.received_amount, 'received_amount')
        if (!received_amount) {
          throw new Error('Receive transaction requires BTC amount')
        }

        return {
          ...baseTransaction,
          received_amount,
          received_currency: 'BTC',
          sent_amount: null,
          sent_currency: null,
          buy_amount: null,
          buy_currency: null,
          sell_amount: null,
          sell_currency: null,
          price: 0
        }
      }
    }
  } catch (err) {
    // Enhance error with row data
    const enhancedError = new Error(
      `Failed to transform transaction: ${err instanceof Error ? err.message : 'Unknown error'}\nRow data: ${JSON.stringify(row, null, 2)}`
    )
    console.error('Transform error:', {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      rowData: row
    })
    throw enhancedError
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
        console.log('Raw CSV data:', {
          headers: Object.keys(data[0]),
          firstFewRows: data.slice(1, 5).map(row => ({
            rawRow: row,
            rawType: row.type,
            typeType: typeof row.type,
            rawAmounts: {
              buy_amount: row.buy_amount,
              sell_amount: row.sell_amount,
              sent_amount: row.sent_amount,
              received_amount: row.received_amount
            }
          }))
        })

        setOriginalRows(data)
        const issues: ValidationIssue[] = []
        const transactions: ParsedTransaction[] = []

        // Get headers and normalize them
        const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim())
        console.log('Found headers:', headers)

        // Process each row
        data.slice(1).forEach((row, index) => {
          // Skip empty rows
          if (!row || Object.keys(row).length === 0) {
            return
          }

          // Debug row before any transformation
          console.log(`Raw row ${index + 1} data:`, {
            rowNumber: index + 1,
            originalRow: row,
            headerMapping: Object.keys(row).reduce((acc, key) => ({
              ...acc,
              [key]: {
                value: row[key],
                type: typeof row[key],
                hasUSDSuffix: String(row[key]).includes('USD'),
                hasBTCSuffix: String(row[key]).includes('BTC')
              }
            }), {})
          })

          const rowIssues = validateTransaction(row, index)
          if (rowIssues.length > 0) {
            issues.push(...rowIssues)
          } else {
            try {
              // Add detailed logging before transformation
              console.log(`Attempting to transform row ${index + 1}:`, {
                rowData: row,
                rowFields: Object.keys(row),
                rowValues: Object.entries(row).map(([key, value]) => ({
                  field: key,
                  value: value,
                  type: typeof value,
                  stringValue: String(value)
                }))
              })

              const transformed = transformCSVToTransaction(row)
              
              // Log successful transformation
              console.log(`Successfully transformed row ${index + 1}:`, {
                input: row,
                output: transformed
              })

              transactions.push(transformed)
            } catch (err) {
              console.error(`Error transforming row ${index + 1}:`, {
                error: err,
                errorMessage: err instanceof Error ? err.message : String(err),
                errorStack: err instanceof Error ? err.stack : undefined,
                rowData: row,
                rowNumber: index + 1,
                type: row.type,
                amounts: {
                  buy_amount: row.buy_amount,
                  sell_amount: row.sell_amount,
                  sent_amount: row.sent_amount,
                  received_amount: row.received_amount
                }
              })

              issues.push({
                row: index + 1,
                field: 'general',
                issue: err instanceof Error 
                  ? `Transformation error: ${err.message}` 
                  : 'Failed to transform row: Unknown error',
                suggestion: 'Check if all required fields are present and in correct format',
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
        
        // Handle amounts with currency suffixes
        if (field.includes('amount')) {
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
      },
      transformHeader: (header) => {
        const normalized = header.toLowerCase().trim()
        console.log('Header transformation:', {
          original: header,
          normalized
        })
        return normalized
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

    try {
      // Start with 10% progress for initial processing
      setUploadProgress(10)

      // Transform the parsed data to match the new Supabase schema
      const transactions = parsedData.map((transaction, index) => {
        try {
          // Log each transaction transformation for debugging
          console.log(`Processing transaction ${index + 1}:`, {
            original: transaction,
            type: transaction.type,
            date: transaction.date
          })

          // Ensure price is never null
          const price = Number(transaction.price || 0)
          if (isNaN(price)) {
            throw new Error(`Invalid price for transaction on ${transaction.date}`)
          }

          // Initialize amounts
          let sent_amount: number | null = null
          let received_amount: number | null = null
          let buy_amount: number | null = null
          let sell_amount: number | null = null

          // Log raw values for debugging
          console.log(`Transaction ${index + 1} raw values:`, {
            type: transaction.type,
            sent: transaction.sent_amount,
            received: transaction.received_amount,
            buy: transaction.buy_amount,
            sell: transaction.sell_amount
          })

          switch (transaction.type) {
            case 'Buy':
              buy_amount = Number(transaction.buy_amount)
              received_amount = Number(transaction.received_amount)
              if (isNaN(buy_amount) || buy_amount <= 0) {
                throw new Error(`Invalid buy amount for Buy transaction on ${transaction.date}. Value: ${transaction.buy_amount}`)
              }
              if (isNaN(received_amount) || received_amount <= 0) {
                throw new Error(`Invalid received amount for Buy transaction on ${transaction.date}. Value: ${transaction.received_amount}`)
              }
              break

            case 'Sell':
              sell_amount = Number(transaction.received_amount) // USD amount received
              sent_amount = Number(transaction.sell_amount)     // BTC amount sold
              if (isNaN(sent_amount) || sent_amount <= 0) {
                throw new Error(`Invalid BTC amount for Sell transaction on ${transaction.date}. Value: ${transaction.sell_amount}`)
              }
              if (isNaN(sell_amount) || sell_amount <= 0) {
                throw new Error(`Invalid USD amount for Sell transaction on ${transaction.date}. Value: ${transaction.received_amount}`)
              }
              break

            case 'Send':
              sent_amount = Number(transaction.sent_amount)
              if (isNaN(sent_amount) || sent_amount <= 0) {
                throw new Error(`Invalid sent amount for Send transaction on ${transaction.date}. Value: ${transaction.sent_amount}`)
              }
              break

            case 'Receive':
              received_amount = Number(transaction.received_amount)
              if (isNaN(received_amount) || received_amount <= 0) {
                throw new Error(`Invalid received amount for Receive transaction on ${transaction.date}. Value: ${transaction.received_amount}`)
              }
              break
          }

          const transformedTransaction = {
            date: transaction.date,
            type: transaction.type,
            asset: transaction.asset,
            sent_amount,
            sent_currency: sent_amount ? 'BTC' : null,
            buy_amount,
            buy_currency: buy_amount ? 'USD' : null,
            sell_amount,
            sell_currency: sell_amount ? 'USD' : null,
            price,
            received_amount,
            received_currency: received_amount ? (transaction.type === 'Buy' || transaction.type === 'Receive' ? 'BTC' : 'USD') : null,
            exchange: transaction.exchange || null,
            network_fee: transaction.network_fee ? Number(transaction.network_fee) : null,
            network_currency: transaction.network_currency || null,
            service_fee: transaction.service_fee ? Number(transaction.service_fee) : null,
            service_fee_currency: transaction.service_fee_currency || null
          }

          // Log transformed transaction for debugging
          console.log(`Transformed transaction ${index + 1}:`, transformedTransaction)

          return transformedTransaction
        } catch (err) {
          console.error(`Error processing transaction ${index + 1}:`, {
            error: err,
            transaction: transaction,
            message: err instanceof Error ? err.message : String(err)
          })
          throw err
        }
      })

      console.log('Transactions ready for insert:', {
        count: transactions.length,
        sample: transactions.slice(0, 2),
        schema: transactions[0] ? Object.keys(transactions[0]) : []
      })

      // Update progress to 30%
      setUploadProgress(30)

      try {
        // Insert transactions into Supabase
        const { data, error } = await insertTransactions(transactions)

        if (error) {
          console.error('Supabase insert error:', {
            error: error as PostgrestError,
            code: (error as PostgrestError).code,
            message: (error as PostgrestError).message,
            details: (error as PostgrestError).details,
            hint: (error as PostgrestError).hint
          })
          
          // Handle specific error cases
          const pgError = error as PostgrestError
          if (pgError.message?.includes('not authenticated')) {
            throw new Error('Please sign in to upload transactions')
          }
          if (pgError.message?.includes('duplicate key')) {
            throw new Error('Some transactions have already been uploaded')
          }
          if (pgError.message?.includes('check_required_amounts')) {
            throw new Error('Transaction amounts are invalid. Please ensure Buy/Receive transactions have received amounts and Sell/Send transactions have sent amounts.')
          }
          
          throw error
        }

        // Update progress to 100%
        setUploadProgress(100)

        // Reset form after successful upload
        setFile(null)
        setParsedData(null)
        setValidationIssues([])
        setUploadProgress(0)

        // Show success message or trigger refresh
        console.log('Successfully uploaded transactions:', {
          count: data?.length || 0,
          firstRow: data?.[0] || null
        })
      } catch (error) {
        console.error('Supabase error details:', {
          error,
          type: typeof error,
          isError: error instanceof Error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          code: (error as PostgrestError)?.code,
          details: (error as PostgrestError)?.details,
          hint: (error as PostgrestError)?.hint
        })
        throw error
      }
    } catch (err) {
      console.error('Upload error details:', {
        error: err,
        type: typeof err,
        isError: err instanceof Error,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(err instanceof Error ? err.message : 'Failed to upload transactions. Please try again.')
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

  return (
    <Tabs defaultValue="csv" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
      </TabsList>
      <TabsContent value="csv" className="mt-4">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${
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
            {file ? `${(file.size / 1024).toFixed(2)} KB` : "Or click to browse files"}
          </p>
          <Input 
            id="file-upload" 
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <Label
            htmlFor="file-upload"
            className={`mt-4 cursor-pointer rounded-md bg-bitcoin-orange px-4 py-2 text-sm font-medium text-white hover:bg-bitcoin-dark ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Browse Files
          </Label>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {validationIssues.length > 0 && (
          <Alert 
            variant="default"
            className="mt-4 border-yellow-500/50 bg-yellow-500/10"
          >
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-500">
              Validation Issues Found
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                {/* Show errors first */}
                {validationIssues
                  .filter(issue => issue.severity === 'error')
                  .map((issue, i) => (
                    <div key={`error-${i}`} className="text-sm text-yellow-500">
                      Row {issue.row}: {issue.issue}
                      {issue.suggestion && (
                        <span className="block text-xs text-yellow-500/75">Suggestion: {issue.suggestion}</span>
                      )}
                    </div>
                  ))}
                
                {/* Show warnings after errors */}
                {validationIssues
                  .filter(issue => issue.severity === 'warning')
                  .map((issue, i) => (
                    <div key={`warning-${i}`} className="text-sm text-yellow-500/75">
                      Row {issue.row}: {issue.issue}
                      {issue.suggestion && (
                        <span className="block text-xs text-yellow-500/60">Suggestion: {issue.suggestion}</span>
                      )}
                    </div>
                  ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {parsedData && parsedData.length > 0 && (
          <div className="mt-4">
            <ImportPreview
              transactions={parsedData}
              validationIssues={validationIssues}
              originalRows={originalRows}
            />
          </div>
        )}

        {isLoading && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading transactions...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {file && !isLoading && parsedData && (
          <div className="mt-4 flex justify-end">
            <Button 
              className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white"
              onClick={handleUpload}
              disabled={validationIssues.some(i => i.severity === 'error')}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload and Process'
              )}
            </Button>
          </div>
        )}

        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supported Formats</AlertTitle>
          <AlertDescription>
            <p className="mt-2 text-sm text-muted-foreground">
              We support CSV files from most major exchanges and wallets. The file should include:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              <li>Transaction date</li>
              <li>Transaction type (buy/sell)</li>
              <li>Amount of Bitcoin</li>
              <li>Price per Bitcoin</li>
              <li>Total cost/proceeds</li>
              <li>Fees (if applicable)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </TabsContent>
      <TabsContent value="manual" className="mt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-date">Transaction Date</Label>
              <Input id="transaction-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <select
                id="transaction-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="btc-amount">BTC Amount</Label>
              <Input id="btc-amount" type="number" step="0.00000001" placeholder="0.00000000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-per-btc">Price per BTC (USD)</Label>
              <Input id="price-per-btc" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-cost">Total Cost/Proceeds (USD)</Label>
              <Input id="total-cost" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">Fee (USD)</Label>
              <Input id="fee" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add any notes about this transaction"
            />
          </div>
          <div className="flex justify-end">
            <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Add Transaction</Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

