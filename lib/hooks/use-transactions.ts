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

        // Map database transactions to unified format
        const mappedTransactions = (transactionsData || []).map(tx => {
          // Determine primary BTC amount based on transaction type
          let btc_amount: number | null = null
          let usd_value: number | null = null

          switch (tx.type) {
            case 'buy':
              btc_amount = tx.received_amount
              usd_value = tx.sent_amount
              break
            case 'sell':
              btc_amount = tx.sent_amount
              usd_value = tx.received_amount
              break
            case 'deposit':
              btc_amount = tx.received_amount
              usd_value = tx.received_amount && tx.price ? tx.received_amount * tx.price : null
              break
            case 'withdrawal':
              btc_amount = tx.sent_amount
              usd_value = tx.sent_amount && tx.price ? tx.sent_amount * tx.price : null
              break
            default:
              btc_amount = tx.received_amount || tx.sent_amount
              usd_value = null
          }

          return {
            id: `tx-${tx.id}`,
            date: tx.date,
            type: tx.type as 'buy' | 'sell' | 'deposit' | 'withdrawal',
            asset: tx.asset,
            btc_amount,
            usd_value,
            fee_usd: tx.fee_currency === 'USD' ? tx.fee_amount : null,
            price_at_tx: tx.price,
            exchange: tx.from_address_name || tx.to_address_name,
            network_fee_btc: tx.fee_currency === 'BTC' ? tx.fee_amount : null,
            txid: tx.transaction_hash
          }
        })

        setTransactions(mappedTransactions)
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

      // Map database transactions to unified format
      const mappedTransactions = (transactionsData || []).map(tx => {
        // Determine primary BTC amount based on transaction type
        let btc_amount: number | null = null
        let usd_value: number | null = null

        switch (tx.type) {
          case 'buy':
            btc_amount = tx.received_amount
            usd_value = tx.sent_amount
            break
          case 'sell':
            btc_amount = tx.sent_amount
            usd_value = tx.received_amount
            break
          case 'deposit':
            btc_amount = tx.received_amount
            usd_value = tx.received_amount && tx.price ? tx.received_amount * tx.price : null
            break
          case 'withdrawal':
            btc_amount = tx.sent_amount
            usd_value = tx.sent_amount && tx.price ? tx.sent_amount * tx.price : null
            break
          default:
            btc_amount = tx.received_amount || tx.sent_amount
            usd_value = null
        }

        return {
          id: `tx-${tx.id}`,
          date: tx.date,
          type: tx.type as 'buy' | 'sell' | 'deposit' | 'withdrawal',
          asset: tx.asset,
          btc_amount,
          usd_value,
          fee_usd: tx.fee_currency === 'USD' ? tx.fee_amount : null,
          price_at_tx: tx.price,
          exchange: tx.from_address_name || tx.to_address_name,
          network_fee_btc: tx.fee_currency === 'BTC' ? tx.fee_amount : null,
          txid: tx.transaction_hash
        }
      })

      setTransactions(mappedTransactions)
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