"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getPerformanceMetrics } from '@/lib/core/portfolio/performance'
import { Database } from '@/types/supabase'

export interface PerformanceData {
  cumulative: {
    total: { percent: number; dollar: number }
    day: { percent: number; dollar: number }
    week: { percent: number; dollar: number }
    month: { percent: number | null; dollar: number | null }
    ytd: { percent: number | null; dollar: number | null }
    threeMonth: { percent: number | null; dollar: number | null }
    twoYear: { percent: number | null; dollar: number | null }
    fourYear: { percent: number | null; dollar: number | null }
    year: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
  compoundGrowth: {
    total: number | null
    oneYear: number | null
    twoYear: number | null
    threeYear: number | null
    fourYear: number | null
    fiveYear: number | null
    sixYear: number | null
    sevenYear: number | null
    eightYear: number | null
  }
  allTimeHigh?: { price: number; date: string }
  maxDrawdown?: { 
    percent: number
    fromDate: string
    toDate: string
    portfolioATH: number
    portfolioLow: number
  }
  hodlTime?: number
  currentPrice?: number
  averageBuyPrice?: number
  lowestBuyPrice?: number
  highestBuyPrice?: number
}

interface UsePerformanceMetricsReturn {
  data: PerformanceData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePerformanceMetrics(): UsePerformanceMetricsReturn {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  // Get the user session directly from Supabase
  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('usePerformanceMetrics: Fetching user session')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          console.log('usePerformanceMetrics: User authenticated:', user.id)
          setUserId(user.id)
        } else {
          console.log('usePerformanceMetrics: No authenticated user found')
          setLoading(false)
        }
      } catch (err) {
        console.error('usePerformanceMetrics: Error fetching session:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch session')
        setLoading(false)
      }
    }

    fetchSession()
  }, [supabase])

  const fetchData = useCallback(async () => {
    if (!userId) {
      console.log('usePerformanceMetrics: No user ID available, skipping fetch')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('usePerformanceMetrics: Fetching metrics for user:', userId)

      // Fetch performance metrics
      const metrics = await getPerformanceMetrics(userId, supabase)
      console.log('usePerformanceMetrics: Received metrics:', metrics)

      // Transform the metrics to the PerformanceData format
      const performanceData: PerformanceData = {
        cumulative: metrics.cumulative,
        compoundGrowth: metrics.compoundGrowth,
        allTimeHigh: metrics.allTimeHigh,
        maxDrawdown: metrics.maxDrawdown,
        hodlTime: metrics.hodlTime,
        currentPrice: metrics.currentPrice,
        averageBuyPrice: metrics.averageBuyPrice,
        lowestBuyPrice: metrics.lowestBuyPrice,
        highestBuyPrice: metrics.highestBuyPrice
      }

      setData(performanceData)
    } catch (err) {
      console.error('usePerformanceMetrics: Error fetching performance metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch performance metrics')
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (userId) {
      console.log('usePerformanceMetrics: User ID changed, fetching metrics for:', userId)
      fetchData()
    }
  }, [userId, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
} 