"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export interface PortfolioHistoryPoint {
  date: string
  portfolioValue: number
  costBasis: number
  btcPrice: number
  btcAmount: number
  month: string // YYYY-MM format
}

export interface UsePortfolioHistoryResult {
  data: PortfolioHistoryPoint[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function usePortfolioHistory(): UsePortfolioHistoryResult {
  const [data, setData] = useState<PortfolioHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()
  
  // Get user session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('usePortfolioHistory: Fetching user session')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          console.log('usePortfolioHistory: User authenticated:', user.id)
          setUserId(user.id)
        } else {
          console.log('usePortfolioHistory: No authenticated user found')
          setLoading(false)
        }
      } catch (err) {
        console.error('usePortfolioHistory: Error fetching session:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch session'))
        setLoading(false)
      }
    }

    fetchSession()
  }, [supabase])

  const fetchPortfolioHistory = async () => {
    console.log('fetchPortfolioHistory called, userId:', userId)
    
    if (!userId) {
      console.log('No user ID available, skipping fetch')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('Fetching portfolio history for user:', userId)
      
      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price')
        .eq('user_id', userId)
        .order('date', { ascending: true })
      
      if (ordersError) throw ordersError
      
      // Fetch current BTC price 
      const { data: currentPrice, error: priceError } = await supabase
        .from('spot_price')
        .select('price_usd, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (priceError) throw priceError
      
      // Process orders to create portfolio history
      if (!orders || orders.length === 0) {
        setData([])
        setLoading(false)
        return
      }
      
      // Process each order chronologically to build monthly data points
      const monthlyDataMap = new Map<string, PortfolioHistoryPoint>()
      let runningBtcBalance = 0
      let runningCostBasis = 0
      let lastPrice = currentPrice.price_usd
      
      // Define date range (from first transaction to current month)
      const firstTxDate = new Date(orders[0].date)
      const currentDate = new Date()
      const startMonthDate = new Date(firstTxDate.getFullYear(), firstTxDate.getMonth(), 1)
      const endMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      // Pre-fill monthly buckets
      let currentMonthPointer = new Date(startMonthDate)
      while (currentMonthPointer <= endMonthDate) {
        const monthKey = `${currentMonthPointer.getFullYear()}-${String(currentMonthPointer.getMonth() + 1).padStart(2, '0')}`
        monthlyDataMap.set(monthKey, {
          date: currentMonthPointer.toISOString(),
          month: monthKey,
          portfolioValue: 0,
          costBasis: 0,
          btcAmount: 0,
          btcPrice: lastPrice
        })
        // Move to next month
        currentMonthPointer = new Date(currentMonthPointer.getFullYear(), currentMonthPointer.getMonth() + 1, 1)
      }
      
      // Process transactions
      orders.forEach(order => {
        if (!order.date) return // Skip if date is null
        
        const txDate = new Date(order.date)
        const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
        
        // Update price if available
        if (order.price) {
          lastPrice = order.price
        }
        
        // Update portfolio based on transaction type
        if (order.type === 'buy' && order.received_btc_amount) {
          runningBtcBalance += order.received_btc_amount
          
          // Add to cost basis (including fees)
          if (order.buy_fiat_amount) {
            runningCostBasis += order.buy_fiat_amount
          }
          if (order.service_fee && order.service_fee_currency === 'USD') {
            runningCostBasis += order.service_fee
          }
        } else if (order.type === 'sell' && order.sell_btc_amount) {
          // Cost basis reduction is proportional to BTC sold
          const btcBeforeSell = runningBtcBalance
          if (btcBeforeSell > 0) {
            const proportionSold = Math.min(1, order.sell_btc_amount / btcBeforeSell)
            runningCostBasis = runningCostBasis * (1 - proportionSold)
          }
          
          // Reduce BTC balance
          runningBtcBalance = Math.max(0, runningBtcBalance - order.sell_btc_amount)
        }
        
        // Update monthly data
        const dataPoint = monthlyDataMap.get(monthKey)
        if (dataPoint) {
          dataPoint.btcAmount = runningBtcBalance
          dataPoint.costBasis = runningCostBasis
          dataPoint.btcPrice = lastPrice
          dataPoint.portfolioValue = runningBtcBalance * lastPrice
        }
      })
      
      // Fill forward values for months without transactions
      let prevDataPoint: PortfolioHistoryPoint | null = null
      const sortedMonthKeys = Array.from(monthlyDataMap.keys()).sort()
      
      for (const monthKey of sortedMonthKeys) {
        const dataPoint = monthlyDataMap.get(monthKey)
        if (!dataPoint) continue
        
        if (prevDataPoint && dataPoint.btcAmount === 0 && dataPoint.costBasis === 0) {
          // Fill forward from previous month
          dataPoint.btcAmount = prevDataPoint.btcAmount
          dataPoint.costBasis = prevDataPoint.costBasis
          dataPoint.portfolioValue = dataPoint.btcAmount * lastPrice
        }
        
        prevDataPoint = { ...dataPoint }
      }
      
      // Add a final point with current price
      const finalMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const finalDataPoint = monthlyDataMap.get(finalMonthKey)
      if (finalDataPoint) {
        finalDataPoint.btcPrice = currentPrice.price_usd
        finalDataPoint.portfolioValue = finalDataPoint.btcAmount * currentPrice.price_usd
      }
      
      // Convert map to array and sort
      const historyPoints = Array.from(monthlyDataMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      setData(historyPoints)
    } catch (err) {
      console.error('Error fetching portfolio history:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio history'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      console.log('User ID changed, fetching portfolio history for:', userId)
      fetchPortfolioHistory()
    }
  }, [userId])

  return {
    data,
    loading,
    error,
    refetch: fetchPortfolioHistory
  }
} 