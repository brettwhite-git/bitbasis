"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { PortfolioDataServiceImpl } from "@/lib/services/portfolio/portfolioDataService"
import { PortfolioDataPoint, TimeRange, ChartDataOptions } from "@/lib/services/portfolio/types"

/**
 * Custom hook for accessing portfolio data
 */
export function usePortfolioData(
  timeRange: TimeRange = "2Y",
  options: Partial<ChartDataOptions> = {}
) {
  const [data, setData] = useState<PortfolioDataPoint[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!userData.user) throw new Error("User not authenticated")

        // Initialize the data service
        const dataService = new PortfolioDataServiceImpl(supabase)

        // Set default options
        const chartOptions: ChartDataOptions = {
          timeRange,
          includeMovingAverages: options.includeMovingAverages ?? true,
          movingAveragePeriods: options.movingAveragePeriods ?? [3, 6],
          resolution: options.resolution ?? 'medium'
        }

        // Fetch the data
        const portfolioData = await dataService.getChartData(
          userData.user.id,
          chartOptions
        )

        setData(portfolioData)
      } catch (err) {
        console.error("Error fetching portfolio data:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch portfolio data"))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, timeRange, options.includeMovingAverages, options.resolution])

  return { data, loading, error }
}

/**
 * Custom hook for accessing summary chart data
 */
export function usePortfolioSummaryData(timeframe: '6M' | '1Y' = '6M') {
  const [data, setData] = useState<PortfolioDataPoint[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!userData.user) throw new Error("User not authenticated")

        // Initialize the data service
        const dataService = new PortfolioDataServiceImpl(supabase)

        // Fetch the data
        const portfolioData = await dataService.getMonthlyData(
          userData.user.id,
          timeframe
        )

        setData(portfolioData)
      } catch (err) {
        console.error("Error fetching summary data:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch summary data"))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, timeframe])

  return { data, loading, error }
} 