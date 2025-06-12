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

interface SellTransactionFieldsProps {
  form: UseFormReturn<any>
}

export function SellTransactionFields({ form }: SellTransactionFieldsProps) {
  return (
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
  )
} 