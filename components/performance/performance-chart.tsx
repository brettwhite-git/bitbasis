"use client"

import { createContext, useContext, useState, useEffect } from "react"
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
} from "chart.js"
import { Line } from "react-chartjs-2"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui"
import { createBrowserClient } from "@/lib/supabase"
import { Database } from "@/types/supabase"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type Period = "3M" | "6M" | "1Y" | "3Y" | "ALL"

interface ChartContextType {
  period: Period
  setPeriod: (period: Period) => void
}

interface Transaction {
  date: string
  type: 'Buy' | 'Sell' | 'Send' | 'Receive'
  received_amount: number | null
  buy_amount: number | null
  service_fee: number | null
  price: number
}

interface MonthlyData {
  month: string // YYYY-MM format
  portfolioValue: number
  costBasis: number
  cumulativeBTC: number
  averagePrice: number
}

const ChartContext = createContext<ChartContextType | undefined>(undefined)

function ChartProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>("1Y")
  return (
    <ChartContext.Provider value={{ period, setPeriod }}>
      {children}
    </ChartContext.Provider>
  )
}

// Calculate monthly data from transactions
function calculateMonthlyData(transactions: Transaction[]): MonthlyData[] {
  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const monthlyData = new Map<string, MonthlyData>()
  let cumulativeBTC = 0
  let cumulativeCostBasis = 0
  let lastPrice = 0

  // Get min and max dates to fill in all months
  if (sortedTransactions.length === 0) return []
  
  const firstTransaction = sortedTransactions[0]
  const lastTransaction = sortedTransactions[sortedTransactions.length - 1]
  
  if (!firstTransaction?.date || !lastTransaction?.date) return []
  
  const startDate = new Date(firstTransaction.date)
  const currentDate = new Date()
  
  // Fill in all months between start date and current date
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) // Use current date instead of last transaction
  
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

  // Process each transaction
  sortedTransactions.forEach(tx => {
    const date = new Date(tx.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    lastPrice = tx.price // Update the last known price
    
    // Update BTC holdings based on transaction type
    if (tx.type === 'Buy' || tx.type === 'Receive') {
      cumulativeBTC += tx.received_amount || 0
      if (tx.type === 'Buy') {
        cumulativeCostBasis += (tx.buy_amount || 0) + (tx.service_fee || 0)
      }
    } else if (tx.type === 'Sell' || tx.type === 'Send') {
      cumulativeBTC -= tx.received_amount || 0
    }

    // Get or create monthly data
    let monthData = monthlyData.get(monthKey)
    if (!monthData) {
      monthData = {
        month: monthKey,
        portfolioValue: 0,
        costBasis: cumulativeCostBasis,
        cumulativeBTC: cumulativeBTC,
        averagePrice: tx.price
      }
      monthlyData.set(monthKey, monthData)
    } else {
      // Update existing month data
      monthData.costBasis = cumulativeCostBasis
      monthData.cumulativeBTC = cumulativeBTC
      monthData.averagePrice = tx.price
    }
    
    // Calculate portfolio value
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
        padding: 20,
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
        color: "#374151",
      },
      ticks: {
        color: "#9ca3af",
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
    },
  },
}

function ChartFilters() {
  const context = useContext(ChartContext)
  if (!context) throw new Error("ChartFilters must be used within a ChartProvider")
  const { period, setPeriod } = context

  return (
    <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="w-[300px]">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="3M">3M</TabsTrigger>
        <TabsTrigger value="6M">6M</TabsTrigger>
        <TabsTrigger value="1Y">1Y</TabsTrigger>
        <TabsTrigger value="3Y">3Y</TabsTrigger>
        <TabsTrigger value="ALL">ALL</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function Chart() {
  const context = useContext(ChartContext)
  if (!context) throw new Error("Chart must be used within a ChartProvider")
  const { period } = context
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

  useEffect(() => {
    async function fetchTransactions() {
      const supabase = createBrowserClient()
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching transactions:', error)
        return
      }

      const calculatedData = calculateMonthlyData(transactions)
      setMonthlyData(calculatedData)
    }

    fetchTransactions()
  }, [])

  // Filter data based on selected period
  const filteredData = (() => {
    const now = new Date()
    const monthsToShow = period === "3M" ? 3 : 
                        period === "6M" ? 6 :
                        period === "1Y" ? 12 :
                        period === "3Y" ? 36 : 
                        monthlyData.length

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
        borderColor: "#F7931A",
        backgroundColor: "#F7931A",
        tension: 0.4,
      },
      {
        label: "Cost Basis",
        data: filteredData.map(d => d.costBasis),
        borderColor: "#64748b",
        backgroundColor: "#64748b",
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="h-[400px]">
      <Line options={options} data={data} />
    </div>
  )
}

export function PerformanceChart() {
  return <Chart />
}

export function PerformanceFilters() {
  return <ChartFilters />
}

export function PerformanceContainer({ children }: { children: React.ReactNode }) {
  return <ChartProvider>{children}</ChartProvider>
} 