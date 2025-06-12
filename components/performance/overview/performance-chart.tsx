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
import { Button } from "@/components/ui/button"
import { usePortfolioHistory } from "@/lib/hooks"
import { createPerformanceTooltipConfig } from "@/lib/utils/chart-tooltip-config"

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
    <div className="flex items-center gap-2">
      <Button
        variant={period === "1Y" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setPeriod("1Y")}
      >
        1Y
      </Button>
      <Button
        variant={period === "2Y" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setPeriod("2Y")}
      >
        2Y
      </Button>
      <Button
        variant={period === "3Y" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setPeriod("3Y")}
      >
        3Y
      </Button>
      <Button
        variant={period === "5Y" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setPeriod("5Y")}
      >
        5Y
      </Button>
      <Button
        variant={period === "ALL" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setPeriod("ALL")}
      >
        ALL
      </Button>
    </div>
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
          padding: 10,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: createPerformanceTooltipConfig(),
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
            if (typeof value !== 'number') return '';
            return `$${value.toLocaleString()}`
          },
          autoSkip: true,
          maxTicksLimit: 8,
          includeBounds: true
        },
        min: 0,
        beginAtZero: true,
        grace: 0
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
        backgroundColor: "rgba(247, 147, 26, 0.2)", // Semi-transparent Bitcoin Orange
        pointBackgroundColor: "#F7931A", // Solid color for tooltip indicator
        pointBorderColor: "#F7931A", // Solid color for tooltip indicator
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBorderWidth: 1,
        spanGaps: true,
      },
      {
        label: "Cost Basis",
        data: filteredData.map(d => d?.costBasis ?? null),
        borderColor: "#3B82F6", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.2)", // Semi-transparent Blue
        pointBackgroundColor: "#3B82F6", // Solid color for tooltip indicator
        pointBorderColor: "#3B82F6", // Solid color for tooltip indicator
        tension: 0.4,
        fill: true,
        pointRadius: 4,
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