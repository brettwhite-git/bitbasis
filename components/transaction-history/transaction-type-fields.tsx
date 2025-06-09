"use client"

import { UseFormReturn } from 'react-hook-form'
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
import { Badge } from '@/components/ui/badge'

interface TransactionTypeFieldsProps {
  form: UseFormReturn<any>
  transactionType: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
}

export function TransactionTypeFields({ form, transactionType }: TransactionTypeFieldsProps) {
  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BTC']

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

      {/* Buy Transaction Fields */}
      {transactionType === 'buy' && (
        <>
          {/* Sent Amount (Fiat) - Full width since currency is fixed as USD */}
          <FormField
            control={form.control}
            name="sent_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-sm">Fiat Sent (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                    {...field}
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value) || 0)
                      // Set currency to USD automatically
                      form.setValue('sent_currency', 'USD')
                    }}
                  />
                </FormControl>
                <FormDescription className="text-gray-400 text-xs">
                  Amount in US Dollars
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Received Amount (BTC) */}
            <FormField
              control={form.control}
              name="received_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-sm">BTC Received</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.00000001"
                      placeholder="0.025"
                      className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value) || 0)
                        // Set received currency to BTC automatically
                        form.setValue('received_currency', 'BTC')
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
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
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

          {/* Platform/Exchange Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <FormField
              control={form.control}
              name="from_address_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-sm">Exchange/Platform</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Coinbase, River, etc."
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
                  <FormLabel className="text-white text-sm">Destination</FormLabel>
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
        </>
      )}

      {/* Sell Transaction Fields */}
      {transactionType === 'sell' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Sent Amount (BTC) */}
            <FormField
              control={form.control}
              name="sent_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-sm">BTC Sold</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.00000001"
                      placeholder="0.025"
                      className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value) || 0)
                        // Set sent currency to BTC automatically
                        form.setValue('sent_currency', 'BTC')
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
                      placeholder="45000.00"
                      className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Received Amount (Fiat) - Full width since currency is fixed as USD */}
          <FormField
            control={form.control}
            name="received_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-sm">Fiat Received (USD)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1125.00"
                    className="bg-gray-800 border-gray-700 text-white h-10 text-base"
                    {...field}
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value) || 0)
                      // Set received currency to USD automatically
                      form.setValue('received_currency', 'USD')
                    }}
                  />
                </FormControl>
                <FormDescription className="text-gray-400 text-xs">
                  Amount received in US Dollars
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Platform/Exchange Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <FormField
              control={form.control}
              name="from_address_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-sm">Source</FormLabel>
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

            <FormField
              control={form.control}
              name="to_address_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white text-sm">Exchange/Platform</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Coinbase, River, etc."
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
        </>
      )}

      {/* Deposit/Withdrawal/Interest Fields */}
      {(transactionType === 'deposit' || transactionType === 'withdrawal' || transactionType === 'interest') && (
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
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
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
                      placeholder="Exchange, Mining Pool, etc."
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
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || null)
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
      )}

      {/* Fee Information for Buy/Sell transactions only */}
      {(transactionType === 'buy' || transactionType === 'sell') && (
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
    </div>
  )
} 