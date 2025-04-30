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

type Period = "1Y" | "2Y" | "3Y" | "5Y" | "ALL"

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

interface MonthlyData {
  month: string // YYYY-MM format
  portfolioValue: number
  costBasis: number
  cumulativeBTC: number
  averagePrice: number
}

const ChartContext = createContext<ChartContextType | undefined>(undefined)

function ChartProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>("2Y")
  return (
    <ChartContext.Provider value={{ period, setPeriod }}>
      {children}
    </ChartContext.Provider>
  )
}

// --- REVISED calculateMonthlyData ---
function calculateMonthlyData(transactions: OrderRow[]): MonthlyData[] {
  if (transactions.length === 0) return [];

  // Sort transactions chronologically
  const sortedTransactions = [...transactions]
    .filter(tx => tx.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

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
  let lastPrice = 0;

  // 2. Determine date range and pre-fill monthly buckets
  let currentMonthPointer = startMonthDate;
  while (currentMonthPointer <= endMonthDate) {
    const monthKey = `${currentMonthPointer.getFullYear()}-${String(currentMonthPointer.getMonth() + 1).padStart(2, '0')}`;
    monthlyDataMap.set(monthKey, {
      month: monthKey,
      portfolioValue: 0,
      costBasis: 0,
      cumulativeBTC: 0,
      averagePrice: 0
    });
    currentMonthPointer = new Date(currentMonthPointer.getFullYear(), currentMonthPointer.getMonth() + 1, 1);
  }

  // 3. Process transactions
  sortedTransactions.forEach(tx => {
    if (!tx.date) return; // Skip if date is null
    const txDate = new Date(tx.date);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Track latest price
    if (tx.price) {
      lastPrice = tx.price;
    }
    
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
      monthData.averagePrice = lastPrice;
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
            currentData.averagePrice = prevMonthData.averagePrice;
        }
    }

    // Calculate Portfolio Value using most recent price available
    currentData.portfolioValue = Math.max(0, currentData.cumulativeBTC) * currentData.averagePrice;

    finalMonthlyData.push(currentData);
    prevMonthData = { ...currentData }; // Store a copy for the next iteration
  });

  return finalMonthlyData;
}

// Keep the nice scale calculation utility
function calculateNiceScale(min: number, max: number): { min: number; max: number } {
  const range = max - min;
  const roughStep = range / 6; // Aim for about 6-7 ticks
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;
  let niceStep: number;
  
  if (normalizedStep < 1.5) niceStep = 1;
  else if (normalizedStep < 3) niceStep = 2;
  else if (normalizedStep < 7) niceStep = 5;
  else niceStep = 10;
  
  niceStep *= magnitude;
  
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  
  return { min: niceMin, max: niceMax };
}

function ChartFilters() {
  const context = useContext(ChartContext)
  if (!context) throw new Error("ChartFilters must be used within a ChartProvider")
  const { period, setPeriod } = context

  return (
    <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="w-[300px]">
      <TabsList variant="compact" className="grid-cols-5">
        <TabsTrigger value="1Y" variant="compact">1Y</TabsTrigger>
        <TabsTrigger value="2Y" variant="compact">2Y</TabsTrigger>
        <TabsTrigger value="3Y" variant="compact">3Y</TabsTrigger>
        <TabsTrigger value="5Y" variant="compact">5Y</TabsTrigger>
        <TabsTrigger value="ALL" variant="compact">ALL</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// --- REVISED Chart Component --- 
function Chart() {
  const { supabase } = useSupabase()
  const { period } = useContext(ChartContext)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!supabase) {
      console.log('PerformanceChart: Supabase client not ready yet.');
      return; 
    }
    
    async function fetchData() {
      setLoading(true);
      setError("");
      console.log('PerformanceChart: Fetching orders...');
      
      try {
        // Fetch orders
        const ordersResult = await supabase
          .from('orders')
          .select('*')
          .order('date', { ascending: true });

        if (ordersResult.error) throw ordersResult.error;

        const transactions = ordersResult.data || [];

        // Filter only buy/sell transactions
        const buySellTransactions = transactions.filter(
          (tx): tx is OrderRow => tx.type === 'buy' || tx.type === 'sell'
        );

        if (buySellTransactions.length > 0) {
          const calculatedData = calculateMonthlyData(buySellTransactions);
          setMonthlyData(calculatedData);
        } else {
          setMonthlyData([]);
        }

      } catch (err: any) {
        console.error('PerformanceChart: Error fetching data:', err);
        setError(err.message || "Failed to load chart data");
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period, supabase]);

  // Filter data based on selected period
  const filteredData = (() => {
    if (monthlyData.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "1Y":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case "2Y":
        startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
        break;
      case "3Y":
        startDate = new Date(now.getFullYear() - 3, now.getMonth(), 1);
        break;
      case "5Y":
        startDate = new Date(now.getFullYear() - 5, now.getMonth(), 1);
        break;
      case "ALL":
      default:
        return monthlyData;
    }

    const startMonthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    const startIndex = monthlyData.findIndex(d => d.month >= startMonthKey);
    return startIndex === -1 ? [] : monthlyData.slice(startIndex);
  })();

  // Calculate moving averages
  const calculateMovingAverage = (data: (number | null)[], windowSize: number): (number | null)[] => {
    const result: (number | null)[] = [];
    const validData = data.map(d => d === null ? NaN : d); // Treat null as NaN for calculations

    for (let i = 0; i < validData.length; i++) {
      if (i < windowSize - 1) {
        result.push(null); // Not enough data for a full window
      } else {
        const windowSlice = validData.slice(i - windowSize + 1, i + 1);
        const validWindowValues = windowSlice.filter(v => !isNaN(v));
        if (validWindowValues.length > 0) {
          const sum = validWindowValues.reduce((acc, val) => acc + val, 0);
          result.push(sum / validWindowValues.length);
        } else {
          result.push(null); // No valid data in window
        }
      }
    }
    return result;
  };

  // Calculate MAs using filtered data
  const portfolioValues = filteredData.map(d => d?.portfolioValue ?? null);
  const threeMonthMovingAverage = calculateMovingAverage(portfolioValues, 3);
  const windowSize = Math.min(6, Math.floor(portfolioValues.filter(v => v !== null).length / 2) || 1); // Ensure windowSize >= 1
  const longTermMovingAverage = calculateMovingAverage(portfolioValues, windowSize);

  // Calculate dynamic chart options
  const dynamicOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to fill the container
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#fff",
          padding: 25,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            // Check if value is null or undefined before formatting
            if (value === null || typeof value === 'undefined') {
              return `${context.dataset.label}: N/A`; // Or handle as appropriate
            }
            return `${context.dataset.label}: $${value.toLocaleString()}`;
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
      },
      y: {
        grid: {
          color: "#374151",
        },
        // Calculate min/max based on FILTERED data
        suggestedMin: function(context: any) {
          // Filter MA arrays *before* concatenation
          const validThreeMonthMA = threeMonthMovingAverage.filter((v): v is number => v !== null && !isNaN(v));
          const validLongTermMA = longTermMovingAverage.filter((v): v is number => v !== null && !isNaN(v));
          
          const allValues = filteredData.flatMap(d => [
            d.portfolioValue,
            d.costBasis,
          ]).filter((v): v is number => v !== null && typeof v === 'number' && !isNaN(v)) // Filter base values
            .concat(validThreeMonthMA, validLongTermMA); // Concat pre-filtered MAs

          if (allValues.length === 0) return 0; // Start at 0 if no data

          const minValue = Math.min(...allValues);
          const maxValue = Math.max(...allValues);
          
          // If the actual minimum value in the data is non-negative, set the axis minimum to 0.
          if (minValue >= 0) {
            return 0;
          }

          // If the minimum value IS negative, calculate a 'nice' minimum below it.
          const range = Math.max(1, maxValue - minValue);
          const roughStep = range / 6;
          const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
          const normalizedStep = roughStep / magnitude;
          let niceStep: number;
          if (normalizedStep < 1.5) niceStep = 1;
          else if (normalizedStep < 3) niceStep = 2;
          else if (normalizedStep < 7) niceStep = 5;
          else niceStep = 10;
          niceStep *= magnitude;

          // Calculate the minimum based on the data, rounded down to the nearest nice step
          let niceMin = Math.floor(minValue / niceStep) * niceStep;
          
          // Return the calculated nice minimum for negative data ranges
          return niceMin;
        },
        suggestedMax: function(context: any) {
           // Filter MA arrays *before* concatenation
          const validThreeMonthMA = threeMonthMovingAverage.filter((v): v is number => v !== null && !isNaN(v));
          const validLongTermMA = longTermMovingAverage.filter((v): v is number => v !== null && !isNaN(v));

           const allValues = filteredData.flatMap(d => [
            d.portfolioValue,
            d.costBasis,
          ]).filter((v): v is number => v !== null && typeof v === 'number' && !isNaN(v)) // Filter base values
            .concat(validThreeMonthMA, validLongTermMA); // Concat pre-filtered MAs

          if (allValues.length === 0) return 100; // Default if no valid data

          const minValue = Math.min(...allValues);
          const maxValue = Math.max(...allValues);
          const { max: niceMax } = calculateNiceScale(minValue, maxValue);
          return niceMax;
        },
        ticks: {
          color: "#9ca3af",
          callback: function(value) {
            if (typeof value !== 'number') return ''; // Add type check
            return `$${value.toLocaleString()}`
          },
          autoSkip: true,
          maxTicksLimit: 8,
          includeBounds: true
        },
        grace: 0, // REMOVE bottom padding 
        beginAtZero: false // Ensure axis doesn't always start at zero
      },
    },
  } // End of dynamicOptions definition

  const chartData = {
    labels: filteredData.map(d => {
      const [year, month] = (d.month || '').split('-');
      if (!year || !month) return '';
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const shortYear = year.slice(-2); // Get last two digits
      return `${date.toLocaleDateString('en-US', { month: 'short' })}'${shortYear}`;
    }),
    datasets: [
      {
        label: "Portfolio Value",
        data: filteredData.map(d => d?.portfolioValue ?? null), // Use null for gaps
        borderColor: "#F7931A", // Bitcoin Orange
        backgroundColor: "#F7931A",
        tension: 0.4,
        pointRadius: filteredData.length < 50 ? 4 : 0,
        pointBackgroundColor: "rgba(247, 147, 26, 0.2)", // Semi-transparent Bitcoin Orange
        pointBorderColor: "#F7931A",
        pointBorderWidth: 1,
        spanGaps: true, // Connect lines over null data points
      },
      {
        label: "3-Month Moving Average",
        data: threeMonthMovingAverage, // Already contains nulls
        borderColor: "#A855F7", // Changed to Purple
        backgroundColor: "#A855F7", // Changed to Purple
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [10, 5], // Dashed line
        fill: false,
        spanGaps: true, // Connect across null values
      },
      {
        label: `${windowSize}-Month Moving Average`,
        data: longTermMovingAverage, // Already contains nulls
        borderColor: "#10B981", // Green
        backgroundColor: "#10B981",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 10], // Different dash pattern
        fill: false,
        spanGaps: true, // Connect across null values
      },
      {
        label: "Cost Basis",
        data: filteredData.map(d => d?.costBasis ?? null), // Use null for gaps
        borderColor: "#3B82F6", // Changed to Blue
        backgroundColor: "#3B82F6", // Changed to Blue
        tension: 0.4,
        pointRadius: filteredData.length < 50 ? 4 : 0,
        pointBackgroundColor: "rgba(59, 130, 246, 0.2)", // Semi-transparent Blue
        pointBorderColor: "#3B82F6",
        pointBorderWidth: 1,
        spanGaps: true, // Connect lines over null data points
      }
    ],
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-bitcoin-orange border-opacity-50 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-error text-center">{error}</p>
          </div>
        ) : (
          <Line data={chartData} options={dynamicOptions} />
        )}
      </div>
    </div>
  );
}
// --- END REVISED Chart Component ---

export function PerformanceChart() {
  return (
    <Chart />
  )
}

export function PerformanceFilters() {
  return (
    <ChartFilters />
  )
}

export function PerformanceContainer({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode, 
  className?: string 
}) {
  return (
    <ChartProvider>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </ChartProvider>
  )
} 