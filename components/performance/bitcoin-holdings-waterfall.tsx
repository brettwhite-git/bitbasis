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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"

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
  // Define constant colors
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
    tooltip: {
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      callbacks: {
        label: function(context: any) {
          if (!context.raw) return [];
          const range = context.raw as number[];
          if (!Array.isArray(range) || range.length < 2) return [];
          
          // Ensure we have valid numbers
          const start = range[0] ?? 0;
          const end = range[1] ?? 0;
          const value = end - start;
          
          return [
            `Change: ${formatBTC(value)}`,
            `Total: ${formatBTC(end)}`
          ];
        },
        title: function(context: any[]) {
          const label = context?.[0]?.label;
          if (typeof label !== 'string') return '';
          return `Year: ${label}`;
        }
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#9ca3af",
      },
      title: {
        display: false,
        text: 'Year',
        color: '#9ca3af',
        padding: {top: 10, bottom: 0}
      }
    },
    y: {
      grid: {
        color: "#374151",
      },
      ticks: {
        color: "#9ca3af",
        callback: function(value) {
          if (typeof value !== 'number') return '';
          return `${value.toFixed(4)}`;
        },
      },
      title: {
        display: true,
        text: 'Bitcoin Amount (BTC)',
        color: '#9ca3af',
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
        borderColor: '#1F2937',
        borderWidth: 1,
        barPercentage: 0.8,  // Makes bars slightly narrower
        categoryPercentage: 0.9 // Increases spacing between categories
      },
    ],
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Bitcoin Accumulation Flow</CardTitle>
        <p className="text-sm text-muted-foreground">Waterfall chart showing how your BTC stack has grown by year</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[375px] flex items-center justify-center text-white">Loading Chart...</div>
        ) : error ? (
          <div className="h-[375px] flex items-center justify-center text-red-500">{error}</div>
        ) : yearlyHoldings.length === 0 ? (
          <div className="h-[375px] flex items-center justify-center text-gray-500">No data available to display.</div>
        ) : (
          <div className="h-[375px] w-full">
            <Bar options={options} data={data} />
          </div>
        )}
      </CardContent>
    </Card>
  )
} 