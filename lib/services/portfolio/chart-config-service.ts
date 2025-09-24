/**
 * ChartConfigService
 * 
 * Service for generating chart configurations for portfolio charts
 */

import { 
  ChartConfigService, 
  PortfolioDataPoint, 
  ChartDataOptions
} from "./types"
import { ChartOptions } from "chart.js"
import { 
  createPortfolioSummaryTooltipConfig, 
  createPerformanceTooltipConfig 
} from "@/lib/utils/chart-tooltip-config"

export class ChartConfigServiceImpl implements ChartConfigService {
  /**
   * Creates configuration for portfolio summary chart
   */
  createSummaryChartConfig(data: PortfolioDataPoint[]) {
    // Generate labels from data points
    const labels = data.map(d => {
      const date = new Date(d.date)
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'short' })
      const formattedYear = `'${date.toLocaleDateString('en-US', { year: '2-digit' })}`
      return `${formattedMonth} ${formattedYear}`
    })

    // Generate datasets
    const datasets = [
      {
        label: "Portfolio Value",
        data: data.map(d => d.portfolioValue),
        borderColor: "#F7931A", // Bitcoin Orange
        backgroundColor: "rgba(247, 147, 26, 0.2)", // Semi-transparent Bitcoin Orange
        tension: 0.4,
        fill: true,
        pointRadius: 4
      },
      {
        label: "Cost Basis",
        data: data.map(d => d.costBasis),
        borderColor: "#3b82f6", // Blue-500
        backgroundColor: "rgba(59, 130, 246, 0.2)", // Semi-transparent Blue
        tension: 0.4,
        fill: true,
        pointRadius: 4
      }
    ]

    // Generate chart options
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
        tooltip: createPortfolioSummaryTooltipConfig(data),
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
              return `$${value.toLocaleString()}`
            },
          },
          min: 0, // Start from 0
          beginAtZero: true // Ensure axis starts at 0
        }
      },
    }

    return {
      data: {
        labels,
        datasets
      },
      options
    }
  }

  /**
   * Creates configuration for performance chart
   */
  createPerformanceChartConfig(data: PortfolioDataPoint[], options: ChartDataOptions) {
    // Generate labels from data points
    const labels = data.map(d => {
      const date = new Date(d.date)
      // Format based on time range for appropriate label density
      if (options.timeRange === '5Y' || options.timeRange === 'ALL') {
        // Show only month and year for long time ranges
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        const year = date.toLocaleDateString('en-US', { year: 'numeric' })
        return `${month} ${year}`
      } else {
        // Show more detailed date for shorter ranges
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        const day = date.getDate()
        const year = date.getFullYear()
        return `${month} ${day}, ${year}`
      }
    })

    // Build datasets
    const datasets = []
    
    // Portfolio value dataset
    datasets.push({
      label: "Portfolio Value",
      data: data.map(d => d.portfolioValue),
      borderColor: "#F7931A", // Bitcoin Orange
      backgroundColor: "rgba(247, 147, 26, 0.1)",
      tension: 0.4,
      fill: false,
      pointRadius: this.calculatePointRadius(data.length),
      pointHoverRadius: 6,
    })
    
    // Calculate moving averages if requested
    if (options.includeMovingAverages) {
      // Default to 3-month and 6-month MAs if not specified
      const periods = options.movingAveragePeriods || [3, 6]
      
      // Define colors for moving averages
      const maColors = {
        3: { border: "#A855F7", background: "rgba(168, 85, 247, 0.1)" }, // Purple for 3-month
        6: { border: "#06B6D4", background: "rgba(6, 182, 212, 0.1)" },  // Cyan for 6-month
        12: { border: "#EC4899", background: "rgba(236, 72, 153, 0.1)" } // Pink for 12-month
      }
      
      // Add each requested moving average
      periods.forEach(period => {
        const values = this.calculateMovingAverage(data.map(d => d.portfolioValue), period)
        const color = maColors[period as keyof typeof maColors] || { 
          border: "#888888", 
          background: "rgba(136, 136, 136, 0.1)" 
        }
        
        datasets.push({
          label: `${period}-Month Moving Average`,
          data: values,
          borderColor: color.border,
          backgroundColor: color.background,
          tension: 0.4,
          fill: false,
          pointRadius: 0, // Hide points for smoother lines
          borderDash: period > 6 ? [5, 5] : [], // Dashed line for longer periods
        })
      })
    }
    
    // Add cost basis if requested
    datasets.push({
      label: "Cost Basis",
      data: data.map(d => d.costBasis),
      borderColor: "#3b82f6", // Blue
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      tension: 0.4,
      fill: false,
      pointRadius: 0, // Hide points
    })

    // Chart options
    const chartOptions: ChartOptions<"line"> = {
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
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: createPerformanceTooltipConfig(),
      },
      scales: {
        x: {
          grid: {
            color: "#374151",
          },
          ticks: {
            color: "#9ca3af",
            // Limit the number of labels shown based on data length
            maxTicksLimit: this.calculateMaxTicks(data.length, options.timeRange),
          },
        },
        y: {
          grid: {
            color: "#374151",
          },
          ticks: {
            color: "#9ca3af",
            callback: function(value) {
              return `$${value.toLocaleString()}`
            },
          },
          beginAtZero: true
        }
      },
    }

    return {
      data: {
        labels,
        datasets
      },
      options: chartOptions
    }
  }

  /**
   * Calculates moving average from array of values
   */
  private calculateMovingAverage(data: (number | null)[], windowSize: number): (number | null)[] {
    const result: (number | null)[] = []
    const validData = data.map(d => d === null ? NaN : d) // Treat null as NaN for calculations

    for (let i = 0; i < validData.length; i++) {
      if (i < windowSize - 1) {
        result.push(null) // Not enough data for a full window
      } else {
        const windowSlice = validData.slice(i - windowSize + 1, i + 1)
        const validWindowValues = windowSlice.filter(v => !isNaN(v))
        if (validWindowValues.length > 0) {
          const sum = validWindowValues.reduce((acc, val) => acc + val, 0)
          result.push(sum / validWindowValues.length)
        } else {
          result.push(null) // No valid data in window
        }
      }
    }
    return result
  }

  /**
   * Calculates appropriate point radius based on data length
   */
  private calculatePointRadius(dataLength: number): number {
    if (dataLength > 100) return 0 // Hide points for large datasets
    if (dataLength > 50) return 2 // Small points for medium datasets
    return 4 // Normal points for small datasets
  }

  /**
   * Calculates maximum number of ticks for x-axis based on data length
   */
  private calculateMaxTicks(dataLength: number, timeRange: string): number {
    if (timeRange === 'ALL' || timeRange === '5Y') return 12 // Show about 1 tick per month for long periods
    if (timeRange === '3Y' || timeRange === '2Y') return 18 // More ticks for medium periods
    if (timeRange === '1Y') return 24 // Even more for 1 year
    return 12 // Default for shorter periods (6M)
  }
} 