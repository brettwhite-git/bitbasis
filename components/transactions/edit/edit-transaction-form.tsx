"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useEditDrawer } from './edit-drawer-provider'
import { TransactionTypeFields } from '../forms/fields'
import { toast } from 'sonner'
import { UnifiedTransaction } from '@/types/transactions'

// Base schema for all transaction types
const baseTransactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  type: z.enum(['buy', 'sell', 'deposit', 'withdrawal', 'interest']),
  asset: z.string().default('BTC'),
  price: z.number().positive("Price must be positive").optional().nullable(),
  comment: z.string().optional().nullable(),
  from_address_name: z.string().optional().nullable(),
  to_address_name: z.string().optional().nullable(),
  from_address: z.string().optional().nullable(),
  to_address: z.string().optional().nullable(),
  transaction_hash: z.string().optional().nullable(),
})

// Type-specific field extensions
const buyTransactionSchema = baseTransactionSchema.extend({
  sent_amount: z.number().positive("Sent amount must be positive"),
  sent_currency: z.string().min(1, "Sent currency is required"),
  received_amount: z.number().positive("Received amount must be positive"),
  received_currency: z.string().default('BTC'),
  fee_amount: z.number().min(0, "Fee cannot be negative").optional().nullable(),
  fee_currency: z.string().optional().nullable(),
})

const sellTransactionSchema = baseTransactionSchema.extend({
  sent_amount: z.number().positive("Sent amount must be positive"),
  sent_currency: z.string().default('BTC'),
  received_amount: z.number().positive("Received amount must be positive"),
  received_currency: z.string().min(1, "Received currency is required"),
  fee_amount: z.number().min(0, "Fee cannot be negative").optional().nullable(),
  fee_currency: z.string().optional().nullable(),
})

const transferTransactionSchema = baseTransactionSchema.extend({
  sent_amount: z.number().positive().optional().nullable(),
  sent_currency: z.string().optional().nullable(),
  received_amount: z.number().positive().optional().nullable(),
  received_currency: z.string().optional().nullable(),
  fee_amount: z.number().min(0, "Fee cannot be negative").optional().nullable(),
  fee_currency: z.string().optional().nullable(),
})

// Dynamic schema based on transaction type
const getTransactionSchema = (type: string) => {
  switch (type) {
    case 'buy':
      return buyTransactionSchema
    case 'sell':
      return sellTransactionSchema
    case 'deposit':
    case 'withdrawal':
    case 'interest':
      return transferTransactionSchema
    default:
      return baseTransactionSchema
  }
}

type TransactionFormData = z.infer<typeof baseTransactionSchema> & {
  sent_amount?: number | null
  sent_currency?: string | null
  received_amount?: number | null
  received_currency?: string | null
  fee_amount?: number | null
  fee_currency?: string | null
}

interface EditTransactionFormProps {
  transaction: UnifiedTransaction
}

export function EditTransactionForm({ transaction }: EditTransactionFormProps) {
  const { closeDrawer, setIsLoading, setIsDirty } = useEditDrawer()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Create form with dynamic schema based on transaction type
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(getTransactionSchema(transaction.type)),
    defaultValues: {
      date: transaction.date.slice(0, 16), // Format for datetime-local input
      type: transaction.type,
      asset: transaction.asset,
      price: transaction.price,
      comment: transaction.comment,
      from_address_name: transaction.from_address_name,
      to_address_name: transaction.to_address_name,
      from_address: transaction.from_address,
      to_address: transaction.to_address,
      transaction_hash: transaction.transaction_hash,
      sent_amount: transaction.sent_amount,
      sent_currency: transaction.sent_currency,
      received_amount: transaction.received_amount,
      received_currency: transaction.received_currency,
      fee_amount: transaction.fee_amount,
      fee_currency: transaction.fee_currency,
    },
  })

  const { handleSubmit, formState: { isDirty, isSubmitting } } = form
  // watch not used in this component

  // Watch for changes to show unsaved changes indicator
  useEffect(() => {
    setHasUnsavedChanges(isDirty)
    setIsDirty(isDirty)
  }, [isDirty, setIsDirty])

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setIsLoading(true)
      
      // Convert date back to ISO string
      const submissionData = {
        ...data,
        date: new Date(data.date).toISOString(),
      }

      const response = await fetch(`/api/transaction-history/${transaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        throw new Error('Failed to update transaction')
      }

      toast.success('Transaction updated successfully')
      closeDrawer()
      
      // Refresh the transaction list (you may want to implement optimistic updates)
      window.location.reload()
      
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast.error('Failed to update transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      )
      if (!confirmClose) return
    }
    closeDrawer()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <TransactionTypeFields 
            form={form} 
            transactionType={transaction.type}
          />
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sm:pt-6 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-800 h-10 text-sm"
            >
              Cancel
            </Button>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              {hasUnsavedChanges && (
                <span className="text-xs text-yellow-400 order-2 sm:order-1">
                  Unsaved changes
                </span>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="w-full sm:w-auto bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-black font-medium h-10 text-sm order-1 sm:order-2"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
} 