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

// Use Supabase generated types directly where possible
type OrderRow = Database['public']['Tables']['orders']['Row'];
type HistoricalPriceRow = Database['public']['Tables']['historical_prices']['Row'];

type Period = "3M" | "6M" | "1Y" | "3Y" | "ALL"

interface ChartContextType {
  period: Period
  setPeriod: (period: Period) => void
}

// Keep simplified OrderTransaction for internal logic if needed, but rely on OrderRow for fetching
interface OrderTransaction {
  date: string;
  type: 'buy' | 'sell';
  buy_fiat_amount?: number | null;
  buy_currency?: string | null;
  received_btc_amount?: number | null;
  sell_btc_amount?: number | null;
  received_fiat_amount?: number | null;
  received_fiat_currency?: string | null;
  price?: number | null;
  service_fee?: number | null;
  service_fee_currency?: string | null;
}

// Use BitcoinPriceRow for fetching, maybe simplify for internal use if needed
// interface BitcoinPrice { ... }

interface MonthlyData {
  month: string // YYYY-MM format
  portfolioValue: number
  costBasis: number
  cumulativeBTC: number
  endOfMonthPrice: number
}

const ChartContext = createContext<ChartContextType | undefined>(undefined)

function ChartProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>("3Y")
  return (
    <ChartContext.Provider value={{ period, setPeriod }}>
      {children}
    </ChartContext.Provider>
  )
}

// Helper to find the closest price point at or before the end of a given month
function findPriceForMonth(monthKey: string, prices: HistoricalPriceRow[]): number {
  const parts = monthKey.split('-').map(Number);
  
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
    console.error(`[findPriceForMonth] Invalid monthKey format: ${monthKey}`);
    return 0;
  }

  const yearNum = parts[0];
  const monthNum = parts[1];
  
  if (!Number.isFinite(yearNum) || !Number.isFinite(monthNum)) {
    console.error(`[findPriceForMonth] Invalid year/month values: ${yearNum}-${monthNum}`);
    return 0;
  }

  if (monthNum < 1 || monthNum > 12 || yearNum < 1970) {
    console.error(`[findPriceForMonth] Invalid year/month range: ${yearNum}-${monthNum}`);
    return 0;
  }

  const endOfMonthTimestamp = Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999);

  // Find the price with the minimum time difference before or at the end of the month
  const relevantPrice = prices
    .filter(p => p.date && new Date(p.date).getTime() <= endOfMonthTimestamp)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0];

  if (relevantPrice && typeof relevantPrice.price_usd === 'number') {
    return relevantPrice.price_usd;
  }

  // Fallback: If no price before, find the earliest price after the month ends
  const earliestAfter = prices
    .filter(p => p.date && new Date(p.date).getTime() > endOfMonthTimestamp)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0];
  
  return typeof earliestAfter?.price_usd === 'number' ? earliestAfter.price_usd : 0;
}

// --- REVISED calculateMonthlyData ---
function calculateMonthlyData(transactions: OrderRow[], historicalPrices: HistoricalPriceRow[]): MonthlyData[] {
  if (transactions.length === 0 || historicalPrices.length === 0) return [];

  // Sort transactions chronologically
  const sortedTransactions = [...transactions]
    .filter(tx => tx.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  // Sort prices chronologically and filter for BTC only
  const sortedPrices = [...historicalPrices]
    .filter(p => p.date && p.asset === 'BTC')
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

  if (sortedTransactions.length === 0) {
    console.log('No valid transactions after filtering');
    return [];
  }

  const firstTransaction = sortedTransactions[0];
  if (!firstTransaction || !firstTransaction.date) {
    console.log('No valid first transaction or date');
    return [];
  }

  // Now TypeScript knows firstTransaction.date exists
  const firstTxDate = new Date(firstTransaction.date);
  const lastDate = new Date();
  const startMonthDate = new Date(firstTxDate.getFullYear(), firstTxDate.getMonth(), 1);
  const endMonthDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

  const monthlyDataMap = new Map<string, MonthlyData>();
  let cumulativeBTC = 0;
  let cumulativeCostBasis = 0;
  const latestPrice = sortedPrices[0]?.price_usd ?? 0;

  // 2. Determine date range and pre-fill monthly buckets
  let currentMonthPointer = startMonthDate;
  while (currentMonthPointer <= endMonthDate) {
    const monthKey = `${currentMonthPointer.getFullYear()}-${String(currentMonthPointer.getMonth() + 1).padStart(2, '0')}`;
    monthlyDataMap.set(monthKey, {
      month: monthKey,
      portfolioValue: 0,
      costBasis: 0,
      cumulativeBTC: 0,
      endOfMonthPrice: 0
    });
    currentMonthPointer = new Date(currentMonthPointer.getFullYear(), currentMonthPointer.getMonth() + 1, 1);
  }

  // 3. Process transactions
  sortedTransactions.forEach(tx => {
    if (!tx.date) return; // Skip if date is null
    const txDate = new Date(tx.date);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Update cumulative totals based on transaction type
    if (tx.type === 'buy') {
      const btcAmount = tx.received_btc_amount ?? 0;
      const fiatAmount = tx.buy_fiat_amount ?? 0;
      // Assuming service_fee_currency is nullable string
      const fee = (tx.service_fee_currency === 'USD' || !tx.service_fee_currency)
                      ? (tx.service_fee ?? 0)
                      : 0;
      cumulativeBTC += btcAmount;
      cumulativeCostBasis += fiatAmount + fee;
    } else if (tx.type === 'sell') {
      const btcAmount = tx.sell_btc_amount ?? 0;
      cumulativeBTC -= btcAmount;
    }

    // Update the state for the end of the month
    const monthData = monthlyDataMap.get(monthKey);
    if (monthData) {
      monthData.cumulativeBTC = cumulativeBTC;
      monthData.costBasis = cumulativeCostBasis;
    }
  });

  // 4. Fill forward and calculate final values
  const finalMonthlyData: MonthlyData[] = [];
  let prevMonthData: MonthlyData | null = null;
  const sortedMonthKeys = Array.from(monthlyDataMap.keys()).sort();

  sortedMonthKeys.forEach(monthKey => {
    const currentData = monthlyDataMap.get(monthKey);
    if (!currentData) return; // Safety check

    // Fill forward logic
    if (prevMonthData && currentData.costBasis === 0 && currentData.cumulativeBTC === 0) {
        if (!(prevMonthData.costBasis === 0 && prevMonthData.cumulativeBTC === 0)) {
            // Only fill forward if prev month had actual data
            currentData.cumulativeBTC = prevMonthData.cumulativeBTC;
            currentData.costBasis = prevMonthData.costBasis;
        }
    }

    // 5. Find end-of-month price
    currentData.endOfMonthPrice = findPriceForMonth(monthKey, sortedPrices);

    // 6. Calculate Portfolio Value
    const isLastMonth = monthKey === sortedMonthKeys[sortedMonthKeys.length - 1];
    const priceToUse = isLastMonth ? latestPrice : currentData.endOfMonthPrice;
    currentData.portfolioValue = Math.max(0, currentData.cumulativeBTC) * priceToUse;

    finalMonthlyData.push(currentData);
    prevMonthData = { ...currentData }; // Store a copy for the next iteration
  });

  return finalMonthlyData;
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

// --- REVISED Chart Component --- 
function Chart() {
  const context = useContext(ChartContext);
  if (!context) throw new Error("Chart must be used within a ChartProvider");
  const { period } = context;
  const { supabase } = useSupabase();
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      console.log('PerformanceChart: Supabase client not ready yet.');
      return; 
    }
    
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      console.log('PerformanceChart: Fetching orders and prices...');
      
      try {
        // Always fetch 3 years of data regardless of selected period
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 3);
        
        const startStr = start.toISOString();
        const endStr = end.toISOString();

        console.log('Fetching data from', startStr, 'to', endStr);

        // Fetch orders and historical prices in parallel
        const [ordersResult, pricesResult] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: true }),
          supabase
            .from('historical_prices')
            .select('*')
            .eq('asset', 'BTC')
            .gte('date', startStr)
            .lte('date', endStr)
            .order('date', { ascending: false })
        ]);

        if (ordersResult.error) throw ordersResult.error;
        if (pricesResult.error) throw pricesResult.error;

        const transactions = ordersResult.data || [];
        const historicalPrices = pricesResult.data || [];

        console.log('Fetched historical prices:', historicalPrices.length);
        
        if (historicalPrices.length === 0) throw new Error("No historical price data available");

        // Filter only buy/sell transactions
        const buySellTransactions = transactions.filter(
          (tx): tx is OrderRow => tx.type === 'buy' || tx.type === 'sell'
        );

        if (buySellTransactions.length > 0) {
          const calculatedData = calculateMonthlyData(buySellTransactions, historicalPrices);
          setMonthlyData(calculatedData);
        } else {
          setMonthlyData([]);
        }

      } catch (err: any) {
        console.error('PerformanceChart: Error fetching data:', err);
        setError(err.message || "Failed to load chart data");
        setMonthlyData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase, period]);

  // Filter data based on selected period
  const filteredData = (() => {
    if (monthlyData.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "3M":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case "6M":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case "1Y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case "3Y":
        startDate = new Date(now.getFullYear() - 3, now.getMonth(), 1);
        break;
      case "ALL":
      default:
        return monthlyData;
    }

    const startMonthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    const startIndex = monthlyData.findIndex(d => d.month >= startMonthKey);
    return startIndex === -1 ? [] : monthlyData.slice(startIndex);
  })();

  const chartData = {
    labels: filteredData.map(d => {
      const [year, month] = (d.month || '').split('-');
      if (!year || !month) return '';
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: "Portfolio Value",
        data: filteredData.map(d => d.portfolioValue),
        borderColor: "#F7931A", // Bitcoin Orange
        backgroundColor: "#F7931A",
        tension: 0.1,
        pointRadius: filteredData.length < 50 ? 3 : 0,
      },
      {
        label: "Cost Basis",
        data: filteredData.map(d => d.costBasis),
        borderColor: "#64748b", // Slate Gray
        backgroundColor: "#64748b",
        tension: 0.1,
        pointRadius: filteredData.length < 50 ? 3 : 0,
      },
      {
        label: "BTC Price",
        data: filteredData.map(d => d.endOfMonthPrice),
        borderColor: "#22c55e", // Green
        backgroundColor: "#22c55e",
        tension: 0.1,
        borderDash: [5, 5], // Dashed line for BTC price
        pointRadius: filteredData.length < 50 ? 3 : 0,
      }
    ],
  };

  if (isLoading) {
    return <div className="h-[400px] flex items-center justify-center text-white">Loading Chart...</div>;
  }

  if (error) {
    return <div className="h-[400px] flex items-center justify-center text-red-500">Error: {error}</div>;
  }

  if (filteredData.length === 0) {
    return <div className="h-[400px] flex items-center justify-center text-gray-500">No data available for the selected period.</div>;
  }

  return (
    <div className="h-[400px]">
      <Line options={options} data={chartData} />
    </div>
  );
}
// --- END REVISED Chart Component ---

export function PerformanceChart() {
  return <Chart />;
}

export function PerformanceFilters() {
  return <ChartFilters />;
}

export function PerformanceContainer({ children }: { children: React.ReactNode }) {
  return <ChartProvider>{children}</ChartProvider>;
} 