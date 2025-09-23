"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'
import { useImport } from './import-context'
import { useTransactionLimits } from '@/lib/hooks/use-transaction-limits'

interface TransactionSummary {
  total: number
  dateRange: {
    earliest: Date | null
    latest: Date | null
  }
  byType: Record<string, number>
}
import { transformCSVData, validateTransactions, getTransactionSummary } from './utils'
import { format } from 'date-fns'

export function PreviewStep() {
  const {
    csvData,
    columnMappings,
    mappedTransactions,
    setMappedTransactions,
    validationIssues,
    setValidationIssues,
    setStep,
    setError,
    setIsLoading,
    setLoadingState
  } = useImport()

  const { validateBulkTransactions } = useTransactionLimits()
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [limitValidation, setLimitValidation] = useState<{ allowed: boolean; message: string } | null>(null)

  // Transform and validate data when step loads
  useEffect(() => {
    if (csvData && columnMappings.length > 0) {
      const processData = async () => {
        setIsLoading(true)
        setLoadingState('validating')
        
        try {
          // Transform CSV data using mappings
          const transformed = transformCSVData(csvData, columnMappings)
          setMappedTransactions(transformed)
          
          // Validate transformed transactions
          const issues = validateTransactions(transformed)
          setValidationIssues(issues)
          
          // Generate summary
          const stats = getTransactionSummary(transformed)
          setSummary(stats)

          // Validate transaction limits
          const limitResult = await validateBulkTransactions(transformed.length)
          setLimitValidation({
            allowed: limitResult.allowed,
            message: limitResult.message
          })
          
        } catch (error) {
          console.error('Preview processing error:', error)
          setError(error instanceof Error ? error.message : 'Failed to process transactions')
        } finally {
          setIsLoading(false)
          setLoadingState('idle')
        }
      }

      processData()
    }
  }, [csvData, columnMappings, setMappedTransactions, setValidationIssues, setError, setIsLoading, setLoadingState, validateBulkTransactions])

  // Check if we can proceed (no errors and within transaction limits)
  const canProceed = () => {
    const errorCount = validationIssues.filter(issue => issue.severity === 'error').length
    return errorCount === 0 && 
           mappedTransactions && 
           mappedTransactions.length > 0 &&
           limitValidation?.allowed !== false
  }

  // Handle continue
  const handleContinue = () => {
    if (canProceed()) {
      setStep('confirmation')
    }
  }

  if (!mappedTransactions || !summary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Processing transactions...</div>
      </div>
    )
  }

  const errorCount = validationIssues.filter(issue => issue.severity === 'error').length
  const warningCount = validationIssues.filter(issue => issue.severity === 'warning').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Preview & Validate</h3>
        <p className="text-gray-400 text-sm">
          Review your transactions before importing. All errors must be resolved to proceed.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <div className="text-2xl font-bold text-white">{summary.total}</div>
          <div className="text-sm text-gray-400">Total Transactions</div>
        </div>
        
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <div className={`text-2xl font-bold ${errorCount === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {errorCount}
          </div>
          <div className="text-sm text-gray-400">Errors</div>
        </div>
        
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <div className={`text-2xl font-bold ${warningCount === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
            {warningCount}
          </div>
          <div className="text-sm text-gray-400">Warnings</div>
        </div>
        
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <div className="text-2xl font-bold text-white">
            {summary.dateRange.earliest && summary.dateRange.latest
              ? Math.ceil((summary.dateRange.latest.getTime() - summary.dateRange.earliest.getTime()) / (1000 * 60 * 60 * 24))
              : 0}
          </div>
          <div className="text-sm text-gray-400">Day Span</div>
        </div>
      </div>

      {/* Transaction Type Breakdown */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <h4 className="font-medium text-white mb-3">Transaction Types</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.byType).map(([type, count]) => (
            count > 0 && (
              <Badge key={type} variant="secondary" className="bg-bitcoin-orange/10 text-bitcoin-orange">
                {type}: {count as number}
              </Badge>
            )
          ))}
        </div>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-white">Validation Results</h4>
          
          {errorCount > 0 && (
            <Alert className="border-red-500/20 bg-red-500/5">
              <XCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {errorCount} error(s) found. These must be fixed before importing.
              </AlertDescription>
            </Alert>
          )}
          
          {warningCount > 0 && (
            <Alert className="border-yellow-500/20 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300">
                {warningCount} warning(s) found. Review these items carefully.
              </AlertDescription>
            </Alert>
          )}

          {/* Issues list (first 10) */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {validationIssues.slice(0, 10).map((issue, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  issue.severity === 'error' 
                    ? 'border-red-500/20 bg-red-500/5' 
                    : 'border-yellow-500/20 bg-yellow-500/5'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  {issue.severity === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  )}
                  <span className="text-gray-300">
                    Row {parseInt(issue.transactionId.replace('csv-', '')) + 1}:
                  </span>
                  <span className={issue.severity === 'error' ? 'text-red-300' : 'text-yellow-300'}>
                    {issue.message}
                  </span>
                </div>
              </div>
            ))}
            
            {validationIssues.length > 10 && (
              <div className="text-sm text-gray-400 text-center py-2">
                ... and {validationIssues.length - 10} more issues
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction Limit Validation */}
      {limitValidation && (
        <Alert className={limitValidation.allowed 
          ? "border-green-500/20 bg-green-500/5" 
          : "border-red-500/20 bg-red-500/5"
        }>
          {limitValidation.allowed ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription className={limitValidation.allowed ? "text-green-300" : "text-red-300"}>
            {limitValidation.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Success state */}
      {validationIssues.length === 0 && limitValidation?.allowed && (
        <Alert className="border-green-500/20 bg-green-500/5">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            All transactions validated successfully! Ready to import.
          </AlertDescription>
        </Alert>
      )}

      {/* Sample transactions preview */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <h4 className="font-medium text-white mb-3">Sample Transactions (First 5)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left py-2 text-gray-400">Date</th>
                <th className="text-left py-2 text-gray-400">Type</th>
                <th className="text-left py-2 text-gray-400">Amount</th>
                <th className="text-left py-2 text-gray-400">From/To</th>
                <th className="text-left py-2 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {mappedTransactions.slice(0, 5).map((transaction) => {
                const hasError = validationIssues.some(
                  issue => issue.transactionId === transaction.id && issue.severity === 'error'
                )
                const hasWarning = validationIssues.some(
                  issue => issue.transactionId === transaction.id && issue.severity === 'warning'
                )
                
                return (
                  <tr key={transaction.id} className="border-b border-gray-700/30">
                    <td className="py-2 text-gray-300">
                      {transaction.date ? format(transaction.date, 'MMM dd, yyyy') : 'Invalid'}
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className="capitalize">
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className="py-2 text-gray-300">
                      {transaction.received_amount 
                        ? `+${transaction.received_amount} ${transaction.received_currency || 'BTC'}`
                        : transaction.sent_amount 
                        ? `-${transaction.sent_amount} ${transaction.sent_currency || 'BTC'}`
                        : 'N/A'
                      }
                    </td>
                    <td className="py-2 text-gray-300">
                      {transaction.from_address_name || transaction.to_address_name || 'N/A'}
                    </td>
                    <td className="py-2">
                      {hasError ? (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-400">
                          Error
                        </Badge>
                      ) : hasWarning ? (
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400">
                          Warning
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                          Valid
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline"
          onClick={() => setStep('mapping')}
          className="bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
        >
          Back to Mapping
        </Button>
        
        <Button 
          onClick={handleContinue}
          disabled={!canProceed()}
          className="bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-white disabled:opacity-50"
        >
          Continue to Import
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 