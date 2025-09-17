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
  ChartOptions,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { usePortfolioHistory } from "@/lib/hooks"
import { createPortfolioSummaryTooltipConfig } from "@/lib/utils/chart-tooltip-config"

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

interface PortfolioSummaryChartProps {
  timeframe: "6M" | "1Y"
}

export function PortfolioSummaryChart({ timeframe }: PortfolioSummaryChartProps) {
  const { data: allPortfolioData, loading, error } = usePortfolioHistory()

  // Filter data based on timeframe
  const portfolioData = useMemo(() => {
    if (!allPortfolioData || allPortfolioData.length === 0) return []
    
    const now = new Date()
    let cutoffDate: Date
    
    if (timeframe === '6M') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    } else { // '1Y'
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    }
    
    return allPortfolioData.filter(dataPoint => {
      const pointDate = new Date(dataPoint.date)
      return pointDate >= cutoffDate
    })
  }, [allPortfolioData, timeframe])

  // Chart options
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#fff",
          padding: 10,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: createPortfolioSummaryTooltipConfig(portfolioData as unknown as Record<string, unknown>[]),
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: "#374151",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: "#374151",
        },
        ticks: {
          color: "#9ca3af",
          callback: function(value) {
            if (typeof value !== 'number') return '';
            return `$${value.toLocaleString()}`
          },
          autoSkip: true,
          maxTicksLimit: 8,
          includeBounds: true
        },
        beginAtZero: true,
        grace: 0
      }
    },
  }

  const data = {
    labels: portfolioData.map(d => {
      const date = new Date(d.date);
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'short' });
      const formattedYear = `'${date.toLocaleDateString('en-US', { year: '2-digit' })}`;
      return `${formattedMonth} ${formattedYear}`;
    }),
    datasets: [
      {
        label: "Portfolio Value",
        data: portfolioData.map(d => d.portfolioValue),
        borderColor: "#F7931A", // Bitcoin Orange
        backgroundColor: "rgba(247, 147, 26, 0.2)", // Semi-transparent Bitcoin Orange
        pointBackgroundColor: "#F7931A", // Solid color for tooltip indicator
        pointBorderColor: "#F7931A", // Solid color for tooltip indicator
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBorderWidth: 1,
        spanGaps: true,
      },
      {
        label: "Cost Basis",
        data: portfolioData.map(d => d.costBasis),
        borderColor: "#3b82f6", // Blue-500
        backgroundColor: "rgba(59, 130, 246, 0.2)", // Semi-transparent Blue
        pointBackgroundColor: "#3b82f6", // Solid color for tooltip indicator
        pointBorderColor: "#3b82f6", // Solid color for tooltip indicator
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBorderWidth: 1,
        spanGaps: true,
      }
    ],
  }

  if (loading) {
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-bitcoin-orange border-opacity-50 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <p className="text-red-500">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <Line options={options} data={data} />
    </div>
  )
} 