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
  quantity: number
  price: number
  total: number
  fee: number
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
  notes: string | null
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

    // Helper function to parse currency
    const parseCurrency = (value: string | undefined): string | null => {
      if (!value || typeof value !== 'string') return null
      const strValue = value.trim()
      const parts = strValue.split(' ')
      const currency = parts.length > 1 ? parts[1] : null
      return currency || null
    }

    // Helper function to parse amount
    const parseAmount = (value: string | undefined): number => {
      if (!value) return 0
      const strValue = value.toString().trim()
      const numValue = Number(strValue.split(' ')[0])
      if (isNaN(numValue)) {
        throw new Error(`Invalid amount: ${value}`)
      }
      return numValue
    }

    // Parse all amounts and currencies
    const sent_amount = parseAmount(row.sent_amount)
    const received_amount = parseAmount(row.received_amount)
    const buy_amount = parseAmount(row.buy_amount)
    const sell_amount = parseAmount(row.sell_amount)
    const network_fee = parseAmount(row.network_fee)
    const service_fee = parseAmount(row.service_fee)

    // Calculate total fees
    const fee = (network_fee || 0) + (service_fee || 0)

    // Build base transaction
    const baseTransaction: ParsedTransaction = {
      date,
      type,
      asset: 'BTC',
      quantity: 0,
      price: 0,
      total: 0,
      fee,
      sent_amount,
      sent_currency: parseCurrency(row.sent_amount),
      received_amount,
      received_currency: parseCurrency(row.received_amount),
      buy_amount,
      buy_currency: parseCurrency(row.buy_amount),
      sell_amount,
      sell_currency: parseCurrency(row.sell_amount),
      network_fee,
      network_currency: row.network_currency || null,
      service_fee,
      service_fee_currency: row.service_fee_currency || null,
      exchange: row.exchange || null,
      notes: null
    }

    // Update transaction-specific fields
    switch (type) {
      case 'Buy': {
        if (!buy_amount || !received_amount) {
          throw new Error('Buy transaction requires both USD and BTC amounts')
        }
        return {
          ...baseTransaction,
          quantity: received_amount,
          price: buy_amount / received_amount,
          total: buy_amount
        }
      }
      
      case 'Sell': {
        if (!sell_amount || !received_amount) {
          throw new Error('Sell transaction requires both BTC and USD amounts')
        }
        return {
          ...baseTransaction,
          quantity: -sell_amount,
          price: received_amount / sell_amount,
          total: received_amount
        }
      }
      
      case 'Send': {
        if (!sent_amount) {
          throw new Error('Send transaction requires BTC amount')
        }
        return {
          ...baseTransaction,
          quantity: -Math.abs(sent_amount),
          price: 0,
          total: 0
        }
      }
      
      case 'Receive': {
        if (!received_amount) {
          throw new Error('Receive transaction requires BTC amount')
        }
        return {
          ...baseTransaction,
          quantity: Math.abs(received_amount),
          price: 0,
          total: 0
        }
      }
    }
  } catch (err) {
    console.error('Transform error:', {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      rowData: row
    })
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

              const transformed = transformCSVToTransaction(row as CSVRow)
              
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
            sent: transaction.quantity,
            received: transaction.quantity,
            buy: transaction.quantity,
            sell: transaction.quantity
          })

          switch (transaction.type) {
            case 'Buy':
              buy_amount = Number(transaction.quantity)
              received_amount = Number(transaction.quantity)
              if (isNaN(buy_amount) || buy_amount <= 0) {
                throw new Error(`Invalid buy amount for Buy transaction on ${transaction.date}. Value: ${transaction.quantity}`)
              }
              if (isNaN(received_amount) || received_amount <= 0) {
                throw new Error(`Invalid received amount for Buy transaction on ${transaction.date}. Value: ${transaction.quantity}`)
              }
              break

            case 'Sell':
              sell_amount = Number(transaction.quantity)
              received_amount = Number(transaction.quantity)
              
              // Validate amounts
              if (isNaN(sell_amount) || sell_amount <= 0) {
                throw new Error(`Invalid BTC amount for Sell transaction on ${transaction.date}. Value: ${transaction.quantity}`)
              }
              if (isNaN(received_amount) || received_amount <= 0) {
                throw new Error(`Invalid USD amount for Sell transaction on ${transaction.date}. Value: ${transaction.quantity}`)
              }
              break

            case 'Send':
              const sentAmount = Number(transaction.quantity)
              if (isNaN(sentAmount) || sentAmount <= 0) {
                throw new Error(`Invalid sent amount for Send transaction on ${transaction.date}. Value: ${transaction.quantity}`)
              }
              break

            case 'Receive':
              const receivedAmount = Number(transaction.quantity)
              if (isNaN(receivedAmount) || receivedAmount <= 0) {
                throw new Error(`Invalid received amount for Receive transaction on ${transaction.date}. Value: ${transaction.quantity}`)
              }
              break
          }

          const transformedTransaction: ParsedTransaction = {
            date: transaction.date,
            type: transaction.type,
            asset: 'BTC',
            quantity: Number(transaction.quantity || 0),
            price: price,
            total: (Number(transaction.quantity || 0)) * price,
            fee: transaction.fee || 0,
            sent_amount: transaction.sent_amount ? Number(transaction.sent_amount) : null,
            sent_currency: transaction.sent_currency || null,
            received_amount: transaction.received_amount ? Number(transaction.received_amount) : null,
            received_currency: transaction.received_currency || null,
            buy_amount: transaction.buy_amount ? Number(transaction.buy_amount) : null,
            buy_currency: transaction.buy_currency || null,
            sell_amount: transaction.sell_amount ? Number(transaction.sell_amount) : null,
            sell_currency: transaction.sell_currency || null,
            network_fee: transaction.network_fee ? Number(transaction.network_fee) : null,
            network_currency: transaction.network_currency || null,
            service_fee: transaction.service_fee ? Number(transaction.service_fee) : null,
            service_fee_currency: transaction.service_fee_currency || null,
            exchange: transaction.exchange || null,
            notes: transaction.notes || null
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
            <Button onClick={handleUpload} className="mt-4">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Transactions'
              )}
            </Button>
          )}
        </div>
        {parsedData && validationIssues.length === 0 && (
          <ImportPreview 
            transactions={parsedData} 
            validationIssues={validationIssues}
            originalRows={originalRows}
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