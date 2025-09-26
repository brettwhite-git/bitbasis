"use client"

import React, { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle, Download } from 'lucide-react'
import Papa from 'papaparse'
import { useImport } from './import-context'
import type { CSVRow } from './import-context'

export function UploadStep() {
  const {
    currentFile,
    setCurrentFile,
    setCsvData,
    setCsvHeaders,
    setStep,
    setError,
    setIsLoading,
    setLoadingState,
    error
  } = useImport()

  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Note: CSV upload record creation moved to confirmation step
  // This ensures only successful imports create database records

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB'
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Only CSV files are supported'
    }

    return null
  }, [])

  // Parse CSV file
  const parseCSV = useCallback(async (file: File) => {
    setIsLoading(true)
    setLoadingState('parsing')
    setError(null)

    try {
      const text = await file.text()
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        complete: async (results) => {
          try {
            // Check for parsing errors
            if (results.errors.length > 0) {
              const criticalErrors = results.errors.filter(
                error => error.type === 'Delimiter' || error.type === 'Quotes'
              )
              if (criticalErrors.length > 0) {
                throw new Error(`CSV parsing error: ${criticalErrors[0]?.message || 'Unknown parsing error'}`)
              }
            }

            // Validate we have data
            if (!results.data || results.data.length === 0) {
              throw new Error('CSV file appears to be empty')
            }

            // Get headers and validate
            const headers = results.meta.fields || []
            if (headers.length === 0) {
              throw new Error('No column headers found in CSV file')
            }

            // Clean and validate data
            const cleanData = results.data as CSVRow[]
            const validRows = cleanData.filter(row => {
              // Filter out completely empty rows
              return Object.values(row).some(value => value && value.trim() !== '')
            })

            if (validRows.length === 0) {
              throw new Error('No valid data rows found in CSV file')
            }

            // Success - store data and headers
            // Note: CSV upload record will be created after successful import
            setCsvHeaders(headers)
            setCsvData(validRows)
            setCurrentFile(file)
            // Note: csvUploadId will be set after successful import
            
            // Move to mapping step
            setStep('mapping')
            
          } catch (error) {
            console.error('CSV processing error:', error)
            setError(error instanceof Error ? error.message : 'Failed to process CSV file')
          } finally {
            setIsLoading(false)
            setLoadingState('idle')
          }
        },
        error: (error: Error) => {
          console.error('Papa Parse error:', error)
          setError(`CSV parsing failed: ${error.message}`)
          setIsLoading(false)
          setLoadingState('idle')
        }
      })
    } catch (error) {
      console.error('File reading error:', error)
      setError(error instanceof Error ? error.message : 'Failed to read file')
      setIsLoading(false)
      setLoadingState('idle')
    }
  }, [setCsvData, setCsvHeaders, setCurrentFile, setStep, setError, setIsLoading, setLoadingState])

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      return
    }

    await parseCSV(file)
  }, [parseCSV, setError, validateFile])

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
    
    const files = event.dataTransfer.files
    if (files && files.length > 0 && files[0]) {
      await handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Handle browse button click
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragActive
            ? 'border-bitcoin-orange bg-bitcoin-orange/5' 
            : 'border-gray-600/50 hover:border-gray-500/70 bg-gray-800/20'
          }
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-gray-700/50">
            <Upload className="h-8 w-8 text-bitcoin-orange" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {dragActive ? 'Drop CSV file here' : 'Upload CSV File'}
            </h3>
            <p className="text-gray-400 text-sm">
              Drag and drop your CSV file here, or click to browse
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleBrowseClick}
            className="bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
          >
            Browse Files
          </Button>
        </div>
      </div>

      {/* File info if file is selected */}
      {currentFile && (
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-bitcoin-orange mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-white">{currentFile.name}</h4>
              <p className="text-sm text-gray-400">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-400 mb-1">Upload Error</h4>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Template Download Buttons */}
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 rounded-xl p-4 border border-gray-700/30">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-white mb-2">Need a template?</h4>
            <p className="text-sm text-gray-400">
              Download our standardized CSV templates to get started quickly.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Basic Template Button */}
            <Button asChild variant="outline" className="flex-1 bg-gray-800/40 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500/70 transition-all duration-200">
              <a href="/templates/bitbasis_template_with_examples.csv" download>
                <Download className="mr-2 h-4 w-4" />
                Basic Template
              </a>
            </Button>
            
            {/* Comprehensive Template Button */}
            <Button asChild variant="outline" className="flex-1 bg-gray-800/40 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-white hover:border-gray-500/70 transition-all duration-200">
              <a href="/templates/bitbasis_comprehensive_with_examples.csv" download>
                <FileText className="mr-2 h-4 w-4" />
                Comprehensive Template
              </a>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
            <div className="text-center">
              <span className="font-medium text-gray-400">Basic:</span> Essential fields for most users
            </div>
            <div className="text-center">
              <span className="font-medium text-gray-400">Comprehensive:</span> All fields + addresses
            </div>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <h4 className="font-medium text-blue-400 mb-2">CSV Format Requirements</h4>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• File must be in CSV format (.csv extension)</li>
          <li>• First row should contain column headers</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Common fields: Date, Amount, Type, Fee, Exchange, etc.</li>
        </ul>
      </div>
    </div>
  )
} 