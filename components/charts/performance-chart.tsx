"use client"

import { useState, createContext, useContext } from "react"
import { BasePortfolioChart } from "./base-chart"
import { TimeRange } from "@/lib/services/portfolio/types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui"
import { usePerformanceData } from "@/lib/hooks/use-performance-data"

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
  height = 300,
  width = "100%",
  className = ""
}: {
  height?: number
  width?: string
  className?: string
}) {
  // TODO: Get actual user ID from auth context
  const { isLoading: loading, error } = usePerformanceData('')

  if (error) {
    return (
      <div className="flex items-center justify-center h-60 bg-black/10 rounded-md">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60 bg-black/10 rounded-md">
        <div className="animate-spin h-8 w-8 border-4 border-bitcoin-orange border-opacity-50 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <BasePortfolioChart
      data={[]} // TODO: Convert performance data to PortfolioDataPoint format
      height={height}
      width={width}
      className={className}
    />
  )
} 