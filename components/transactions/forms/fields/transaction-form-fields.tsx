"use client"

import { UseFormReturn } from 'react-hook-form'
import { TransactionWizardData } from '@/types/add-transaction'
import { Badge } from '@/components/ui/badge'

// Import our extracted field components
import { BuyTransactionFields } from './buy-transaction-fields'
import { SellTransactionFields } from './sell-transaction-fields'
import { TransferTransactionFields } from './transfer-transaction-fields'
import { CommonTransactionFields } from './common-transaction-fields'

interface TransactionFormFieldsProps {
  form: UseFormReturn<TransactionWizardData>
  transactionType: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
}

export function TransactionFormFields({ form, transactionType }: TransactionFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Header with transaction type badge */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-medium text-white">Transaction Details</h3>
        <Badge variant="outline" className="capitalize">
          {transactionType}
        </Badge>
      </div>

      {/* Date & Time */}
      <CommonTransactionFields 
        form={form} 
        transactionType={transactionType}
        showDateField={true}
        showFeeFields={false}
        showCommentField={false}
      />

      {/* Transaction Type Specific Fields */}
      {transactionType === 'buy' && (
        <BuyTransactionFields form={form} />
      )}

      {transactionType === 'sell' && (
        <SellTransactionFields form={form} />
      )}

      {(transactionType === 'deposit' || transactionType === 'withdrawal' || transactionType === 'interest') && (
        <TransferTransactionFields form={form} transactionType={transactionType} />
      )}

      {/* Fee and Comments */}
      <CommonTransactionFields 
        form={form} 
        transactionType={transactionType}
        showDateField={false}
        showFeeFields={true}
        showCommentField={true}
      />
    </div>
  )
}

// Re-export for backward compatibility (keeping the old name)
export { TransactionFormFields as TransactionTypeFields } 