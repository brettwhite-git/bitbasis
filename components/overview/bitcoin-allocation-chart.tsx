"use client"

import { useState, useEffect } from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js"
import { Doughnut } from "react-chartjs-2"
import { useSupabase } from "@/components/providers/supabase-provider"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend)

// Updated interface to match 'orders' table structure and needed fields
interface Order {
  date: string
  type: 'buy' | 'sell'
  received_btc_amount: number | null // For buys
  sell_btc_amount: number | null // For sells
  price: number // Needed for calculations
}

interface YearlyAllocation {
  year: string
  value: number
  percentage: number
}

function calculateYearlyAllocation(orders: Order[]): YearlyAllocation[] {
  const yearlyData = new Map<string, number>()
  let currentBTCByYear = new Map<string, number>()

  // Sort orders by date
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate BTC holdings by year using 'type' and correct amount fields
  sortedOrders.forEach(order => {
    const year = new Date(order.date).getFullYear().toString()
    const currentBTC = currentBTCByYear.get(year) || 0

    if (order.type === 'buy') {
      currentBTCByYear.set(year, currentBTC + (order.received_btc_amount || 0))
    } else if (order.type === 'sell') {
      currentBTCByYear.set(year, currentBTC - (order.sell_btc_amount || 0))
    }
  })

  // Calculate USD value using the latest price from the *last* order
  const latestPrice = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1]?.price || 0 : 0
  let totalValue = 0

  currentBTCByYear.forEach((btcAmount, year) => {
    const usdValue = btcAmount * latestPrice
    if (usdValue > 0) {
      yearlyData.set(year, usdValue)
      totalValue += usdValue
    }
  })

  // Calculate percentages and sort by year (earliest to latest)
  return Array.from(yearlyData.entries())
    .map(([year, value]) => ({
      year,
      value,
      percentage: (value / totalValue) * 100
    }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year)) // Sort by year ascending
}

// Function to adjust color intensity
function adjustColor(baseColor: string, percentage: number): string {
  // Convert hex to RGB
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)
  
  // For higher percentages, intensify the orange by:
  // - Maintaining or slightly increasing red
  // - Reducing green more aggressively
  // - Keeping blue low
  const factor = percentage * 1.5 // Amplify the effect
  const adjustedR = Math.min(255, Math.round(r * (1 + factor * 0.1))) // Slightly increase red
  const adjustedG = Math.max(0, Math.round(g * (1 - factor * 0.4))) // Reduce green more
  const adjustedB = Math.max(0, Math.round(b * (1 - factor * 0.3))) // Reduce blue moderately
  
  return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`
}

// Function to generate Bitcoin orange shades based on allocation percentage
function generateBitcoinOrangeShades(yearlyData: YearlyAllocation[]): string[] {
  // Calculate total allocation
  const totalValue = yearlyData.reduce((sum, data) => sum + data.value, 0)
  
  // Define color ranges based on percentage of total allocation
  const colorRanges = [
    { threshold: 50, color: '#D35C00' },  // Over 50% - Very dark orange
    { threshold: 25, color: '#E06900' },  // 25-50% - Dark orange
    { threshold: 15, color: '#EC7500' },  // 15-25% - Medium-dark orange
    { threshold: 10, color: '#F27200' },  // 10-15% - Darker Bitcoin orange
    { threshold: 5, color: '#F7931A' },   // 5-10% - Bitcoin orange
    { threshold: 0, color: '#F89E39' }    // Under 5% - Slightly lighter orange
  ]

  // Default color if something goes wrong
  const defaultColor = '#F89E39'

  // Assign colors based on percentage of total allocation
  return yearlyData.map(data => {
    const percentage = (data.value / totalValue) * 100
    // Find the appropriate color range or use the default color
    const matchingRange = colorRanges.find(range => percentage >= range.threshold)
    return matchingRange ? matchingRange.color : defaultColor
  })
}

const options: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: "bottom",
      align: "center",
      maxWidth: 800,
      maxHeight: 100,
      labels: {
        color: "#ffffff",
        padding: 30,
        usePointStyle: true,
        pointStyle: "circle",
        boxWidth: 8,
        boxHeight: 8,
        font: {
          size: 13,
          weight: 400,
          family: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        generateLabels: (chart) => {
          const dataset = chart.data.datasets?.[0]
          if (!dataset?.backgroundColor) return []
          
          return (chart.data.labels || []).map((label, i) => {
            const colors = Array.isArray(dataset.backgroundColor) 
              ? dataset.backgroundColor 
              : [dataset.backgroundColor]
            
            return {
              text: String(label),
              fillStyle: colors[i % colors.length],
              strokeStyle: colors[i % colors.length],
              pointStyle: 'circle' as const,
              hidden: false,
              color: "#ffffff",
              textColor: "#ffffff",
              fontColor: "#ffffff"
            }
          })
        }
      },
    },
    tooltip: {
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      callbacks: {
        label: function(context) {
          const value = context.raw as number
          const dataset = context.dataset
          const total = dataset.data.reduce((acc: number, curr: number) => acc + curr, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return [
            `Value: $${value.toLocaleString()}`,
            `Percentage: ${percentage}%`
          ]
        }
      }
    },
  },
}

export function BitcoinAllocationChart() {
  const [yearlyData, setYearlyData] = useState<YearlyAllocation[]>([])
  const { supabase } = useSupabase()

  useEffect(() => {
    async function fetchOrders() {
      // Fetch from 'orders' table and select necessary columns
      const { data: orders, error } = await supabase
        .from('orders') // Changed table name
        .select('date, type, received_btc_amount, sell_btc_amount, price') // Updated select columns
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching orders:', error) // Updated error message
        return
      }

      // Ensure orders is not null before calculating
      if (orders) {
        const calculatedData = calculateYearlyAllocation(orders) // Pass fetched orders
        setYearlyData(calculatedData)
      } else {
        console.log("No orders found.")
        setYearlyData([]) // Set empty data if no orders
      }
    }

    fetchOrders() // Renamed function call
  }, [supabase])

  const data = {
    labels: yearlyData.map(d => d.year),
    datasets: [
      {
        data: yearlyData.map(d => d.value),
        backgroundColor: generateBitcoinOrangeShades(yearlyData),
        borderColor: '#1F2937',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="h-[300px] w-full flex items-center justify-center text-white">
      <Doughnut options={options} data={data} />
    </div>
  )
} 