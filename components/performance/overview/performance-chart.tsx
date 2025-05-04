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
import { usePortfolioHistory } from "@/lib/hooks/usePortfolioHistory"

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

type Period = "1Y" | "2Y" | "3Y" | "5Y" | "ALL"

interface ChartContextType {
  period: Period;
  setPeriod: (period: Period) => void;
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

// Helper to use the chart context
function useChartContext() {
  const context = useContext(ChartContext)
  if (!context) {
    throw new Error("Chart components must be used within a ChartProvider")
  }
  return context
}

// Nice scale calculation utility
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
  const { period, setPeriod } = useChartContext();

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

// --- Refactored Chart Component --- 
function Chart() {
  const { period } = useChartContext();
  const { data: portfolioHistory, loading, error } = usePortfolioHistory();

  // Filter data based on selected period
  const filteredData = (() => {
    if (!portfolioHistory || portfolioHistory.length === 0) return [];
    
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
        return portfolioHistory;
    }

    const startMonthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    return portfolioHistory.filter(point => point.month >= startMonthKey);
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
  const windowSize = Math.min(6, Math.floor(portfolioValues.filter(v => v !== null).length / 2) || 1);
  const longTermMovingAverage = calculateMovingAverage(portfolioValues, windowSize);

  // Calculate dynamic chart options
  const dynamicOptions: ChartOptions<'line'> = {
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
            if (value === null || typeof value === 'undefined') {
              return `${context.dataset.label}: N/A`;
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
        suggestedMin: function() {
          const validThreeMonthMA = threeMonthMovingAverage.filter((v): v is number => v !== null && !isNaN(v));
          const validLongTermMA = longTermMovingAverage.filter((v): v is number => v !== null && !isNaN(v));
          
          const allValues = filteredData.flatMap(d => [
            d.portfolioValue,
            d.costBasis,
          ]).filter((v): v is number => v !== null && typeof v === 'number' && !isNaN(v))
            .concat(validThreeMonthMA, validLongTermMA);

          if (allValues.length === 0) return 0;

          const minValue = Math.min(...allValues);
          
          if (minValue >= 0) {
            return 0; // Start at 0 for non-negative data
          }

          // Calculate a nice minimum for negative data
          const range = Math.max(1, Math.max(...allValues) - minValue);
          const roughStep = range / 6;
          const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
          const normalizedStep = roughStep / magnitude;
          let niceStep: number;
          if (normalizedStep < 1.5) niceStep = 1;
          else if (normalizedStep < 3) niceStep = 2;
          else if (normalizedStep < 7) niceStep = 5;
          else niceStep = 10;
          niceStep *= magnitude;
          
          return Math.floor(minValue / niceStep) * niceStep;
        },
        suggestedMax: function() {
          const validThreeMonthMA = threeMonthMovingAverage.filter((v): v is number => v !== null && !isNaN(v));
          const validLongTermMA = longTermMovingAverage.filter((v): v is number => v !== null && !isNaN(v));

          const allValues = filteredData.flatMap(d => [
            d.portfolioValue,
            d.costBasis,
          ]).filter((v): v is number => v !== null && typeof v === 'number' && !isNaN(v))
            .concat(validThreeMonthMA, validLongTermMA);

          if (allValues.length === 0) return 100;

          const minValue = Math.min(...allValues);
          const maxValue = Math.max(...allValues);
          const { max: niceMax } = calculateNiceScale(minValue, maxValue);
          return niceMax;
        },
        ticks: {
          color: "#9ca3af",
          callback: function(value) {
            if (typeof value !== 'number') return '';
            return `$${value.toLocaleString()}`
          },
          autoSkip: true,
          maxTicksLimit: 8,
          includeBounds: true
        },
        grace: 0,
        beginAtZero: false
      },
    },
  }

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
        data: filteredData.map(d => d?.portfolioValue ?? null),
        borderColor: "#F7931A", // Bitcoin Orange
        backgroundColor: "#F7931A",
        tension: 0.4,
        pointRadius: filteredData.length < 50 ? 4 : 0,
        pointBackgroundColor: "rgba(247, 147, 26, 0.2)",
        pointBorderColor: "#F7931A",
        pointBorderWidth: 1,
        spanGaps: true,
      },
      {
        label: "3-Month Moving Average",
        data: threeMonthMovingAverage,
        borderColor: "#A855F7", // Purple
        backgroundColor: "#A855F7",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [10, 5],
        fill: false,
        spanGaps: true,
      },
      {
        label: `${windowSize}-Month Moving Average`,
        data: longTermMovingAverage,
        borderColor: "#10B981", // Green
        backgroundColor: "#10B981",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 10],
        fill: false,
        spanGaps: true,
      },
      {
        label: "Cost Basis",
        data: filteredData.map(d => d?.costBasis ?? null),
        borderColor: "#3B82F6", // Blue
        backgroundColor: "#3B82F6",
        tension: 0.4,
        pointRadius: filteredData.length < 50 ? 4 : 0,
        pointBackgroundColor: "rgba(59, 130, 246, 0.2)",
        pointBorderColor: "#3B82F6",
        pointBorderWidth: 1,
        spanGaps: true,
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
            <p className="text-error text-center">{error.message}</p>
          </div>
        ) : (
          <Line data={chartData} options={dynamicOptions} />
        )}
      </div>
    </div>
  );
}

export function PerformanceChart() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow">
        <Chart />
      </div>
    </div>
  )
}

export function PerformanceFilters() {
  return <ChartFilters />
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
      <div className={className}>
        {children}
      </div>
    </ChartProvider>
  )
} 