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
import { createHodlAgeTooltipConfig } from "@/lib/utils/chart-tooltip-config"
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

interface HodlAgeData {
  ageRange: string
  btcAmount: number
}

// Interface for unified transaction
interface Transaction {
  date: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  received_amount: number | null
  received_currency: string | null
}

function calculateHodlAgeDistribution(transactions: Transaction[]): HodlAgeData[] {
  const now = new Date()
  const hodlAgeMap = new Map<string, number>()
  
  // Initialize age ranges
  const ageRanges = ['< 1 Year', '1-2 Years', '2-3 Years', '3-5 Years', '5+ Years']
  ageRanges.forEach(range => hodlAgeMap.set(range, 0))

  // Process buy transactions
  transactions.forEach(transaction => {
    if (transaction.type === 'buy' && transaction.received_currency === 'BTC' && transaction.received_amount) {
      const transactionDate = new Date(transaction.date)
      const yearsDiff = (now.getTime() - transactionDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
      
      let ageRange: string
      if (yearsDiff < 1) ageRange = '< 1 Year'
      else if (yearsDiff < 2) ageRange = '1-2 Years'
      else if (yearsDiff < 3) ageRange = '2-3 Years'
      else if (yearsDiff < 5) ageRange = '3-5 Years'
      else ageRange = '5+ Years'
      
      hodlAgeMap.set(ageRange, (hodlAgeMap.get(ageRange) || 0) + transaction.received_amount)
    }
  })

  // Convert map to array and sort by age range
  return ageRanges.map(range => ({
    ageRange: range,
    btcAmount: hodlAgeMap.get(range) || 0
  }))
}

const options: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // Make it a horizontal bar chart
  plugins: {
    legend: {
      display: false
    },
    tooltip: createHodlAgeTooltipConfig(),
  },
  scales: {
    x: {
      grid: {
        color: "#374151",
      },
      ticks: {
        color: "#9CA3AF",
        callback: function(value) {
          return `${Number(value).toFixed(4)} BTC`
        },
      },
    },
    y: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#9CA3AF",
      },
    },
  },
}

export function HodlAgeDistribution() {
  const [hodlData, setHodlData] = useState<HodlAgeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useSupabase()

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('date, type, received_amount, received_currency')
          .eq('type', 'buy') // Only need buy transactions for this chart
          .order('date', { ascending: true })

        if (error) throw error

        if (transactions) {
          // Filter and validate transaction types to match the Transaction interface
          const validTransactions = transactions.filter(
            (transaction): transaction is Transaction => 
              transaction.type === 'buy' &&
              typeof transaction.date === 'string' &&
              typeof transaction.received_amount === 'number'
          )
          
          const calculatedData = calculateHodlAgeDistribution(validTransactions)
          setHodlData(calculatedData)
        }
      } catch (err: unknown) {
        console.error('Error fetching HODL age data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load HODL age data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const data = {
    labels: hodlData.map(d => d.ageRange),
    datasets: [
      {
        data: hodlData.map(d => d.btcAmount),
        backgroundColor: '#F7931A', // Bitcoin Orange as hex
        borderColor: '#1F2937',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div className="pb-2 mb-4">
        <h3 className="text-lg font-semibold text-white">HODL Age Distribution</h3>
        <p className="text-sm text-gray-400">Bitcoin holdings by time held</p>
      </div>
      {isLoading ? (
        <div className="h-[350px] flex items-center justify-center text-white">Loading Chart...</div>
      ) : error ? (
        <div className="h-[350px] flex items-center justify-center text-red-400">{error}</div>
      ) : hodlData.length === 0 ? (
        <div className="h-[350px] flex items-center justify-center text-gray-400">No data available to display.</div>
      ) : (
        <div className="h-[350px] w-full">
          <Bar options={options} data={data} />
        </div>
      )}
    </div>
  )
} 