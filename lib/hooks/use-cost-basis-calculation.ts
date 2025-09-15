"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { calculateCostBasis } from '@/lib/core/portfolio/cost-basis'

export type CostBasisMethod = 'FIFO' | 'LIFO' | 'HIFO'

export interface CostBasisResult {
  totalCostBasis: number
  averageCost: number
  unrealizedGain: number
  unrealizedGainPercent: number
  potentialTaxLiabilityST: number
  potentialTaxLiabilityLT: number
  realizedGains: number
  remainingBtc: number
}

export interface UseCostBasisCalculationResult {
  data: CostBasisResult | null
  loading: boolean
  error: Error | null
  method: CostBasisMethod
  setMethod: (method: CostBasisMethod) => void
  refetch: () => void
}

// Unified transaction type for the new schema
interface UnifiedTransaction {
  id: number
  date: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  sent_amount: number | null
  sent_currency: string | null
  received_amount: number | null
  received_currency: string | null
  fee_amount: number | null
  fee_currency: string | null
  price: number | null
}

export function useCostBasisCalculation(
  initialMethod: CostBasisMethod = 'HIFO'
): UseCostBasisCalculationResult {
  const [data, setData] = useState<CostBasisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [method, setMethod] = useState<CostBasisMethod>(initialMethod)
  const [userId, setUserId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  
  const supabase = createClientComponentClient<Database>()

  // Get the user session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('useCostBasisCalculation: Fetching user session')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          console.log('useCostBasisCalculation: User authenticated:', user.id)
          setUserId(user.id)
        } else {
          console.log('useCostBasisCalculation: No authenticated user found')
          setLoading(false)
        }
      } catch (err) {
        console.error('useCostBasisCalculation: Error fetching session:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch session'))
        setLoading(false)
      }
    }

    fetchSession()
  }, [supabase])

  // Memoize the calculateWithMethod function to prevent infinite loops
  const calculateWithMethod = useCallback(async (transactions: UnifiedTransaction[], price: number, method: CostBasisMethod) => {
    try {
      console.log(`useCostBasisCalculation: Calculating using ${method} method`)
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      // Transform unified transactions to legacy order format for calculateCostBasis function
      const legacyOrders = transactions
        .filter(tx => tx.type === 'buy' || tx.type === 'sell')
        .map(tx => ({
          id: tx.id,
          date: tx.date,
          type: tx.type,
          received_btc_amount: tx.type === 'buy' ? tx.received_amount : null,
          buy_fiat_amount: tx.type === 'buy' ? tx.sent_amount : null,
          service_fee: tx.fee_amount && tx.fee_currency === 'USD' ? tx.fee_amount : null,
          service_fee_currency: tx.fee_currency === 'USD' ? 'USD' : null,
          sell_btc_amount: tx.type === 'sell' ? tx.sent_amount : null,
          received_fiat_amount: tx.type === 'sell' ? tx.received_amount : null,
          price: tx.price
        }))
      
      const result = await calculateCostBasis(userId, method, legacyOrders, price)
      setData(result)
    } catch (err) {
      console.error(`useCostBasisCalculation: Error calculating ${method}:`, err)
      setError(err instanceof Error ? err : new Error(`Failed to calculate ${method}`))
    }
  }, [userId]) // Only depend on userId since other params are passed directly

  const refetch = () => {
    if (userId) {
      setLoading(true)
      fetchData()
    }
  }

  // Memoize fetchData to prevent infinite loops
  const fetchData = useCallback(async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      console.log('useCostBasisCalculation: Fetching transactions and price for user:', userId)
      
      // Fetch transactions and price in parallel
      const [transactionsResult, priceResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, date, type, sent_amount, sent_currency, received_amount, received_currency, fee_amount, fee_currency, price')
          .eq('user_id', userId)
          .order('date', { ascending: true }),
        supabase
          .from('spot_price')
          .select('price_usd, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
      ])

      if (transactionsResult.error) throw transactionsResult.error
      if (priceResult.error) throw priceResult.error

      const fetchedTransactions = transactionsResult.data || []
      if (!priceResult.data) throw new Error('No Bitcoin price available')
      
      setTransactions(fetchedTransactions)
      setCurrentPrice(priceResult.data.price_usd)
      
      // Don't call calculateWithMethod here - let the separate useEffect handle it
      // This prevents circular dependency: fetchData -> calculateWithMethod -> fetchData
    } catch (err) {
      console.error('useCostBasisCalculation: Error fetching data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
    } finally {
      setLoading(false)
    }
  }, [userId, supabase, method]) // Removed calculateWithMethod from dependencies

  // Fetch transactions and price data when userId changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Perform initial calculation when data is first loaded
  useEffect(() => {
    if (transactions.length > 0 && currentPrice > 0 && !data) {
      calculateWithMethod(transactions, currentPrice, method)
    }
  }, [transactions, currentPrice, method, calculateWithMethod, data])

  // Recalculate when method changes (but only if we already have data)
  useEffect(() => {
    if (transactions.length > 0 && currentPrice > 0 && data) {
      calculateWithMethod(transactions, currentPrice, method)
    }
  }, [method, calculateWithMethod, transactions, currentPrice, data])

  return {
    data,
    loading,
    error,
    method,
    setMethod,
    refetch
  }
} 