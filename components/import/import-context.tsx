"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

// Define the steps for the new import process
export type ImportStep = 'upload' | 'mapping' | 'preview' | 'confirmation'

// Define loading states
export type LoadingState = 'idle' | 'uploading' | 'parsing' | 'mapping' | 'validating' | 'importing'

// CSV row type (raw data from CSV)
export interface CSVRow {
  [header: string]: string | undefined
}

// Column mapping configuration
export interface ColumnMapping {
  csvColumn: string  // Name of the column in CSV
  transactionField: TransactionFieldType | null  // Mapped transaction field
  isRequired: boolean
  isConfident: boolean  // Whether auto-detection is confident
}

// Transaction fields that can be mapped
export type TransactionFieldType = 
  | 'date'
  | 'type' 
  | 'sent_amount'
  | 'sent_currency'
  | 'received_amount'
  | 'received_currency'
  | 'fee_amount'
  | 'fee_currency'
  | 'from_address_name'
  | 'to_address_name'
  | 'from_address'
  | 'to_address'
  | 'transaction_hash'
  | 'price'
  | 'comment'
  | 'ignore'  // Special field to ignore a column

// Unified transaction structure for the new schema
export interface UnifiedTransaction {
  // Row tracking
  id: string  // Unique ID for this processing session
  originalRowData: CSVRow
  
  // Core fields
  date: Date | null
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest' | 'unknown'
  asset: string
  
  // Transaction amounts
  sent_amount: number | null
  sent_currency: string | null
  received_amount: number | null  
  received_currency: string | null
  fee_amount: number | null
  fee_currency: string | null
  
  // Address information
  from_address: string | null
  from_address_name: string | null
  to_address: string | null
  to_address_name: string | null
  
  // Additional fields
  transaction_hash: string | null
  price: number | null
  comment: string | null
}

// Validation issue structure
export interface ValidationIssue {
  transactionId: string
  field: keyof UnifiedTransaction | 'general'
  message: string
  severity: 'error' | 'warning'
}

interface ImportContextType {
  // Step management
  step: ImportStep
  setStep: (step: ImportStep) => void
  
  // File & raw data
  currentFile: File | null
  setCurrentFile: (file: File | null) => void
  csvData: CSVRow[] | null
  setCsvData: (data: CSVRow[] | null) => void
  csvHeaders: string[]
  setCsvHeaders: (headers: string[]) => void
  
  // Column mapping
  columnMappings: ColumnMapping[]
  setColumnMappings: (mappings: ColumnMapping[]) => void
  
  // Processed data
  mappedTransactions: UnifiedTransaction[] | null
  setMappedTransactions: (transactions: UnifiedTransaction[] | null) => void
  validationIssues: ValidationIssue[]
  setValidationIssues: (issues: ValidationIssue[]) => void
  
  // Loading and progress states
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  loadingState: LoadingState
  setLoadingState: (state: LoadingState) => void
  uploadProgress: number
  setUploadProgress: (progress: number) => void
  
  // CSV upload tracking
  csvUploadId: string | null
  setCsvUploadId: (id: string | null) => void
  
  // Error handling
  error: string | null
  setError: (error: string | null) => void
  
  // Helper functions
  resetImportState: () => void
  handleImportComplete: (count: number) => void
  
  // Success callback
  onImportSuccess?: (count: number) => void
}

const ImportContext = createContext<ImportContextType | undefined>(undefined)

interface ImportProviderProps {
  children: ReactNode
  onImportSuccess?: (count: number) => void
}

export function ImportProvider({ children, onImportSuccess }: ImportProviderProps) {
  // Step management
  const [step, setStep] = useState<ImportStep>('upload')
  
  // File & raw data
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[] | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  
  // Column mapping
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  
  // Processed data
  const [mappedTransactions, setMappedTransactions] = useState<UnifiedTransaction[] | null>(null)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  
  // Loading and progress states
  const [isLoading, setIsLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // CSV upload tracking
  const [csvUploadId, setCsvUploadId] = useState<string | null>(null)
  
  // Error handling
  const [error, setError] = useState<string | null>(null)
  
  // Reset entire import state
  const resetImportState = useCallback(() => {
    setStep('upload')
    setCurrentFile(null)
    setCsvData(null)
    setCsvHeaders([])
    setColumnMappings([])
    setMappedTransactions(null)
    setValidationIssues([])
    setIsLoading(false)
    setLoadingState('idle')
    setUploadProgress(0)
    setCsvUploadId(null)
    setError(null)
  }, [])
  
  // Handle completion
  const handleImportComplete = useCallback((count: number) => {
    if (onImportSuccess) {
      onImportSuccess(count)
    }
    resetImportState()
  }, [onImportSuccess, resetImportState])
  
  return (
    <ImportContext.Provider
      value={{
        step,
        setStep,
        currentFile,
        setCurrentFile,
        csvData,
        setCsvData,
        csvHeaders,
        setCsvHeaders,
        columnMappings,
        setColumnMappings,
        mappedTransactions,
        setMappedTransactions,
        validationIssues,
        setValidationIssues,
        isLoading,
        setIsLoading,
        loadingState,
        setLoadingState,
        uploadProgress,
        setUploadProgress,
        csvUploadId,
        setCsvUploadId,
        error,
        setError,
        resetImportState,
        handleImportComplete,
        onImportSuccess
      }}
    >
      {children}
    </ImportContext.Provider>
  )
}

export function useImport() {
  const context = useContext(ImportContext)
  if (context === undefined) {
    throw new Error('useImport must be used within an ImportProvider')
  }
  return context
} 