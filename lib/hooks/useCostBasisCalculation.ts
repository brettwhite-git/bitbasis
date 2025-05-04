"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { calculateCostBasis } from '@/lib/core/portfolio/cost-basis'

export type CostBasisMethod = 'FIFO' | 'LIFO' | 'Average Cost'

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

export function useCostBasisCalculation(
  initialMethod: CostBasisMethod = 'Average Cost'
): UseCostBasisCalculationResult {
  const [data, setData] = useState<CostBasisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [method, setMethod] = useState<CostBasisMethod>(initialMethod)
  const [userId, setUserId] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
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

  // Fetch orders and price data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        return
      }

      try {
        setLoading(true)
        console.log('useCostBasisCalculation: Fetching orders and price for user:', userId)
        
        // Fetch orders and price in parallel
        const [ordersResult, priceResult] = await Promise.all([
          supabase
            .from('orders')
            .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price')
            .eq('user_id', userId)
            .order('date', { ascending: true }),
          supabase
            .from('spot_price')
            .select('price_usd, updated_at')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()
        ])

        if (ordersResult.error) throw ordersResult.error
        if (priceResult.error) throw priceResult.error

        const fetchedOrders = ordersResult.data || []
        if (!priceResult.data) throw new Error('No Bitcoin price available')
        
        setOrders(fetchedOrders)
        setCurrentPrice(priceResult.data.price_usd)
        
        // Perform initial calculation
        await calculateWithMethod(fetchedOrders, priceResult.data.price_usd, method)
      } catch (err) {
        console.error('useCostBasisCalculation: Error fetching data:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, supabase])

  // Recalculate when method changes
  useEffect(() => {
    if (orders.length > 0 && currentPrice > 0) {
      calculateWithMethod(orders, currentPrice, method)
    }
  }, [method])

  const calculateWithMethod = async (orders: any[], price: number, method: CostBasisMethod) => {
    try {
      console.log(`useCostBasisCalculation: Calculating using ${method} method`)
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      const result = await calculateCostBasis(userId, method, orders, price)
      setData(result)
    } catch (err) {
      console.error(`useCostBasisCalculation: Error calculating ${method}:`, err)
      setError(err instanceof Error ? err : new Error(`Failed to calculate ${method}`))
    }
  }

  const refetch = () => {
    if (userId) {
      setLoading(true)
      fetchData()
    }
  }

  const fetchData = async () => {
    if (!userId) return
    
    try {
      // Fetch orders and price in parallel
      const [ordersResult, priceResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price')
          .eq('user_id', userId)
          .order('date', { ascending: true }),
        supabase
          .from('spot_price')
          .select('price_usd, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
      ])

      if (ordersResult.error) throw ordersResult.error
      if (priceResult.error) throw priceResult.error

      const fetchedOrders = ordersResult.data || []
      if (!priceResult.data) throw new Error('No Bitcoin price available')
      
      setOrders(fetchedOrders)
      setCurrentPrice(priceResult.data.price_usd)
      
      // Perform calculation
      await calculateWithMethod(fetchedOrders, priceResult.data.price_usd, method)
    } catch (err) {
      console.error('useCostBasisCalculation: Error in refetch:', err)
      setError(err instanceof Error ? err : new Error('Failed to refetch data'))
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    method,
    setMethod,
    refetch
  }
} 