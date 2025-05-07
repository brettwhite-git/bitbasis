"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { BasePortfolioChart } from "./base-chart"
import { useSupabase } from "@/components/providers/supabase-provider"
import { PortfolioDataServiceImpl } from "@/lib/services/portfolio/portfolioDataService"
import { ChartConfigServiceImpl } from "@/lib/services/portfolio/chartConfigService"
import { PerformanceChartProps, PortfolioDataPoint, TimeRange, ChartDataOptions } from "@/lib/services/portfolio/types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui"

// Create context for chart period
type ChartContextType = {
  period: TimeRange
  setPeriod: (period: TimeRange) => void
}

const ChartContext = createContext<ChartContextType>({
  period: "2Y",
  setPeriod: () => {}
})

// Hook to access chart context
const useChartContext = () => useContext(ChartContext)

// Period filter component
export function PerformanceFilters() {
  const { period, setPeriod } = useChartContext()
  
  return (
    <Tabs value={period} onValueChange={(value) => setPeriod(value as TimeRange)} className="w-fit">
      <TabsList className="grid grid-cols-5">
        <TabsTrigger value="1Y">1Y</TabsTrigger>
        <TabsTrigger value="2Y">2Y</TabsTrigger>
        <TabsTrigger value="3Y">3Y</TabsTrigger>
        <TabsTrigger value="5Y">5Y</TabsTrigger>
        <TabsTrigger value="ALL">ALL</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// Context provider component
export function PerformanceContainer({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const [period, setPeriod] = useState<TimeRange>("2Y")
  
  return (
    <ChartContext.Provider value={{ period, setPeriod }}>
      <div className={className}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

// Main chart component
export function PerformanceChart({
  data: initialData,
  options,
  height = 300,
  width = "100%",
  className = "",
  showMovingAverages = true,
  showCostBasis = true
}: PerformanceChartProps) {
  const { period } = useChartContext()
  const [data, setData] = useState<PortfolioDataPoint[]>(initialData || [])
  const [loading, setLoading] = useState<boolean>(!initialData)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()
  
  // Initialize services
  const dataService = new PortfolioDataServiceImpl(supabase)
  const configService = new ChartConfigServiceImpl()

  // Fetch data if not provided
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(initialData)
      setLoading(false)
      return
    }

    async function fetchChartData() {
      try {
        setLoading(true)
        setError(null)
        
        // Get auth user data
        const { data: authData } = await supabase.auth.getUser()
        if (!authData.user) {
          setError("User not authenticated")
          setLoading(false)
          return
        }
        
        // Configure chart options
        const chartOptions: ChartDataOptions = {
          timeRange: period,
          includeMovingAverages: showMovingAverages,
          movingAveragePeriods: [3, 6], // 3 month and 6 month MAs
          resolution: 'medium'
        }
        
        // Fetch portfolio data
        const chartData = await dataService.getChartData(
          authData.user.id,
          chartOptions
        )
        
        setData(chartData)
      } catch (err) {
        console.error("Error fetching performance data:", err)
        setError("Failed to load chart data")
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [supabase, period, initialData, dataService, showMovingAverages])

  // Create chart configuration
  const chartOptions: ChartDataOptions = {
    timeRange: period,
    includeMovingAverages: showMovingAverages,
  }
  
  const chartConfig = data.length > 0
    ? configService.createPerformanceChartConfig(data, chartOptions)
    : null

  if (error) {
    return (
      <div className="flex items-center justify-center h-60 bg-black/10 rounded-md">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <BasePortfolioChart
      data={data}
      options={chartOptions}
      height={height}
      width={width}
      className={className}
    />
  )
} 