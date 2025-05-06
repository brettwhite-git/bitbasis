"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { ParsedTransaction, ValidationIssue } from '@/components/import/lib/types'

export type ImportStep = 'upload' | 'preview' | 'confirmation'

interface ImportContextType {
  // Current step in the import flow
  step: ImportStep
  setStep: (step: ImportStep) => void
  
  // File & parsing state
  currentFile: File | null
  setCurrentFile: (file: File | null) => void
  
  // Loading and progress states
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  loadingState: 'idle' | 'uploading' | 'parsing' | 'validating' | 'importing'
  setLoadingState: (state: 'idle' | 'uploading' | 'parsing' | 'validating' | 'importing') => void
  uploadProgress: number
  setUploadProgress: (progress: number) => void
  
  // Parsed data and validation
  parsedTransactions: ParsedTransaction[] | null
  setParsedTransactions: (transactions: ParsedTransaction[] | null) => void
  validationIssues: ValidationIssue[]
  setValidationIssues: (issues: ValidationIssue[]) => void
  
  // CSV upload tracking
  csvUploadId: string | null
  setCsvUploadId: (id: string | null) => void
  
  // Error handling
  error: string | null
  setError: (error: string | null) => void
  
  // Reset the entire import state
  resetImportState: () => void
  
  // Handle completion
  handleImportComplete: (count: number) => void
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
  
  // File & parsing state
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  
  // Loading and progress states
  const [isLoading, setIsLoading] = useState(false)
  const [loadingState, setLoadingState] = useState<'idle' | 'uploading' | 'parsing' | 'validating' | 'importing'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Parsed data and validation
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[] | null>(null)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  
  // CSV upload tracking
  const [csvUploadId, setCsvUploadId] = useState<string | null>(null)
  
  // Error handling
  const [error, setError] = useState<string | null>(null)
  
  // Reset entire import state
  const resetImportState = useCallback(() => {
    setStep('upload')
    setCurrentFile(null)
    setIsLoading(false)
    setLoadingState('idle')
    setUploadProgress(0)
    setParsedTransactions(null)
    setValidationIssues([])
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
        isLoading,
        setIsLoading,
        loadingState,
        setLoadingState,
        uploadProgress,
        setUploadProgress,
        parsedTransactions,
        setParsedTransactions,
        validationIssues,
        setValidationIssues,
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