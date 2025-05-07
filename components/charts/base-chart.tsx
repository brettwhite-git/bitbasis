"use client"

import { useState, useEffect } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { BaseChartProps, ChartDataOptions } from "@/lib/services/portfolio/types"
import { useSupabase } from "@/components/providers/supabase-provider"
import { PortfolioDataServiceImpl } from "@/lib/services/portfolio/portfolioDataService"
import { ChartConfigServiceImpl } from "@/lib/services/portfolio/chartConfigService"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Define a type that can handle either ChartDataOptions or a Chart.js config
interface ChartJsConfig {
  data: ChartData<'line'>;
  options: ChartOptions<'line'>;
}

export function BasePortfolioChart({
  data: initialData = [],
  options: chartOptions,
  height = 300,
  width = "100%",
  className = "",
}: BaseChartProps) {
  const [chartData, setChartData] = useState<any>(initialData)
  const [chartConfig, setChartConfig] = useState<ChartJsConfig | null>(null)
  const [loading, setLoading] = useState<boolean>(initialData && initialData.length > 0 ? false : true)
  const { supabase } = useSupabase()

  // Initialize services
  const dataService = new PortfolioDataServiceImpl(supabase)
  const configService = new ChartConfigServiceImpl()

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      // If data is provided, just use it
      setChartData(initialData)
      setLoading(false)
    }
  }, [initialData])

  // Effect to configure chart when data is available
  useEffect(() => {
    if (!chartData || chartData.length === 0) return

    // Use the provided chart options if available
    if (chartOptions) {
      // Check if this is a chart.js config with data and options properties
      if (typeof chartOptions === 'object' && 'data' in chartOptions && 'options' in chartOptions) {
        // It's a Chart.js config object
        setChartConfig(chartOptions as ChartJsConfig)
      } else {
        // It's ChartDataOptions, so generate config
        try {
          const generatedConfig = configService.createSummaryChartConfig(chartData)
          setChartConfig(generatedConfig)
        } catch (error) {
          console.error("Error generating chart config from options:", error)
          setChartConfig(createDefaultConfig(chartData))
        }
      }
      return
    }

    // If no specific config provided, use the ChartConfigService
    try {
      const generatedConfig = configService.createSummaryChartConfig(chartData)
      setChartConfig(generatedConfig)
    } catch (error) {
      console.error("Error generating chart config:", error)
      setChartConfig(createDefaultConfig(chartData))
    }
  }, [chartData, chartOptions, configService])

  // Default config fallback
  const createDefaultConfig = (data: any[]): ChartJsConfig => {
    return {
      data: {
        labels: data.map((d: any) => d.month || ''),
        datasets: [
          {
            label: "Value",
            data: data.map((d: any) => d.portfolioValue || 0),
            borderColor: "#F7931A",
            backgroundColor: "rgba(247, 147, 26, 0.2)",
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }
  }

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-black/20 animate-pulse ${className}`}
        style={{ height, width }}
      >
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    )
  }

  if (!chartConfig || !chartData || chartData.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-black/10 ${className}`}
        style={{ height, width }}
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ height, width }}
    >
      <Line data={chartConfig.data} options={chartConfig.options} />
    </div>
  )
} 