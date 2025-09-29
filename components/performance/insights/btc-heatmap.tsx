"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { useSupabase } from "@/components/providers/supabase-provider"
import { ApexOptions } from 'apexcharts'
import { createBtcHeatmapTooltipConfig } from "@/lib/utils/chart-tooltip-config"

// Dynamically import ApexCharts with no SSR to avoid window is not defined errors
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

// Updated interface to match unified transactions table structure
interface Transaction {
  date: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  sent_amount: number | null
  sent_currency: string | null
  received_amount: number | null
  received_currency: string | null
}

// Interface for the heatmap data structure
interface HeatmapData {
  name: string // Year
  data: { x: string, y: number }[] // Month and value
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Function to process transactions and calculate monthly buy/sell balances
function calculateMonthlyTransactions(transactions: Transaction[]): HeatmapData[] {
  const yearMonthData = new Map<string, Map<string, { buys: number, sells: number }>>()
  
  // Process each transaction
  transactions.forEach(transaction => {
    const date = new Date(transaction.date)
    const year = date.getFullYear().toString()
    const month = MONTHS[date.getMonth()] as string // Assert month as string since we know MONTHS array is fixed
    
    // Initialize year and month if they don't exist
    if (!yearMonthData.has(year)) {
      yearMonthData.set(year, new Map<string, { buys: number, sells: number }>())
    }
    
    const monthlyData = yearMonthData.get(year)!
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { buys: 0, sells: 0 })
    }
    
    const currentStats = monthlyData.get(month)!
    
    // Count buys and sells separately using unified schema
    if (transaction.type === 'buy' && transaction.received_currency === 'BTC' && transaction.received_amount) {
      currentStats.buys += 1
    } else if (transaction.type === 'sell' && transaction.sent_currency === 'BTC' && transaction.sent_amount) {
      currentStats.sells += 1
    }
    
    monthlyData.set(month, currentStats)
  })
  
  // Convert the map structure to the format needed for ApexCharts
  return Array.from(yearMonthData.entries())
    .map(([year, monthData]) => ({
      name: year,
      data: MONTHS.map(month => {
        const stats = monthData.get(month) || { buys: 0, sells: 0 }
        
        // Calculate net value (positive for more buys, negative for more sells, 0 for equal or none)
        const netValue = stats.buys - stats.sells
        
        // Use simple categorization: 1 for buys, -1 for sells, 0 for no activity
        let category = 0
        if (netValue > 0) {
          category = 1 // Net buys
        } else if (netValue < 0) {
          category = -1 // Net sells
        }
        
        return {
          x: month,
          y: category,
          buys: stats.buys,
          sells: stats.sells,
          net: netValue
        }
      })
    }))
    .sort((a, b) => parseInt(a.name) - parseInt(b.name)) // Sort by year ascending
}

export function BtcHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { supabase } = useSupabase()

  // Create placeholder data for consistent chart structure
  const getPlaceholderData = (): HeatmapData[] => {
    const currentYear = new Date().getFullYear()
    const years = [currentYear - 2, currentYear - 1, currentYear]
    
    return years.map(year => ({
      name: year.toString(),
      data: MONTHS.map(month => ({ x: month, y: 0 }))
    }))
  }

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true)
      
      try {
        // Fetch from 'transactions' table and select necessary columns
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('date, type, sent_amount, sent_currency, received_amount, received_currency')
          .in('type', ['buy', 'sell']) // Only include buy and sell transactions for this chart
          .order('date', { ascending: true })

        if (error) {
          console.error('Error fetching transactions:', error)
          setHeatmapData(getPlaceholderData())
          return
        }

        // Ensure transactions is not null before calculating
        if (transactions && transactions.length > 0) {
          // Filter and validate transaction types to match the 'buy' | 'sell' union type
          const validTransactions = transactions.filter(
            (transaction): transaction is Transaction => 
              transaction.type === 'buy' || transaction.type === 'sell'
          )
          
          const calculatedData = calculateMonthlyTransactions(validTransactions)
          setHeatmapData(calculatedData.length > 0 ? calculatedData : getPlaceholderData())
        } else {
          console.log("No transactions found.")
          setHeatmapData(getPlaceholderData()) // Set placeholder data if no transactions
        }
      } catch (error) {
        console.error('Error in fetchTransactions:', error)
        setHeatmapData(getPlaceholderData())
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [supabase])

  // Chart options for the heatmap
  const options: ApexOptions = {
    chart: {
      type: 'heatmap',
      background: 'transparent',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      heatmap: {
        enableShades: false,
        radius: 2,
        distributed: false,
        colorScale: {
          ranges: [
            {
              from: 1,
              to: 1,
              color: '#F7931A', // Bitcoin orange 
              name: 'Buys'
            },
            {
              from: -1,
              to: -1,
              color: '#E53E3E', // Error red
              name: 'Sells'
            },
            {
              from: 0,
              to: 0,
              color: '#1F2937', // gray-800 - blends with glass morphism background
              name: 'No Activity'
            }
          ]
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 1.3,
      colors: ['#374151'] // gray-700 - subtle border that complements glass morphism
    },
    title: {
      text: '',
      align: 'center',
      style: {
        color: '#FFFFFF', // Foreground color as hex
        fontWeight: 600,
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      offsetY: 10,
      labels: {
        colors: '#FFFFFF' // Foreground color as hex
      },
      markers: {
        size: 8,
        shape: 'circle' as const,
        strokeWidth: 0
      },
      formatter: function(seriesName) {
        return `<span style="padding-left: 5px;">${seriesName}</span>`
      }
    },
    xaxis: {
      labels: {
        style: {
          colors: Array(12).fill('#FFFFFF') // Foreground color as hex
        }
      },
      tooltip: {
        enabled: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: Array(heatmapData.length).fill('#FFFFFF') // Foreground color as hex
        }
      }
    },
    tooltip: createBtcHeatmapTooltipConfig()
  }

  // Use either loaded data or placeholder for consistent display
  const displayData = heatmapData.length > 0 ? heatmapData : getPlaceholderData()

  // Update chart options to show loading state
  const chartOptions: ApexOptions = {
    ...options,
    chart: {
      ...options.chart,
      animations: {
        enabled: !isLoading,
        speed: 800,
      }
    },
    plotOptions: {
      ...options.plotOptions,
      heatmap: {
        ...options.plotOptions?.heatmap,
        colorScale: {
          ...options.plotOptions?.heatmap?.colorScale,
          ranges: isLoading ? [
            { from: 0, to: 0, color: 'rgba(247, 147, 26, 0.1)' }
          ] : options.plotOptions?.heatmap?.colorScale?.ranges
        }
      }
    }
  }

  return (
    <div className="h-[375px] w-full text-foreground relative">
      {typeof window !== 'undefined' && (
        <ReactApexChart
          options={chartOptions}
          series={displayData}
          type="heatmap"
          height={375}
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl">
          <div className="text-white/80 text-sm">Loading transaction data...</div>
        </div>
      )}
    </div>
  )
} 