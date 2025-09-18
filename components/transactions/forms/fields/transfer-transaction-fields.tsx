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

interface TransferTransactionFieldsProps {
  form: UseFormReturn<TransactionWizardData>
  transactionType: 'deposit' | 'withdrawal' | 'interest'
}

export function TransferTransactionFields({ form, transactionType }: TransferTransactionFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Amount */}
        <FormField
          control={form.control}
          name={transactionType === 'deposit' || transactionType === 'interest' ? "received_amount" : "sent_amount"}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">
                {transactionType === 'deposit' ? 'BTC Received' : 
                 transactionType === 'withdrawal' ? 'BTC Sent' : 'Interest Earned (BTC)'}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.1"
                  className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                  {...field}
                  onChange={(e) => {
                    field.onChange(parseFloat(e.target.value) || 0)
                    // Set currency to BTC automatically for deposits/withdrawals/interest
                    if (transactionType === 'deposit' || transactionType === 'interest') {
                      form.setValue('received_currency', 'BTC')
                    } else {
                      form.setValue('sent_currency', 'BTC')
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* BTC Price */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">BTC Price (USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="40000.00"
                  className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormDescription className="text-gray-400 text-xs">
                Price per BTC in USD at time of transaction
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* From/To Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <FormField
          control={form.control}
          name="from_address_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">From</FormLabel>
              <FormControl>
                <Input
                  placeholder="Exchange, Personal Wallet"
                  className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="to_address_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">To</FormLabel>
              <FormControl>
                <Input
                  placeholder="Personal Wallet, Cold Storage"
                  className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Address Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <FormField
          control={form.control}
          name="from_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">From Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="bc1q..."
                  className="bg-gray-800 border-gray-700 text-white font-mono text-sm h-10"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="to_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">To Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="bc1q..."
                  className="bg-gray-800 border-gray-700 text-white font-mono text-sm h-10"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Transaction Hash (only for deposits and withdrawals) */}
      {(transactionType === 'deposit' || transactionType === 'withdrawal') && (
        <FormField
          control={form.control}
          name="transaction_hash"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white text-sm">Transaction Hash</FormLabel>
              <FormControl>
                <Input
                  placeholder="Transaction ID from blockchain"
                  className="bg-gray-800 border-gray-700 text-white font-mono text-sm h-10"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription className="text-gray-400 text-xs">
                Blockchain transaction ID for verification
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Network Fee (only for withdrawals) */}
      {transactionType === 'withdrawal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <FormField
            control={form.control}
            name="fee_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-sm">Network Fee (BTC)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.00000001"
                    placeholder="0.0001"
                    className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value) || undefined)
                      // Set fee currency to BTC automatically for withdrawals
                      form.setValue('fee_currency', 'BTC')
                    }}
                  />
                </FormControl>
                <FormDescription className="text-gray-400 text-xs">
                  Bitcoin network transaction fee paid
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-center">
            <span className="text-sm text-gray-400">
              Network fees are paid in BTC only
            </span>
          </div>
        </div>
      )}
    </>
  )
} 