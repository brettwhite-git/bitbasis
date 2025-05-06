"use client"

import React, { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useImport } from './ImportContext'
import { cn } from '@/lib/utils/utils'
import Papa from 'papaparse'
import { uploadCSVFile, updateCSVUploadStatus } from '@/lib/supabase/supabase'
import { normalizeHeaders, transformRowToTransaction } from '@/components/transactions/utils/parsing'
import { validateTransaction } from '@/components/transactions/utils/validation'
import { useAuth } from '@/providers/supabase-auth-provider'
import { ParsedTransaction, ValidationIssue } from '@/components/transactions/utils/types'

// Type for validation field to match expected values
type ValidationField = 'id' | 'source' | 'type' | 'date' | 'asset' | 'exchange' | 'price' |
  'buyFiatAmount' | 'buyCurrency' | 'receivedBtcAmount' | 'sellBtcAmount' | 
  'sellBtcCurrency' | 'receivedFiatAmount' | 'receivedFiatCurrency' | 'serviceFee' | 
  'serviceFeeCurrency' | 'amountBtc' | 'feeAmountBtc' | 'amountFiat' | 'hash' | 'general';

// Custom validation issue type that matches what we're creating
interface CustomValidationIssue {
  transactionId: string;
  field: ValidationField;
  message: string;
  severity: 'error' | 'warning';
}

export function UploadStep() {
  const { 
    setStep, 
    currentFile, 
    setCurrentFile, 
    setIsLoading, 
    setLoadingState,
    setParsedTransactions,
    setValidationIssues,
    setCsvUploadId,
    setError 
  } = useImport()

  const { user } = useAuth()
  const userId = user?.id
  
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection via input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        setCurrentFile(file)
        processFile(file)
      }
    }
  }

  // Handle file drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0]
      if (file) {
        // Check if it's a CSV file
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          setCurrentFile(file)
          processFile(file)
        } else {
          setError("Please select a CSV file")
        }
      }
    }
  }

  // Handle drag events
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
  }

  // Process the uploaded file - parse CSV and validate transactions
  const processFile = useCallback(async (file: File) => {
    if (!userId) {
      setError("Cannot process file: User not authenticated.")
      return
    }
    
    setError(null)
    setParsedTransactions(null)
    setValidationIssues([])
    setCsvUploadId(null)
    
    setIsLoading(true)
    setLoadingState('uploading')
    
    try {
      // Step 1: Upload file and create DB record
      const { data: csvUpload, error: uploadError } = await uploadCSVFile(file)
      if (uploadError || !csvUpload?.id) {
        throw uploadError || new Error('Failed to upload file and create record.')
      }
      setCsvUploadId(csvUpload.id)
      
      // Step 2: Parse the file locally using Papaparse
      setLoadingState('parsing')
      
      const parseResult = await new Promise<{ data: Record<string, any>[], errors: any[] }>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve({ 
            data: results.data as Record<string, any>[], 
            errors: results.errors 
          }),
          error: (error) => reject(error),
        })
      })

      if (parseResult.errors.length > 0) {
        console.error('Papaparse errors:', parseResult.errors)
        throw new Error(`Failed to parse CSV: ${parseResult.errors[0]?.message || 'Unknown parsing error'}`)
      }

      const rawRows = parseResult.data
      const processed: ParsedTransaction[] = []
      const issues: CustomValidationIssue[] = []
      
      // Step 3: Validate transactions
      setLoadingState('validating')
      
      for (let index = 0; index < rawRows.length; index++) {
        const rawRow = rawRows[index]
        try {
          if (!rawRow || Object.values(rawRow).every(val => !val || String(val).trim() === '')) continue
          
          const normalizedRow = normalizeHeaders(rawRow)
          
          const transaction = transformRowToTransaction(normalizedRow, 'csv')
          const rowIssues = validateTransaction(transaction, index)
          
          processed.push(transaction)
          issues.push(...rowIssues as CustomValidationIssue[])
        } catch (err) {
          console.error(`Error processing row ${index + 1}:`, err)
          issues.push({
            transactionId: `csv-row-${index + 1}-${Date.now()}`,
            field: 'general',
            message: err instanceof Error ? err.message : 'Row processing error',
            severity: 'error'
          })
        }
      }

      setParsedTransactions(processed)
      // Cast issues to ValidationIssue[] as we've ensured the types match
      setValidationIssues(issues as ValidationIssue[])

      if (processed.length === 0) {
        throw new Error("No valid transactions found in the CSV file.")
      }

      // Debug - Check transaction data format
      console.log('Parsed transactions structure (first 2 transactions):', processed.slice(0, 2).map(tx => {
        // Use type narrowing to access specific properties
        const common = {
          id: tx.id,
          type: tx.type,
          date: tx.date,
          asset: tx.asset,
          exchange: tx.exchange,
          price: tx.price
        };

        // Properties specific to order or transfer types
        if (tx.type === 'buy' || tx.type === 'sell') {
          // For buy/sell transactions
          return {
            ...common,
            // Buy specific
            buyFiatAmount: tx.type === 'buy' ? tx.buyFiatAmount : undefined,
            buyCurrency: tx.type === 'buy' ? tx.buyCurrency : undefined,
            receivedBtcAmount: tx.type === 'buy' ? tx.receivedBtcAmount : undefined,
            // Sell specific
            sellBtcAmount: tx.type === 'sell' ? tx.sellBtcAmount : undefined,
            sellBtcCurrency: tx.type === 'sell' ? tx.sellBtcCurrency : undefined,
            receivedFiatAmount: tx.type === 'sell' ? tx.receivedFiatAmount : undefined,
            // Common to both
            serviceFee: tx.serviceFee,
            serviceFeeCurrency: tx.serviceFeeCurrency
          };
        } else if (tx.type === 'deposit' || tx.type === 'withdrawal') {
          // Need to explicitly check for deposit/withdrawal to narrow the type
          return {
            ...common,
            // TypeScript requires this type assertion because of the union type
            amountBtc: (tx as any).amountBtc,
            feeAmountBtc: tx.type === 'withdrawal' ? (tx as any).feeAmountBtc : undefined,
            amountFiat: (tx as any).amountFiat,
            hash: (tx as any).hash
          };
        } else {
          // Default case
          return common;
        }
      }));
      
      // Update status in DB
      await updateCSVUploadStatus(csvUpload.id, 'processing', { rowCount: rawRows.length })
      
      // Move to preview step
      setStep('preview')
    } catch (err) {
      console.error("File processing error:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      setLoadingState('idle')
    }
  }, [userId, setCurrentFile, setError, setParsedTransactions, setValidationIssues, setCsvUploadId, setIsLoading, setLoadingState, setStep])

  return (
    <div className="space-y-6">
      <div className="text-sm">
        Import transactions from a CSV file. Your file should include columns for date, type, 
        asset, amount, and price.
      </div>
      
      <div 
        className={cn(
          "border-2 border-dashed rounded-md p-8 text-center",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        
        <div className="text-lg font-medium mb-2">
          {currentFile ? currentFile.name : "Drag and drop your CSV file here"}
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          {!currentFile && "or"}
        </div>
        
        <Label htmlFor="csv-upload" className="cursor-pointer">
          <Button
            variant="outline"
            size="lg"
            type="button"
            onClick={() => document.getElementById('csv-upload')?.click()}
            className="mx-auto"
          >
            Browse Files
          </Button>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </Label>
      </div>

      <div className="text-xs text-muted-foreground">
        <ul className="list-disc pl-4 space-y-1">
          <li>File must be in CSV format</li>
          <li>Maximum file size: 100MB</li>
          <li>Required columns: date, type, asset, amount, price</li>
          <li>Supported transaction types: buy, sell, withdrawal, deposit</li>
        </ul>
      </div>
    </div>
  )
} 