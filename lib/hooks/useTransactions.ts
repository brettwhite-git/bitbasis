"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { UnifiedTransaction } from '@/types/transactions'

/**
 * A hook for fetching transaction data from Supabase
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
        
        // Fetch orders and transfers in parallel
        const [ordersResult, transfersResult] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: false }),
          supabase
            .from('transfers')
            .select('*')
            .order('date', { ascending: false })
        ])

        if (ordersResult.error) throw ordersResult.error
        if (transfersResult.error) throw transfersResult.error

        // Map orders to unified format
        const mappedOrders = (ordersResult.data || []).map(order => ({
          id: `order-${order.id}`,
          date: order.date,
          type: order.type === 'buy' ? 'buy' : 'sell',
          asset: order.asset,
          btc_amount: order.type === 'buy' ? order.received_btc_amount : order.sell_btc_amount,
          usd_value: order.type === 'buy' ? order.buy_fiat_amount : order.received_fiat_amount,
          fee_usd: order.service_fee,
          price_at_tx: order.price,
          exchange: order.exchange,
          network_fee_btc: null,
          txid: null
        }))

        // Map transfers to unified format
        const mappedTransfers = (transfersResult.data || []).map(transfer => ({
          id: `transfer-${transfer.id}`,
          date: transfer.date,
          type: transfer.type === 'withdrawal' ? 'withdrawal' : 'deposit',
          asset: transfer.asset || 'BTC',
          btc_amount: transfer.amount_btc,
          usd_value: transfer.amount_fiat,
          fee_usd: transfer.fee_amount_btc ? transfer.fee_amount_btc * (transfer.price || 0) : null,
          price_at_tx: transfer.price,
          exchange: null,
          network_fee_btc: transfer.fee_amount_btc,
          txid: transfer.hash
        }))

        // Combine all transactions
        const allTransactions = [...mappedOrders, ...mappedTransfers].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        setTransactions(allTransactions)
      } catch (err: any) {
        console.error('Error fetching transactions:', err)
        setError(err.message || 'Failed to load transactions')
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
      
      // Fetch orders and transfers in parallel
      const [ordersResult, transfersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('transfers')
          .select('*')
          .order('date', { ascending: false })
      ])

      if (ordersResult.error) throw ordersResult.error
      if (transfersResult.error) throw transfersResult.error

      // Map orders to unified format
      const mappedOrders = (ordersResult.data || []).map(order => ({
        id: `order-${order.id}`,
        date: order.date,
        type: order.type === 'buy' ? 'buy' : 'sell',
        asset: order.asset,
        btc_amount: order.type === 'buy' ? order.received_btc_amount : order.sell_btc_amount,
        usd_value: order.type === 'buy' ? order.buy_fiat_amount : order.received_fiat_amount,
        fee_usd: order.service_fee,
        price_at_tx: order.price,
        exchange: order.exchange,
        network_fee_btc: null,
        txid: null
      }))

      // Map transfers to unified format
      const mappedTransfers = (transfersResult.data || []).map(transfer => ({
        id: `transfer-${transfer.id}`,
        date: transfer.date,
        type: transfer.type === 'withdrawal' ? 'withdrawal' : 'deposit',
        asset: transfer.asset || 'BTC',
        btc_amount: transfer.amount_btc,
        usd_value: transfer.amount_fiat,
        fee_usd: transfer.fee_amount_btc ? transfer.fee_amount_btc * (transfer.price || 0) : null,
        price_at_tx: transfer.price,
        exchange: null,
        network_fee_btc: transfer.fee_amount_btc,
        txid: transfer.hash
      }))

      // Combine all transactions
      const allTransactions = [...mappedOrders, ...mappedTransfers].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      setTransactions(allTransactions)
    } catch (err: any) {
      console.error('Error refetching transactions:', err)
      setError(err.message || 'Failed to refresh transactions')
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