"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { useSupabase } from "@/components/providers/supabase-provider"
import { ApexOptions } from 'apexcharts'

// Dynamically import ApexCharts with no SSR to avoid window is not defined errors
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

// Updated interface to match 'orders' table structure
interface Order {
  date: string
  type: 'buy' | 'sell'
  received_btc_amount: number | null // For buys
  sell_btc_amount: number | null // For sells
}

// Interface for the heatmap data structure
interface HeatmapData {
  name: string // Year
  data: { x: string, y: number }[] // Month and value
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Function to process orders and calculate monthly buy/sell balances
function calculateMonthlyTransactions(orders: Order[]): HeatmapData[] {
  const yearMonthData = new Map<string, Map<string, { buys: number, sells: number }>>()
  
  // Process each order
  orders.forEach(order => {
    const date = new Date(order.date)
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
    
    // Count buys and sells separately
    if (order.type === 'buy' && order.received_btc_amount) {
      currentStats.buys += 1
    } else if (order.type === 'sell' && order.sell_btc_amount) {
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
  const { supabase } = useSupabase()

  useEffect(() => {
    async function fetchOrders() {
      // Fetch from 'orders' table and select necessary columns
      const { data: orders, error } = await supabase
        .from('orders')
        .select('date, type, received_btc_amount, sell_btc_amount')
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching orders:', error)
        return
      }

      // Ensure orders is not null before calculating
      if (orders && orders.length > 0) {
        // Filter and validate order types to match the 'buy' | 'sell' union type
        const validOrders = orders.filter(
          (order): order is Order => 
            order.type === 'buy' || order.type === 'sell'
        )
        
        const calculatedData = calculateMonthlyTransactions(validOrders)
        setHeatmapData(calculatedData)
      } else {
        console.log("No orders found.")
        setHeatmapData([]) // Set empty data if no orders
      }
    }

    fetchOrders()
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
        size: 8
      },
      formatter: function(seriesName, opts) {
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
    tooltip: {
      theme: 'dark',
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const data = w.config.series[seriesIndex].data[dataPointIndex];
        const year = w.config.series[seriesIndex].name;
        const month = data.x;
        const buys = data.buys || 0;
        const sells = data.sells || 0;
        const net = data.net;
        
        return `
          <div class="px-3 py-2 bg-gray-800 rounded shadow">
            <div class="text-white font-semibold mb-1">${month} ${year}</div>
            <div class="grid grid-cols-2 gap-x-4">
              <div class="text-white">Buys:</div>
              <div style="color: #F7931A">${buys}</div>
              <div class="text-white">Sells:</div>
              <div style="color: #E53E3E">${sells}</div>
            </div>
          </div>
        `;
      }
    }
  }

  // Return loading state if no data yet
  if (heatmapData.length === 0) {
    return (
      <div className="h-[375px] w-full flex items-center justify-center text-foreground">
        <p>Loading transaction data...</p>
      </div>
    )
  }

  return (
    <div className="h-[375px] w-full text-foreground">
      {typeof window !== 'undefined' && (
        <ReactApexChart
          options={options}
          series={heatmapData}
          type="heatmap"
          height={375}
        />
      )}
    </div>
  )
} 