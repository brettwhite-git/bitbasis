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
import { useSupabase } from "@/components/providers/supabase-provider"

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

// Updated interface to match 'orders' table structure and needed fields
interface Order {
  date: string
  type: 'buy' | 'sell' // Updated type to lowercase as per DB constraint
  received_btc_amount: number | null // For buys
  sell_btc_amount: number | null // For sells
  buy_fiat_amount: number | null // For cost basis on buys
  service_fee: number | null // For cost basis on buys
  price: number // Needed for calculating value
}

interface MonthlyData {
  month: string // YYYY-MM format
  portfolioValue: number
  costBasis: number
  cumulativeBTC: number
  averagePrice: number
}

// Calculate monthly data from transactions (now orders)
function calculateMonthlyData(orders: Order[]): MonthlyData[] { // Renamed parameter
  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => // Renamed variable
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const monthlyData = new Map<string, MonthlyData>()
  let cumulativeBTC = 0
  let cumulativeCostBasis = 0
  let lastPrice = 0

  // Get min and max dates to fill in all months
  if (sortedOrders.length === 0) return [] // Renamed variable
  
  const firstOrder = sortedOrders[0] // Renamed variable
  const lastOrder = sortedOrders[sortedOrders.length - 1] // Renamed variable
  
  if (!firstOrder?.date || !lastOrder?.date) return [] // Renamed variable
  
  const startDate = new Date(firstOrder.date) // Renamed variable
  const currentDate = new Date()
  
  // Fill in all months between start date and current date
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  
  let currentMonth = start
  while (currentMonth <= end) {
    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
    monthlyData.set(monthKey, {
      month: monthKey,
      portfolioValue: 0,
      costBasis: cumulativeCostBasis,
      cumulativeBTC: cumulativeBTC,
      averagePrice: lastPrice
    })
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
  }

  // Process each order
  sortedOrders.forEach(order => { // Renamed variable and parameter
    const date = new Date(order.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    lastPrice = order.price
    
    // Adjust cumulative BTC and cost basis based on order type
    if (order.type === 'buy') {
      cumulativeBTC += order.received_btc_amount || 0
      // Cost basis includes fiat amount + service fee for buys
      cumulativeCostBasis += (order.buy_fiat_amount || 0) + (order.service_fee || 0)
    } else if (order.type === 'sell') {
      cumulativeBTC -= order.sell_btc_amount || 0
      // Sells don't add to cost basis in this calculation method (FIFO/LIFO logic would be elsewhere)
    }

    let monthData = monthlyData.get(monthKey)
    if (!monthData) {
      monthData = {
        month: monthKey,
        portfolioValue: 0,
        costBasis: cumulativeCostBasis,
        cumulativeBTC: cumulativeBTC,
        averagePrice: order.price
      }
      monthlyData.set(monthKey, monthData)
    } else {
      monthData.costBasis = cumulativeCostBasis
      monthData.cumulativeBTC = cumulativeBTC
      monthData.averagePrice = order.price
    }
    
    // Use the most recent price for the portfolio value calculation for the month
    monthData.portfolioValue = monthData.cumulativeBTC * monthData.averagePrice 
  })

  // Convert map to array and sort by month
  const monthlyDataArray = Array.from(monthlyData.values())
    .sort((a, b) => a.month.localeCompare(b.month))

  // Fill forward values for months with no transactions
  let lastValidData: MonthlyData | null = null
  return monthlyDataArray.map(data => {
    if (data.portfolioValue === 0 && lastValidData) {
      return {
        ...data,
        portfolioValue: lastValidData.portfolioValue,
        costBasis: lastValidData.costBasis,
        cumulativeBTC: lastValidData.cumulativeBTC,
        averagePrice: lastValidData.averagePrice
      }
    }
    if (data.portfolioValue > 0) {
      lastValidData = data
    }
    return data
  })
}

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
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
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

interface PortfolioSummaryChartProps {
  timeframe: "6M" | "1Y"
  onTimeframeChangeAction: (timeframe: "6M" | "1Y") => void
}

export function PortfolioSummaryChart({ timeframe, onTimeframeChangeAction }: PortfolioSummaryChartProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const { supabase } = useSupabase()

  useEffect(() => {
    async function fetchData() {
      // Calculate date range based on timeframe
      const end = new Date()
      const start = new Date()
      start.setMonth(end.getMonth() - (timeframe === "6M" ? 6 : 12))

      // Format dates for query
      const startStr = start.toISOString()
      const endStr = end.toISOString()

      // Fetch orders
      const ordersResult = await supabase
        .from('orders')
        .select('date, type, received_btc_amount, sell_btc_amount, buy_fiat_amount, service_fee, price')
        .order('date', { ascending: true })

      if (ordersResult.error) {
        console.error('Error fetching orders:', ordersResult.error)
        return
      }

      // Calculate monthly data with orders
      if (ordersResult.data) {
        const calculatedData = calculateMonthlyData(ordersResult.data)
        setMonthlyData(calculatedData)
      }
    }

    fetchData()
  }, [supabase, timeframe])

  // Filter data based on selected period
  const filteredData = (() => {
    const monthsToShow = timeframe === "6M" ? 6 : 12
    return monthlyData.slice(-monthsToShow)
  })()

  const data = {
    labels: filteredData.map(d => {
      const [year, month] = (d.month || '').split('-')
      if (!year || !month) return ''
      const date = new Date(parseInt(year), parseInt(month) - 1)
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'short' })
      const formattedYear = `'${date.toLocaleDateString('en-US', { year: '2-digit' })}`
      return `${formattedMonth} ${formattedYear}`
    }),
    datasets: [
      {
        label: "Portfolio Value",
        data: filteredData.map(d => d.portfolioValue),
        borderColor: "#F7931A", // Bitcoin Orange
        backgroundColor: "rgba(247, 147, 26, 0.2)", // Semi-transparent Bitcoin Orange
        tension: 0.4,
        fill: true,
        pointRadius: 0 // Hide points for smoother area look
      },
      {
        label: "Cost Basis",
        data: filteredData.map(d => d.costBasis),
        borderColor: "#3b82f6", // Blue-500
        backgroundColor: "rgba(59, 130, 246, 0.2)", // Semi-transparent Blue
        tension: 0.4,
        fill: true,
        pointRadius: 0 // Hide points for smoother area look
      }
    ],
  }

  return (
    <div className="h-[350px] w-full">
      <Line options={options} data={data} />
    </div>
  )
} 