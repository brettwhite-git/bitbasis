"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Database, Upload, AlertCircle } from 'lucide-react'
import { useImport } from './import-context'
import { format } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database as DatabaseType } from '@/types/supabase'

export function ConfirmationStep() {
  const {
    mappedTransactions,
    csvUploadId,
    validationIssues,
    error,
    setError,
    setIsLoading,
    setLoadingState,
    handleImportComplete
  } = useImport()

  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'storing' | 'success' | 'error'>('idle')
  const [importedCount, setImportedCount] = useState(0)

  // Update CSV upload status
  const updateCSVUploadStatus = async (
    status: 'completed' | 'error',
    details?: { importedRowCount?: number; errorMessage?: string }
  ) => {
    if (!csvUploadId) return

    try {
      const supabase = createClientComponentClient<DatabaseType>()
      
      const updateData: any = { status }
      if (details?.importedRowCount !== undefined) {
        updateData.imported_row_count = details.importedRowCount
      }
      if (details?.errorMessage !== undefined) {
        updateData.error_message = details.errorMessage
      }

      const { error } = await supabase
        .from('csv_uploads')
        .update(updateData)
        .eq('id', csvUploadId)

      if (error) {
        console.error('Error updating CSV upload status:', error)
      }
    } catch (error) {
      console.error('Error updating CSV upload status:', error)
    }
  }

  // Transform unified transactions to API format
  const transformForAPI = (transactions: any[]) => {
    return transactions.map(transaction => {
      // Start with required fields
      const apiTransaction: any = {
        date: transaction.date?.toISOString() || new Date().toISOString(),
        type: transaction.type,
        asset: transaction.asset || 'BTC',
        price: transaction.price || 0, // Default to 0 if not provided
        csv_upload_id: csvUploadId
      }

      // Only include optional fields if they have valid values
      if (transaction.sent_amount != null && transaction.sent_amount !== '') {
        apiTransaction.sent_amount = transaction.sent_amount
      }
      if (transaction.sent_currency && transaction.sent_currency !== '') {
        apiTransaction.sent_currency = transaction.sent_currency
      }
      if (transaction.received_amount != null && transaction.received_amount !== '') {
        apiTransaction.received_amount = transaction.received_amount
      }
      if (transaction.received_currency && transaction.received_currency !== '') {
        apiTransaction.received_currency = transaction.received_currency
      }
      if (transaction.fee_amount != null && transaction.fee_amount !== '') {
        apiTransaction.fee_amount = transaction.fee_amount
      }
      if (transaction.fee_currency && transaction.fee_currency !== '') {
        apiTransaction.fee_currency = transaction.fee_currency
      }
      if (transaction.from_address && transaction.from_address !== '') {
        apiTransaction.from_address = transaction.from_address
      }
      if (transaction.from_address_name && transaction.from_address_name !== '') {
        apiTransaction.from_address_name = transaction.from_address_name
      }
      if (transaction.to_address && transaction.to_address !== '') {
        apiTransaction.to_address = transaction.to_address
      }
      if (transaction.to_address_name && transaction.to_address_name !== '') {
        apiTransaction.to_address_name = transaction.to_address_name
      }
      if (transaction.transaction_hash && transaction.transaction_hash !== '') {
        apiTransaction.transaction_hash = transaction.transaction_hash
      }
      if (transaction.comment && transaction.comment !== '') {
        apiTransaction.comment = transaction.comment
      }

      return apiTransaction
    })
  }

  // Handle the import process
  const handleImport = async () => {
    if (!mappedTransactions || mappedTransactions.length === 0) {
      setError('No transactions to import')
      return
    }

    // Debug: Check if we have csvUploadId
    console.log('Debug: Starting import with csvUploadId:', csvUploadId)
    if (!csvUploadId) {
      setError('No CSV upload ID found. Please restart the import process.')
      return
    }

    setIsLoading(true)
    setImportStatus('uploading')
    setImportProgress(10)
    setError(null)

    try {
      // Transform transactions for API
      const apiTransactions = transformForAPI(mappedTransactions)
      console.log('Debug: First transaction csv_upload_id:', apiTransactions[0]?.csv_upload_id)
      setImportProgress(30)

      // Send to unified transactions API
      setLoadingState('importing')
      setImportStatus('storing')
      
      const response = await fetch('/api/transactions/add-unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: apiTransactions
        })
      })

      setImportProgress(70)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        
        // Handle detailed validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorDetails = errorData.details.map((detail: any) => 
            `${detail.field}: ${detail.message}`
          ).join(', ')
          throw new Error(`${errorData.error || 'Validation failed'}\nDetails: ${errorDetails}`)
        }
        
        throw new Error(errorData.error || `Import failed with status ${response.status}`)
      }

      const result = await response.json()
      setImportProgress(100)
      setImportedCount(result.count || apiTransactions.length)
      setImportStatus('success')

      // Update CSV upload status to completed
      await updateCSVUploadStatus('completed', { 
        importedRowCount: result.count || apiTransactions.length 
      })

      // Brief delay to show success state
      setTimeout(() => {
        handleImportComplete(result.count || apiTransactions.length)
      }, 2000)

    } catch (error) {
      console.error('Import error:', error)
      setImportStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Failed to import transactions'
      setError(errorMessage)
      
      // Update CSV upload status to error
      await updateCSVUploadStatus('error', { errorMessage })
    } finally {
      setIsLoading(false)
      setLoadingState('idle')
    }
  }

  if (!mappedTransactions) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">No transactions to import</div>
      </div>
    )
  }

  const errorCount = validationIssues.filter(issue => issue.severity === 'error').length
  const warningCount = validationIssues.filter(issue => issue.severity === 'warning').length

  // Show import progress
  if (importStatus === 'uploading' || importStatus === 'storing') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Importing Transactions</h3>
          <p className="text-gray-400 text-sm">
            Please wait while we save your transactions...
          </p>
        </div>

        <div className="space-y-4">
          <Progress value={importProgress} className="w-full" />
          
          <div className="flex items-center justify-center gap-3">
            <Upload className="h-5 w-5 text-bitcoin-orange animate-pulse" />
            <span className="text-white">
              {importStatus === 'uploading' ? 'Preparing transactions...' : 'Saving to database...'}
            </span>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            {mappedTransactions.length} transactions
          </div>
        </div>
      </div>
    )
  }

  // Show success state
  if (importStatus === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-green-500/10">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Import Successful!</h3>
          <p className="text-gray-400">
            Successfully imported {importedCount} transaction(s) to your portfolio.
          </p>
        </div>

        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
          <div className="text-green-400 text-sm">
            Your transactions are now available in the transaction history and will be included in portfolio calculations.
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (importStatus === 'error') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-500/10">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Import Failed</h3>
          <p className="text-gray-400">
            There was an error importing your transactions.
          </p>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-left">
              <div className="text-red-400 text-sm font-medium mb-2">Error Details:</div>
              <div className="text-red-300 text-sm whitespace-pre-wrap">{error}</div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setImportStatus('idle')}
            className="bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
          >
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.reload()}
            className="bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-white"
          >
            Start Over
          </Button>
        </div>
      </div>
    )
  }

  // Show confirmation screen (default state)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Confirm Import</h3>
        <p className="text-gray-400 text-sm">
          Ready to import your transactions. Review the summary below and click Import to proceed.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{mappedTransactions.length}</div>
            <div className="text-sm text-gray-400">Transactions</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${errorCount === 0 ? 'text-green-400' : 'text-red-400'}`}>
              {errorCount}
            </div>
            <div className="text-sm text-gray-400">Errors</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${warningCount === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {warningCount}
            </div>
            <div className="text-sm text-gray-400">Warnings</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {mappedTransactions.filter(t => t.date).length}
            </div>
            <div className="text-sm text-gray-400">Valid Dates</div>
          </div>
        </div>
      </div>

      {/* Date range info */}
      {mappedTransactions.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-blue-400" />
            <div>
              <div className="font-medium text-blue-400">Import Details</div>
              <div className="text-sm text-blue-300">
                Date range: {mappedTransactions
                  .filter(t => t.date)
                  .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
                  .map(t => t.date ? format(t.date, 'MMM dd, yyyy') : '')
                  .filter(Boolean)
                  .slice(0, 1)
                  .concat('to')
                  .concat(
                    mappedTransactions
                      .filter(t => t.date)
                      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
                      .map(t => t.date ? format(t.date, 'MMM dd, yyyy') : '')
                      .filter(Boolean)
                      .slice(0, 1)
                  )
                  .join(' ')
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning about existing data */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <div className="font-medium text-yellow-400 mb-1">Important Notes</div>
            <ul className="text-sm text-yellow-300 space-y-1">
              <li>• Transactions will be added to your existing portfolio data</li>
              <li>• Duplicate transactions may affect your calculations</li>
              <li>• This action cannot be easily undone</li>
              <li>• Portfolio calculations will be updated automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
        >
          Cancel Import
        </Button>
        
        <Button 
          onClick={handleImport}
          disabled={errorCount > 0}
          className="bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-white disabled:opacity-50"
        >
          Import {mappedTransactions.length} Transaction(s)
        </Button>
      </div>
    </div>
  )
} 