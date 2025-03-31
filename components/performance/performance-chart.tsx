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
import { useSupabase } from "@/components/providers/supabase-provider"
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

// Redefine Transaction interface to match 'orders' table structure for Buy/Sell
// Focusing on fields needed for performance chart calculations
interface OrderTransaction {
  date: string;
  type: 'Buy' | 'Sell'; // Assuming 'orders' table only contains Buy/Sell
  // Buy specific fields
  buy_fiat_amount?: number | null;
  buy_currency?: string | null;
  received_btc_amount?: number | null; // BTC received on buy
  // Sell specific fields
  sell_btc_amount?: number | null; // BTC sold
  received_fiat_amount?: number | null;
  received_fiat_currency?: string | null;
  // Common fields
  price?: number | null; // Price per BTC at transaction time
  service_fee?: number | null;
  service_fee_currency?: string | null;
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
// Updated to use OrderTransaction interface and align with calculations.mdc
// --- START REPLACEMENT ---
// Revised calculateMonthlyData function
function calculateMonthlyData(transactions: OrderTransaction[]): MonthlyData[] {
  if (transactions.length === 0) return [];

  // 1. Sort transactions chronologically
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const monthlyDataMap = new Map<string, MonthlyData>();
  let cumulativeBTC = 0;
  let cumulativeCostBasis = 0;
  // Use the price from the very first transaction as the initial "last price"
  let lastKnownPrice = sortedTransactions[0]?.price ?? 0;

  // 2. Determine date range and pre-fill monthly buckets
  const firstDate = new Date(sortedTransactions[0].date);
  const lastDate = new Date(); // Use current date as end point
  const startMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
  const endMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

  let currentMonthDate = startMonth;
  while (currentMonthDate <= endMonth) {
    const monthKey = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
    monthlyDataMap.set(monthKey, {
      month: monthKey,
      portfolioValue: 0, // Will be calculated later
      costBasis: 0,      // Will be set during processing/fill-forward
      cumulativeBTC: 0,  // Will be set during processing/fill-forward
      averagePrice: 0    // Will be set during processing/fill-forward
    });
    // Move to the next month
    currentMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
  }

  // 3. Process transactions and update cumulative values
  sortedTransactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

    // Update cumulative totals *before* assigning to the month's end state
    if (tx.type === 'buy') {
      const btcAmount = tx.received_btc_amount ?? 0;
      const fiatAmount = tx.buy_fiat_amount ?? 0;
      // Consider fee only if USD or currency not specified (basic handling)
      const fee = (tx.service_fee_currency === 'USD' || !tx.service_fee_currency)
                      ? tx.service_fee ?? 0
                      : 0;

      cumulativeBTC += btcAmount;
      cumulativeCostBasis += fiatAmount + fee;

    } else if (tx.type === 'sell') {
      const btcAmount = tx.sell_btc_amount ?? 0;
      cumulativeBTC -= btcAmount;
      // Cost basis doesn't decrease on sell for this cumulative view
    }

    // Update last known price if this transaction has one
    lastKnownPrice = tx.price ?? lastKnownPrice;

    // Update the data for the month this transaction occurred in
    const monthData = monthlyDataMap.get(monthKey);
    if (monthData) {
      // Store the state *after* this transaction for this month
      monthData.cumulativeBTC = cumulativeBTC;
      monthData.costBasis = cumulativeCostBasis;
      monthData.averagePrice = lastKnownPrice; // Use latest price from within the month
    }
  });

  // 4. Fill forward and calculate final values
  const finalMonthlyData: MonthlyData[] = [];
  let prevData: MonthlyData | null = null;

  // Iterate through all months we created, in order
  const sortedMonthKeys = Array.from(monthlyDataMap.keys()).sort();

  sortedMonthKeys.forEach(monthKey => {
    const currentData = monthlyDataMap.get(monthKey)!;

    // If a month had no transactions, its values will still be the initial zeros.
    // Fill forward from the previous month's final state.
    if (currentData.cumulativeBTC === 0 && currentData.costBasis === 0 && prevData) {
       currentData.cumulativeBTC = prevData.cumulativeBTC;
       currentData.costBasis = prevData.costBasis;
       currentData.averagePrice = prevData.averagePrice; // Carry forward price too
    }

    // 5. Calculate Portfolio Value for the month
    // Ensure non-negative BTC balance before calculation
    currentData.portfolioValue = Math.max(0, currentData.cumulativeBTC) * currentData.averagePrice;

    finalMonthlyData.push(currentData);
    prevData = currentData; // Update previous data for next iteration's fill-forward
  });

  return finalMonthlyData;
}
// --- END REPLACEMENT ---

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
  const { supabase } = useSupabase()
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

  useEffect(() => {
    if (!supabase) {
      console.log('PerformanceChart: Supabase client not ready yet.')
      return 
    }
    
    async function fetchTransactions() {
      console.log('PerformanceChart: Fetching orders...')
      const { data: transactions, error } = await supabase
        .from('orders') 
        .select('date, type, received_btc_amount, sell_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, price') 
        .order('date', { ascending: true })

      if (error) {
        console.error('PerformanceChart: Error fetching orders:', error) 
        return
      }
      
      console.log('PerformanceChart: Fetched orders raw:', transactions);

      const validTransactions = transactions.filter(
        (tx): tx is OrderTransaction => tx.type === 'buy' || tx.type === 'sell' 
      );
      
      console.log('PerformanceChart: Filtered buy/sell:', validTransactions);

      const calculatedData = calculateMonthlyData(validTransactions); 
      console.log('PerformanceChart: Calculated monthly data:', calculatedData);
      
      setMonthlyData(calculatedData)
    }

    fetchTransactions()
  }, [supabase])

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