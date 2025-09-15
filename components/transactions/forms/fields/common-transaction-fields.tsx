"use client"

import { UseFormReturn } from 'react-hook-form'
import { TransactionWizardData } from '@/types/add-transaction'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CommonTransactionFieldsProps {
  form: UseFormReturn<TransactionWizardData>
  transactionType: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  showDateField?: boolean
  showFeeFields?: boolean
  showCommentField?: boolean
}

export function CommonTransactionFields({ 
  form, 
  transactionType,
  showDateField = true,
  showFeeFields = true,
  showCommentField = true
}: CommonTransactionFieldsProps) {
  return (
    <>
      {/* Date & Time */}
      {showDateField && (
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Date & Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Fee Information for Buy/Sell transactions only */}
      {showFeeFields && (transactionType === 'buy' || transactionType === 'sell') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <FormField
            control={form.control}
            name="fee_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-sm">Exchange Fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="0.0001"
                    className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fee_currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-sm">Fee Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white h-10">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-gray-400 text-xs">
                  Exchange fees can be in USD or BTC
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Comments/Notes */}
      {showCommentField && (
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this transaction..."
                  className="bg-gray-800 border-gray-700 text-white resize-none h-20 text-base"
                  rows={3}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  )
} 