"use client"

import { useState, useEffect, useMemo } from "react"
import { BasePortfolioChart } from "./base-chart"
import { useSupabase } from "@/components/providers/supabase-provider"
import { PortfolioDataServiceImpl } from "@/lib/services/portfolio/portfolioDataService"
import { ChartConfigServiceImpl } from "@/lib/services/portfolio/chartConfigService"
import { PortfolioSummaryChartProps, PortfolioDataPoint } from "@/lib/services/portfolio/types"
import { Button } from "@/components/ui/button"

export function PortfolioSummaryChart({
  data: initialData,
  timeframe = "6M",
  height = 300,
  width = "100%",
  className = "",
}: PortfolioSummaryChartProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<"6M" | "1Y">(timeframe)
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
        
        // Fetch portfolio data
        const chartData = await dataService.getMonthlyData(
          authData.user.id,
          activeTimeframe
        )
        
        setData(chartData)
      } catch (err) {
        console.error("Error fetching portfolio data:", err)
        setError("Failed to load chart data")
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [supabase, activeTimeframe, initialData, dataService])

  // Create chart configuration
  const chartConfig = useMemo(() => {
    if (data.length === 0) return undefined;
    
    // Get the chart.js config from the service
    const config = configService.createSummaryChartConfig(data);
    
    // Return it as is - the BasePortfolioChart component will handle it correctly
    return config;
  }, [data, configService]);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: "6M" | "1Y") => {
    setActiveTimeframe(newTimeframe)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Portfolio Summary</h3>
        <div className="flex space-x-2">
          <Button
            variant={activeTimeframe === "6M" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeframeChange("6M")}
          >
            6M
          </Button>
          <Button
            variant={activeTimeframe === "1Y" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeframeChange("1Y")}
          >
            1Y
          </Button>
        </div>
      </div>
      
      {error ? (
        <div className="flex items-center justify-center h-60 bg-black/10 rounded-md">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <BasePortfolioChart
          data={data}
          options={chartConfig}
          height={height}
          width={width}
          className={className}
        />
      )}
    </div>
  )
} 