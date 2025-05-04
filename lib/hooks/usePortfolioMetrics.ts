"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getPortfolioMetrics } from '@/lib/core/portfolio/metrics'
import { PortfolioMetrics } from '@/lib/core/portfolio/types'
import { Database } from '@/types/supabase'

export interface UsePortfolioMetricsResult {
  data: PortfolioMetrics | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function usePortfolioMetrics(): UsePortfolioMetricsResult {
  const [data, setData] = useState<PortfolioMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  // Get the user session directly from Supabase
  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('Fetching user session')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          console.log('User authenticated:', user.id)
          setUserId(user.id)
        } else {
          console.log('No authenticated user found')
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching session:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch session'))
        setLoading(false)
      }
    }

    fetchSession()
  }, [supabase])

  const fetchMetrics = async () => {
    console.log('fetchMetrics called, userId:', userId)
    
    if (!userId) {
      console.log('No user ID available, skipping fetch')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('Fetching portfolio metrics for user:', userId)
      const metrics = await getPortfolioMetrics(userId, supabase)
      console.log('Received metrics:', metrics)
      setData(metrics)
    } catch (err) {
      console.error('Error fetching portfolio metrics:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio metrics'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      console.log('User ID changed, fetching metrics for:', userId)
      fetchMetrics()
    }
  }, [userId])

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics
  }
} 