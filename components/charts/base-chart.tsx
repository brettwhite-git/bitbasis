"use client"

import { useMemo } from "react"
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
import { PortfolioDataPoint, TimeRange } from "@/lib/services/portfolio/types"
import { formatChartDate, getAxisRotation } from "@/lib/services/portfolio/chart-utils"

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

interface BasePortfolioChartProps {
  data: PortfolioDataPoint[]
  height?: number
  width?: string
  className?: string
  timeRange?: TimeRange
}

export function BasePortfolioChart({
  data = [],
  height = 300,
  width = "100%",
  className = "",
  timeRange = "2Y",
}: BasePortfolioChartProps) {
  // Generate chart configuration from data
  const chartConfig = useMemo<{
    data: ChartData<'line'>
    options: ChartOptions<'line'>
  } | null>(() => {
    if (!data || data.length === 0) {
      return null
    }

    const rotation = getAxisRotation(timeRange)

    return {
      data: {
        labels: data.map(d => formatChartDate(new Date(d.date))),
        datasets: [
          {
            label: "Portfolio Value",
            data: data.map(d => d.portfolioValue),
            borderColor: "#F7931A", // Bitcoin Orange
            backgroundColor: "rgba(247, 147, 26, 0.2)",
            pointBackgroundColor: "#F7931A",
            pointBorderColor: "#F7931A",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBorderWidth: 1,
            spanGaps: true,
          },
          {
            label: "Cost Basis",
            data: data.map(d => d.costBasis),
            borderColor: "#3b82f6", // Blue-500
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#3b82f6",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBorderWidth: 1,
            spanGaps: true,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index" as const,
          intersect: false,
        },
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              color: "#fff",
              padding: 10,
              usePointStyle: true,
              pointStyle: "circle" as const,
            },
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#F7931A",
            borderWidth: 1,
            displayColors: true,
            callbacks: {
              title: function(context: Array<{ label?: string }>) {
                return context[0]?.label || ''
              },
              label: function(context: { dataset: { label?: string }, parsed: { y: number | null } }) {
                const label = context.dataset.label || ''
                const value = context.parsed.y ?? 0
                return `${label}: $${value.toLocaleString()}`
              }
            }
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              color: "#374151",
            },
            ticks: {
              color: "#9ca3af",
              maxRotation: rotation.maxRotation,
              minRotation: rotation.minRotation,
            },
          },
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            grid: {
              color: "#374151",
            },
            ticks: {
              color: "#9ca3af",
              callback: function(value: string | number) {
                if (typeof value !== 'number') return ''
                return `$${value.toLocaleString()}`
              },
              autoSkip: true,
              maxTicksLimit: 8,
              includeBounds: true
            },
            min: 0,
            beginAtZero: true,
            grace: 0
          }
        },
      }
    }
  }, [data, timeRange])

  if (!data || data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-black/10 rounded-md ${className}`}
        style={{ height, width }}
      >
        <p className="text-muted-foreground">No portfolio data available</p>
      </div>
    )
  }

  if (!chartConfig) {
    return (
      <div 
        className={`flex items-center justify-center bg-black/20 animate-pulse rounded-md ${className}`}
        style={{ height, width }}
      >
        <div className="animate-spin h-8 w-8 border-4 border-bitcoin-orange border-opacity-50 rounded-full border-t-transparent"></div>
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