"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// Separator not used in this component
import { 
  ChevronLeft, 
  Trash2, 
  Edit2, 
  Plus, 
  Send, 
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAddTransactionWizard } from '../add-transaction-wizard-context'
import { StagedTransaction, transactionTypeConfigs } from '@/types/add-transaction'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface StagedTransactionCardProps {
  transaction: StagedTransaction
  onEdit: (tempId: string) => void
  onRemove: (tempId: string) => void
}

function StagedTransactionCard({ transaction, onEdit, onRemove }: StagedTransactionCardProps) {
  const config = transactionTypeConfigs[transaction.type]
  
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'buy': return 'bg-green-600/20 text-green-400 border-green-600/30'
      case 'sell': return 'bg-red-600/20 text-red-400 border-red-600/30'
      case 'deposit': return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
      case 'withdrawal': return 'bg-orange-600/20 text-orange-400 border-orange-600/30'
      case 'interest': return 'bg-purple-600/20 text-purple-400 border-purple-600/30'
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30'
    }
  }

  const getTransactionSummary = () => {
    switch (transaction.type) {
      case 'buy':
        return {
          primary: `${transaction.received_amount} BTC`,
          secondary: `for ${formatCurrency(transaction.sent_amount || 0)} ${transaction.sent_currency}`,
          fee: transaction.fee_amount ? `Fee: ${formatCurrency(transaction.fee_amount)} ${transaction.fee_currency}` : null
        }
      case 'sell':
        return {
          primary: `${transaction.sent_amount} BTC`,
          secondary: `for ${formatCurrency(transaction.received_amount || 0)} ${transaction.received_currency}`,
          fee: transaction.fee_amount ? `Fee: ${formatCurrency(transaction.fee_amount)} ${transaction.fee_currency}` : null
        }
      case 'deposit':
        return {
          primary: `${transaction.received_amount} BTC`,
          secondary: transaction.from_address_name ? `from ${transaction.from_address_name}` : 'deposited',
          fee: transaction.fee_amount ? `Network Fee: ${transaction.fee_amount} BTC` : null
        }
      case 'withdrawal':
        return {
          primary: `${transaction.sent_amount} BTC`,
          secondary: transaction.to_address_name ? `to ${transaction.to_address_name}` : 'withdrawn',
          fee: transaction.fee_amount ? `Network Fee: ${transaction.fee_amount} BTC` : null
        }
      case 'interest':
        return {
          primary: `${transaction.received_amount} BTC`,
          secondary: transaction.from_address_name ? `from ${transaction.from_address_name}` : 'interest earned',
          fee: null
        }
      default:
        return { primary: 'Transaction', secondary: '', fee: null }
    }
  }

  const summary = getTransactionSummary()

  return (
    <Card className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm border-gray-700/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge className={cn("text-xs", getBadgeColor(transaction.type))}>
                {transaction.type.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-400">
                {formatDate(transaction.date)}
              </span>
            </div>
            <CardTitle className="text-lg text-white">{config.title}</CardTitle>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(transaction.tempId)}
              className="h-8 w-8 p-0 hover:bg-gray-700/50 text-gray-400 hover:text-white"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(transaction.tempId)}
              className="h-8 w-8 p-0 hover:bg-red-500/20 text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{summary.primary}</span>
          <span className="text-gray-400">{summary.secondary}</span>
        </div>
        
        {summary.fee && (
          <div className="text-sm text-gray-500">{summary.fee}</div>
        )}
        
        {transaction.price && (
          <div className="text-sm text-gray-500">
            Price: ${formatCurrency(transaction.price)}/BTC
          </div>
        )}
        
        {transaction.comment && (
          <div className="text-sm text-gray-400 italic">
            &#34;{transaction.comment}&#34;
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ReviewStagingStep() {
  const { 
    stagedTransactions, 
    isSubmitting, 
    errors,
    prevStep,
    goToStep,
    editStagedTransaction,
    removeFromStaging,
    clearStaging,
    submitTransactions
  } = useAddTransactionWizard()

  const handleAddMore = () => {
    goToStep('type')
  }

  const handleSubmit = async () => {
    await submitTransactions()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Review & Submit</h2>
        <p className="text-gray-400">
          Review your staged transactions before final submission
        </p>
      </div>

      {/* Staged Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Staged Transactions ({stagedTransactions.length})</span>
          </h3>
          
          {stagedTransactions.length > 0 && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddMore}
                className="bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add More
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearStaging}
                className="bg-red-600/20 border-red-600/50 hover:bg-red-600/30 text-red-400 hover:text-red-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {stagedTransactions.length > 0 ? (
          <ScrollArea className="h-[400px] rounded-xl border border-gray-700/30 p-4 bg-gradient-to-br from-gray-800/5 via-gray-900/15 to-gray-800/5 backdrop-blur-sm">
            <div className="space-y-4">
              {stagedTransactions.map((transaction) => (
                <StagedTransactionCard
                  key={transaction.tempId}
                  transaction={transaction}
                  onEdit={editStagedTransaction}
                  onRemove={removeFromStaging}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <Card className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm border-gray-700/30">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="rounded-full bg-gray-700/50 p-3 mx-auto w-fit">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">No Staged Transactions</h3>
                  <p className="text-gray-400 mt-1">
                    Add transactions using the form to stage them for submission
                  </p>
                </div>
                <Button
                  onClick={handleAddMore}
                  className="bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submission Section */}
      {stagedTransactions.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm border-gray-700/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Submit Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
              <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium">Ready to submit {stagedTransactions.length} transaction(s)</p>
                <p className="text-blue-400 mt-1">
                  These transactions will be permanently added to your portfolio once submitted.
                </p>
              </div>
            </div>

            {errors.submit && (
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-red-600/10 border border-red-600/20">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-300">
                  <p className="font-medium">Submission Error</p>
                  <p className="text-red-400 mt-1">{errors.submit}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={isSubmitting}
          className="bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {stagedTransactions.length > 0 && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit All Transactions
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
} 