"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { UnifiedTransaction } from '@/types/transactions'

/**
 * A hook for fetching transaction data from the unified transactions table
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const supabase = createClientComponentClient<Database>()
        
        // Fetch from unified transactions table
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })

        if (transactionsError) throw transactionsError

        // Use transactions data directly as UnifiedTransaction[]
        // Database query already returns the correct UnifiedTransaction structure
        const unifiedTransactions: UnifiedTransaction[] = (transactionsData || []).map(tx => ({
          id: tx.id,
          created_at: tx.created_at,
          updated_at: tx.updated_at,
          user_id: tx.user_id,
          date: tx.date,
          type: tx.type,
          asset: tx.asset,
          sent_amount: tx.sent_amount,
          sent_currency: tx.sent_currency,
          sent_cost_basis: tx.sent_cost_basis,
          from_address: tx.from_address,
          from_address_name: tx.from_address_name,
          to_address: tx.to_address,
          to_address_name: tx.to_address_name,
          received_amount: tx.received_amount,
          received_currency: tx.received_currency,
          received_cost_basis: tx.received_cost_basis,
          fee_amount: tx.fee_amount,
          fee_currency: tx.fee_currency,
          fee_cost_basis: tx.fee_cost_basis,
          realized_return: tx.realized_return,
          fee_realized_return: tx.fee_realized_return,
          transaction_hash: tx.transaction_hash,
          comment: tx.comment,
          price: tx.price,
          csv_upload_id: tx.csv_upload_id
        }))

        setTransactions(unifiedTransactions)
      } catch (err: unknown) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const refetch = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClientComponentClient<Database>()
      
      // Fetch from unified transactions table
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      if (transactionsError) throw transactionsError

      // Use transactions data directly as UnifiedTransaction[] 
      const unifiedTransactions: UnifiedTransaction[] = (transactionsData || []).map(tx => ({
        id: tx.id,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
        user_id: tx.user_id,
        date: tx.date,
        type: tx.type,
        asset: tx.asset,
        sent_amount: tx.sent_amount,
        sent_currency: tx.sent_currency,
        sent_cost_basis: tx.sent_cost_basis,
        from_address: tx.from_address,
        from_address_name: tx.from_address_name,
        to_address: tx.to_address,
        to_address_name: tx.to_address_name,
        received_amount: tx.received_amount,
        received_currency: tx.received_currency,
        received_cost_basis: tx.received_cost_basis,
        fee_amount: tx.fee_amount,
        fee_currency: tx.fee_currency,
        fee_cost_basis: tx.fee_cost_basis,
        realized_return: tx.realized_return,
        fee_realized_return: tx.fee_realized_return,
        transaction_hash: tx.transaction_hash,
        comment: tx.comment,
        price: tx.price,
        csv_upload_id: tx.csv_upload_id
      }))

      setTransactions(unifiedTransactions)
    } catch (err: unknown) {
      console.error('Error refetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh transactions')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    transactions,
    isLoading,
    error,
    refetch
  }
} 