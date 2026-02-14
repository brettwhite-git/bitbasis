"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MonthlyPortfolioCalculator } from '@/lib/core/portfolio/monthly-calculator'

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
  const supabase = createClient()
  
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

  const fetchPortfolioHistory = useCallback(async () => {
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
      
      // Use the new monthly calculator
      const calculator = new MonthlyPortfolioCalculator(supabase)
      const monthlyData = await calculator.calculateMonthlyData(userId, { timeRange: 'ALL' })
      
      // Convert MonthlyPortfolioData to PortfolioHistoryPoint format
      const historyPoints: PortfolioHistoryPoint[] = monthlyData.map(data => ({
        date: data.date.toISOString(),
        month: data.month,
        portfolioValue: data.portfolioValue,
        costBasis: data.costBasis,
        btcAmount: data.cumulativeBTC,
        btcPrice: data.btcPrice
      }))
      
      console.log(`Processed ${historyPoints.length} portfolio history points`)
      setData(historyPoints)
      
    } catch (err) {
      console.error('Error fetching portfolio history:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio history'))
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  // Fetch data when userId changes
  useEffect(() => {
    if (userId) {
      fetchPortfolioHistory()
    }
  }, [userId, fetchPortfolioHistory])

  const refetch = () => {
    if (userId) {
      fetchPortfolioHistory()
    }
  }

  return {
    data,
    loading,
    error,
    refetch
  }
} 