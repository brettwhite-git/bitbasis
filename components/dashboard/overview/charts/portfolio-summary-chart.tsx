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
  ChartOptions,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { Button } from "@/components/ui/button"
import { usePortfolioHistory } from "@/lib/hooks/usePortfolioHistory"
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
  const { data: portfolioHistory, loading, error } = usePortfolioHistory()

  // Filter data based on selected timeframe
  const filteredData = (() => {
    if (!portfolioHistory || portfolioHistory.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case "6M":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "1Y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        return portfolioHistory;
    }

    const startMonthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    return portfolioHistory.filter(point => point.month >= startMonthKey);
  })();

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
      tooltip: createPortfolioSummaryTooltipConfig(filteredData),
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
        min: 0,
        beginAtZero: true,
        grace: 0
      }
    },
  }

  const data = {
    labels: filteredData.map(d => {
      const [year, month] = (d.month || '').split('-');
      if (!year || !month) return '';
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'short' });
      const formattedYear = `'${date.toLocaleDateString('en-US', { year: '2-digit' })}`;
      return `${formattedMonth} ${formattedYear}`;
    }),
    datasets: [
      {
        label: "Portfolio Value",
        data: filteredData.map(d => d?.portfolioValue ?? null),
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
        data: filteredData.map(d => d?.costBasis ?? null),
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