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

// Interface to match unified transactions table structure
interface Transaction {
  date: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  sent_amount: number | null
  sent_currency: string | null
  received_amount: number | null
  received_currency: string | null
  price: number | null // Needed for calculations
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

function calculateBitcoinByYear(transactions: Transaction[]): YearlyHolding[] {
  const yearlyData = new Map<string, number>()

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate BTC holdings by year
  sortedTransactions.forEach(transaction => {
    const year = new Date(transaction.date).getFullYear().toString()
    const currentBTC = yearlyData.get(year) || 0

    if (transaction.type === 'buy' && transaction.received_currency === 'BTC') {
      yearlyData.set(year, currentBTC + (transaction.received_amount || 0))
    } else if (transaction.type === 'sell' && transaction.sent_currency === 'BTC') {
      yearlyData.set(year, currentBTC - (transaction.sent_amount || 0))
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Create placeholder data for consistent chart structure
  const getPlaceholderData = (): WaterfallDataPoint[] => {
    const currentYear = new Date().getFullYear()
    return [
      { year: (currentYear - 2).toString(), start: 0, end: 0 },
      { year: (currentYear - 1).toString(), start: 0, end: 0 },
      { year: currentYear.toString(), start: 0, end: 0 }
    ]
  }

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true)
      setError(null)
      
      // Fetch from 'transactions' table and select necessary columns
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, type, sent_amount, sent_currency, received_amount, received_currency, price')
        .in('type', ['buy', 'sell']) // Only include buy and sell transactions for this chart
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching transactions:', error)
        setError('Failed to load data. Please try again later.')
        setIsLoading(false)
        return
      }

      if (transactions && transactions.length > 0) {
        // Filter and validate transaction types to match the Transaction interface
        const validTransactions = transactions.filter(
          (transaction): transaction is Transaction => 
            (transaction.type === 'buy' || transaction.type === 'sell') &&
            typeof transaction.date === 'string' &&
            typeof transaction.sent_amount === 'number' &&
            typeof transaction.received_amount === 'number'
        )
        
        const calculatedData = calculateBitcoinByYear(validTransactions)
        setYearlyHoldings(calculatedData)
        
        // Convert to waterfall data format
        const waterfallPoints = convertToWaterfallData(calculatedData)
        setWaterfallData(waterfallPoints)
      } else {
        console.log("No transactions found.")
        setYearlyHoldings([])
        setWaterfallData(getPlaceholderData())
      }
      
      setIsLoading(false)
    }

    fetchTransactions()
  }, [supabase])

  // Use either loaded data or placeholder for consistent display
  const displayData = waterfallData.length > 0 ? waterfallData : getPlaceholderData()
  const displayHoldings = yearlyHoldings.length > 0 ? yearlyHoldings : []

  const data = {
    labels: displayData.map(d => d.year),
    datasets: [
      {
        label: 'Bitcoin Holdings',
        // For floating bars, data needs to be [start, end] pairs
        data: displayData.map(d => [d.start, d.end]),
        backgroundColor: isLoading ? 'rgba(247, 147, 26, 0.3)' : generateColors(displayHoldings),
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
        <p className="text-sm text-gray-400">
          {isLoading ? "Loading waterfall chart showing how your BTC stack has grown..." : "Waterfall chart showing how your BTC stack has grown by year"}
        </p>
      </div>
      {error ? (
        <div className="h-[350px] flex items-center justify-center text-red-400">{error}</div>
      ) : (
        <div className="h-[350px] w-full relative">
          <Bar 
            options={options} 
            data={data} 
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl">
              <div className="text-white/80 text-sm">Loading data...</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 