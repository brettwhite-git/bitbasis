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
  scaleType: 'auto' | 'fixed'
  setScaleType: (type: 'auto' | 'fixed') => void
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
  const [period, setPeriod] = useState<Period>("3Y")
  const [scaleType, setScaleType] = useState<'auto' | 'fixed'>('auto')
  return (
    <ChartContext.Provider value={{ period, setPeriod, scaleType, setScaleType }}>
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

// Add this utility function
function calculateNiceScale(min: number, max: number): { min: number; max: number } {
  // Calculate the range
  const range = max - min;
  
  // Calculate an initial tick size
  const roughStep = range / 6; // Aim for about 6-7 ticks
  
  // Calculate magnitude for rounding
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  
  // Calculate a nice step size
  const normalizedStep = roughStep / magnitude;
  let niceStep: number;
  
  if (normalizedStep < 1.5) niceStep = 1;
  else if (normalizedStep < 3) niceStep = 2;
  else if (normalizedStep < 7) niceStep = 5;
  else niceStep = 10;
  
  niceStep *= magnitude;
  
  // Calculate nice min and max values
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  
  return { min: niceMin, max: niceMax };
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
      min: undefined,
      suggestedMin: function(context: { chart: { data: { datasets: { data: number[] }[] } } }) {
        const dataset = context.chart.data.datasets[0];
        if (!dataset?.data.length) return 0;
        const minValue = Math.min(...dataset.data);
        return minValue <= 0 ? minValue : -(Math.ceil(minValue * 0.05));
      },
      suggestedMax: function(context: { chart: { data: { datasets: { data: number[] }[] } } }) {
        const dataset = context.chart.data.datasets[0];
        if (!dataset?.data.length) return 0;
        const maxValue = Math.max(...dataset.data);
        return maxValue + (Math.ceil(maxValue * 0.05));
      },
      ticks: {
        color: "#9ca3af",
        callback: function(value) {
          return `$${value.toLocaleString()}`
        },
        autoSkip: true,
        maxTicksLimit: 8,
        includeBounds: true
      },
      grace: '5%',
      beginAtZero: false
    },
  },
}

function ChartFilters() {
  const context = useContext(ChartContext)
  if (!context) throw new Error("ChartFilters must be used within a ChartProvider")
  const { period, setPeriod, scaleType, setScaleType } = context

  return (
    <div className="flex items-center gap-4">
      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="w-[300px]">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="1Y">1Y</TabsTrigger>
          <TabsTrigger value="2Y">2Y</TabsTrigger>
          <TabsTrigger value="3Y">3Y</TabsTrigger>
          <TabsTrigger value="5Y">5Y</TabsTrigger>
          <TabsTrigger value="ALL">ALL</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs value={scaleType} onValueChange={(value) => setScaleType(value as 'auto' | 'fixed')} className="w-[200px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auto">Auto Scale</TabsTrigger>
          <TabsTrigger value="fixed">Fixed Scale</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

// --- REVISED Chart Component --- 
function Chart() {
  const context = useContext(ChartContext);
  if (!context) throw new Error("Chart must be used within a ChartProvider");
  const { period, scaleType } = context;
  const { supabase } = useSupabase();
  
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalRange, setGlobalRange] = useState<{ min: number; max: number }>({ min: 0, max: 0 });

  useEffect(() => {
    if (!supabase) {
      console.log('PerformanceChart: Supabase client not ready yet.');
      return; 
    }
    
    async function fetchData() {
      setIsLoading(true);
      setError(null);
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
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Update global range when data changes
  useEffect(() => {
    if (monthlyData.length > 0) {
      const allValues = monthlyData.flatMap(d => [d.portfolioValue, d.costBasis]);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      setGlobalRange(calculateNiceScale(min, max));
    }
  }, [monthlyData]);

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

  // Calculate moving average based on data points
  const calculateMovingAverage = (data: number[], windowSize: number) => {
    const result: number[] = [];
    
    // For the first windowSize-1 elements, we don't have enough data for a full window
    for (let i = 0; i < windowSize - 1; i++) {
      result.push(NaN);
    }
    
    // Calculate moving average for the rest of the data
    for (let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      const sum = window.reduce((acc, val) => acc + val, 0);
      result.push(sum / windowSize);
    }
    
    return result;
  };

  // Calculate 3-month moving average for portfolio value
  const portfolioValues = filteredData.map(d => d.portfolioValue);
  const threeMonthMovingAverage = calculateMovingAverage(portfolioValues, 3);
  
  // Calculate longer-term moving average (approximately 6 months)
  const windowSize = Math.min(6, Math.floor(portfolioValues.length / 2));
  const longTermMovingAverage = calculateMovingAverage(portfolioValues, windowSize);

  // Create more visible moving average lines by replacing NaN values with null
  const visibleThreeMonthMA = threeMonthMovingAverage.map(value => 
    isNaN(value) ? null : value
  );
  
  const visibleLongTermMA = longTermMovingAverage.map(value => 
    isNaN(value) ? null : value
  );

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
        data: filteredData.map(d => d.portfolioValue),
        borderColor: "#F7931A", // Bitcoin Orange
        backgroundColor: "#F7931A",
        tension: 0.1,
        pointRadius: filteredData.length < 50 ? 3 : 0,
      },
      {
        label: "3-Month Moving Average",
        data: visibleThreeMonthMA,
        borderColor: "#3B82F6", // Blue
        backgroundColor: "#3B82F6",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 5], // Dashed line
        fill: false,
        spanGaps: true, // Connect across null values
      },
      {
        label: `${windowSize}-Month Moving Average`,
        data: visibleLongTermMA,
        borderColor: "#10B981", // Green
        backgroundColor: "#10B981",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [2, 2], // Different dash pattern
        fill: false,
        spanGaps: true, // Connect across null values
      },
      {
        label: "Cost Basis",
        data: filteredData.map(d => d.costBasis),
        borderColor: "#64748b", // Slate Gray
        backgroundColor: "#64748b",
        tension: 0.1,
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