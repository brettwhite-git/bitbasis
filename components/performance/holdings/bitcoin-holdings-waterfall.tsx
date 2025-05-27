"use client"

import { useState, useEffect } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import { useSupabase } from "@/components/providers/supabase-provider"
import { createBitcoinHoldingsTooltipConfig } from "@/lib/utils/chart-tooltip-config"
// Removed Card imports - using glass morphism styling

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Interface to match orders table structure
interface Order {
  date: string
  type: 'buy' | 'sell'
  received_btc_amount: number | null // For buys
  sell_btc_amount: number | null // For sells
  price: number // Needed for calculations
}

interface YearlyHolding {
  year: string
  amount: number
}

interface WaterfallDataPoint {
  year: string
  start: number
  end: number
}

function calculateBitcoinByYear(orders: Order[]): YearlyHolding[] {
  const yearlyData = new Map<string, number>()

  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate BTC holdings by year
  sortedOrders.forEach(order => {
    const year = new Date(order.date).getFullYear().toString()
    const currentBTC = yearlyData.get(year) || 0

    if (order.type === 'buy') {
      yearlyData.set(year, currentBTC + (order.received_btc_amount || 0))
    } else if (order.type === 'sell') {
      yearlyData.set(year, currentBTC - (order.sell_btc_amount || 0))
    }
  })

  // Convert to array and sort by year
  return Array.from(yearlyData.entries())
    .map(([year, amount]) => ({
      year,
      amount
    }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year))
}

function convertToWaterfallData(yearlyHoldings: YearlyHolding[]): WaterfallDataPoint[] {
  let cumulativeTotal = 0
  
  return yearlyHoldings.map(holding => {
    const start = cumulativeTotal
    cumulativeTotal += holding.amount
    const end = cumulativeTotal
    
    return {
      year: holding.year,
      start,
      end
    }
  })
}

// Generate colors based on whether yearly BTC amount is positive or negative
function generateColors(yearlyData: YearlyHolding[]): string[] {
  // Define constant colors using hex values instead of CSS variables
  const BITCOIN_ORANGE = '#F7931A'; 
  const NEGATIVE_RED = '#E53E3E';
  
  // Assign orange for positive accumulation, red for negative
  return yearlyData.map(data => {
    return data.amount >= 0 ? BITCOIN_ORANGE : NEGATIVE_RED;
  });
}

// Format BTC with appropriate number of decimal places
function formatBTC(amount: number): string {
  if (amount >= 1) {
    return `${amount.toFixed(4)} BTC`
  } else {
    const sats = Math.round(amount * 100000000)
    return `${amount.toFixed(8)} BTC (${sats.toLocaleString()} sats)`
  }
}

const options: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: createBitcoinHoldingsTooltipConfig(),
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#9CA3AF",
      },
      title: {
        display: false,
        text: 'Year',
        color: '#9CA3AF',
        padding: {top: 10, bottom: 0}
      }
    },
    y: {
      grid: {
        color: "#374151",
      },
      ticks: {
        color: "#9CA3AF",
        callback: function(value) {
          if (typeof value !== 'number') return '';
          return `${value.toFixed(4)}`;
        },
      },
      title: {
        display: true,
        text: 'Bitcoin Amount (BTC)',
        color: '#9CA3AF',
        padding: 10
      }
    },
  },
}

export function BitcoinHoldingsWaterfall() {
  const [yearlyHoldings, setYearlyHoldings] = useState<YearlyHolding[]>([])
  const [waterfallData, setWaterfallData] = useState<WaterfallDataPoint[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true)
      setError(null)
      
      // Fetch from 'orders' table and select necessary columns
      const { data: orders, error } = await supabase
        .from('orders')
        .select('date, type, received_btc_amount, sell_btc_amount, price')
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching orders:', error)
        setError('Failed to load data. Please try again later.')
        setIsLoading(false)
        return
      }

      if (orders && orders.length > 0) {
        const calculatedData = calculateBitcoinByYear(orders)
        setYearlyHoldings(calculatedData)
        
        // Convert to waterfall data format
        const waterfallPoints = convertToWaterfallData(calculatedData)
        setWaterfallData(waterfallPoints)
      } else {
        console.log("No orders found.")
        setError('No transaction data available.')
        setYearlyHoldings([])
        setWaterfallData([])
      }
      
      setIsLoading(false)
    }

    fetchOrders()
  }, [supabase])

  const data = {
    labels: waterfallData.map(d => d.year),
    datasets: [
      {
        label: 'Bitcoin Holdings',
        // For floating bars, data needs to be [start, end] pairs
        data: waterfallData.map(d => [d.start, d.end]),
        backgroundColor: generateColors(yearlyHoldings),
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        barPercentage: 0.8,  // Makes bars slightly narrower
        categoryPercentage: 0.9 // Increases spacing between categories
      },
    ],
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div className="pb-2 mb-4">
        <h3 className="text-lg font-semibold text-white">Bitcoin Accumulation Flow</h3>
        <p className="text-sm text-gray-400">Waterfall chart showing how your BTC stack has grown by year</p>
      </div>
      {isLoading ? (
        <div className="h-[350px] flex items-center justify-center text-white">Loading waterfall chart...</div>
      ) : error ? (
        <div className="h-[350px] flex items-center justify-center text-red-400">{error}</div>
      ) : (
        <div className="h-[350px] w-full">
          <Bar 
            options={options} 
            data={data} 
          />
        </div>
      )}
    </div>
  )
} 