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
  asset: string
  price?: string
  exchange?: string
  buy_fiat_amount?: string
  received_btc_amount?: string
  sell_btc_amount?: string
  received_fiat_amount?: string
  service_fee?: string
  // Alternative field names for flexibility
  fiat_amount?: string
  btc_amount?: string
}

interface ParsedTransaction {
  date: string
  type: 'buy' | 'sell'
  asset: string
  price: number
  exchange: string | null
  buy_fiat_amount: number | null
  buy_currency: string | null
  received_btc_amount: number | null
  received_currency: string | null
  sell_btc_amount: number | null
  sell_btc_currency: string | null
  received_fiat_amount: number | null
  received_fiat_currency: string | null
  service_fee: number | null
  service_fee_currency: string | null
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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const parseDate = (dateStr: string): string => {
  try {
    // Parse MM/DD/YY HH:mm format
    const [datePart, timePart] = dateStr.split(' ')
    const [month, day, yearShort] = datePart.split('/')
    const [hours, minutes] = timePart.split(':')

    if (!month || !day || !yearShort || !hours || !minutes) {
      throw new Error(`Invalid date format: ${dateStr}`)
    }

    // Convert 2-digit year to 4-digit year
    const year = yearShort.length === 2 ? `20${yearShort}` : yearShort

    // Create date string in ISO format but preserve local time
    // Format: YYYY-MM-DDTHH:mm:ss
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
    
    return isoDate
  } catch (err) {
    throw new Error(`Invalid date format: ${dateStr}. Expected MM/DD/YY HH:mm`)
  }
}

const transformCSVToTransaction = (row: CSVRow): ParsedTransaction => {
  try {
    // 1. Normalize and validate type
    if (!row.type) {
      throw new Error('Missing transaction type')
    }

    const type = row.type.toString().toLowerCase().trim()
    if (type !== 'buy' && type !== 'sell') {
      throw new Error(`Invalid transaction type: ${row.type}. Must be 'buy' or 'sell'`)
    }

    // 2. Parse and validate date
    if (!row.date) {
      throw new Error('Missing transaction date')
    }
    const date = parseDate(row.date)

    // 3. Parse amounts
    const parseAmount = (value: string | undefined): number | null => {
      if (!value || value.trim() === '') return null
      const cleanValue = value.toString().replace(/[$,]/g, '').trim()
      const numValue = Number(cleanValue)
      return isNaN(numValue) ? null : numValue
    }

    // Parse all possible amounts
    const buy_fiat_amount = parseAmount(row.buy_fiat_amount || row.fiat_amount)
    const received_btc_amount = parseAmount(row.received_btc_amount || row.btc_amount)
    const sell_btc_amount = parseAmount(row.sell_btc_amount || row.btc_amount)
    const received_fiat_amount = parseAmount(row.received_fiat_amount || row.fiat_amount)
    const service_fee = parseAmount(row.service_fee)
    const price = parseAmount(row.price)

    // 4. Build base transaction
    const baseTransaction: ParsedTransaction = {
      date,
      type: type as 'buy' | 'sell',
      asset: 'BTC',
      price: 0, // Will be set below
      exchange: row.exchange || null,
      buy_fiat_amount: null,
      buy_currency: null,
      received_btc_amount: null,
      received_currency: null,
      sell_btc_amount: null,
      sell_btc_currency: null,
      received_fiat_amount: null,
      received_fiat_currency: null,
      service_fee,
      service_fee_currency: service_fee ? (type === 'buy' ? 'USD' : 'BTC') : null
    }

    // 5. Set type-specific fields and calculate price
    if (type === 'buy') {
      if (!buy_fiat_amount || !received_btc_amount) {
        throw new Error('Buy transaction requires buy_fiat_amount and received_btc_amount')
      }
      baseTransaction.buy_fiat_amount = buy_fiat_amount
      baseTransaction.buy_currency = 'USD'
      baseTransaction.received_btc_amount = received_btc_amount
      baseTransaction.received_currency = 'BTC'
      baseTransaction.price = price || (buy_fiat_amount / received_btc_amount)
    } else { // sell
      if (!sell_btc_amount || !received_fiat_amount) {
        throw new Error('Sell transaction requires sell_btc_amount and received_fiat_amount')
      }
      baseTransaction.sell_btc_amount = sell_btc_amount
      baseTransaction.sell_btc_currency = 'BTC'
      baseTransaction.received_fiat_amount = received_fiat_amount
      baseTransaction.received_fiat_currency = 'USD'
      baseTransaction.price = price || (received_fiat_amount / sell_btc_amount)
    }

    return baseTransaction
  } catch (err) {
    console.error('Error transforming CSV row:', {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      row
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
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    totalRows: 0,
    parsedRows: 0,
    importedRows: 0,
    failedRows: 0,
    failedRowDetails: []
  })

  const validateTransaction = (row: any, index: number): ValidationIssue[] => {
    const issues: ValidationIssue[] = []

    // Helper to validate numeric amount
    const isValidAmount = (value: any): boolean => {
      if (!value) return false
      const cleanValue = value.toString().replace(/[$,]/g, '').trim()
      const num = Number(cleanValue)
      return !isNaN(num) && num > 0
    }

    // Validate date format and future dates
    if (!row.date) {
      issues.push({
        row: index + 1,
        field: 'date',
        issue: 'Missing date',
        suggestion: 'Add a date in MM/DD/YY HH:mm format',
        severity: 'error'
      })
    } else {
      try {
        const parsedDate = parseDate(row.date)
        const now = new Date()
        if (parsedDate > now) {
          issues.push({
            row: index + 1,
            field: 'date',
            issue: 'Future date detected',
            suggestion: 'Verify if this future transaction date is intentional',
            severity: 'warning'
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
        suggestion: "Add a transaction type ('buy' or 'sell')",
        severity: 'error'
      })
      return issues
    }

    // Validate type
    const type = row.type.toString().toLowerCase().trim()
    if (type !== 'buy' && type !== 'sell') {
      issues.push({
        row: index + 1,
        field: 'type',
        issue: `Invalid transaction type: ${row.type}`,
        suggestion: "Use either 'buy' or 'sell'",
        severity: 'error'
      })
      return issues
    }

    // Type-specific validations
    if (type === 'buy') {
      const hasBuyAmount = isValidAmount(row.buy_fiat_amount)
      const hasReceivedBtc = isValidAmount(row.received_btc_amount)

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
      const hasSellBtc = isValidAmount(row.sell_btc_amount) || isValidAmount(row.btc_amount)
      const hasReceivedFiat = isValidAmount(row.received_fiat_amount) || isValidAmount(row.fiat_amount)

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
            if (rowIssues.length > 0) {
              failed++
              failedDetails.push({
                rowNumber: index + 1,
                error: rowIssues.map(i => i.issue).join(', ')
              })
              issues.push(...rowIssues)
            } else {
              const transformed = transformCSVToTransaction(row)
              transactions.push(transformed)
              successfullyParsed++
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

        setValidationIssues(issues)
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
      setUploadProgress(30)

      // Insert transactions
      const result = await insertTransactions(parsedData)
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to upload transactions')
      }

      // Update import status with final counts
      setImportStatus(prev => ({
        ...prev,
        importedRows: result.data?.length || 0,
        failedRows: prev.totalRows - (result.data?.length || 0)
      }))

      setUploadProgress(100)

      // Reset form if all rows were imported successfully
      if (result.data?.length === importStatus.totalRows) {
        setFile(null)
        setParsedData(null)
        setValidationIssues([])
        setUploadProgress(0)
      }
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

  // Add ImportStatus component to render
  const ImportStatusSummary = () => {
    if (!importStatus.totalRows) return null

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Import Status</CardTitle>
          <CardDescription>
            {importStatus.importedRows === importStatus.totalRows 
              ? 'All rows successfully imported!'
              : 'Some rows failed to import. Please review the details below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Rows:</span>
              <span>{importStatus.totalRows}</span>
            </div>
            <div className="flex justify-between">
              <span>Successfully Parsed:</span>
              <span className="text-green-500">{importStatus.parsedRows}</span>
            </div>
            <div className="flex justify-between">
              <span>Successfully Imported:</span>
              <span className="text-green-500">{importStatus.importedRows}</span>
            </div>
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className="text-red-500">{importStatus.failedRows}</span>
            </div>
            {importStatus.failedRowDetails.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Failed Rows:</h4>
                <div className="space-y-2">
                  {importStatus.failedRowDetails.map((detail, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTitle>Row {detail.rowNumber}</AlertTitle>
                      <AlertDescription>{detail.error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
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
        {parsedData && <ImportStatusSummary />}
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