"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js"
import { Chart as ReactChart } from "react-chartjs-2"
import { COLORS } from "../utils/color-constants" // Adjusted import path
import { ChartDataPoint } from "../types/calculator-types" // Adjusted import path
import { formatBTC, formatCurrency, formatNumber } from "../utils/format-utils" // Adjusted import path
import { createInvestmentAccumulationTooltipConfig } from "@/lib/utils/chart-tooltip-config"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

export interface InvestmentChartProps { // Renamed interface
  chartData?: ChartDataPoint[];
  title?: string;
  bitcoinUnit: 'bitcoin' | 'satoshi';
  showInflationAdjusted?: boolean;
}

// Mock data structure (used only if chartData is not provided)
const mockData = {
  labels: ['Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26'],
  datasets: [
    {
      label: 'Accumulated Sats',
      data: [100000, 300000, 500000, 700000, 900000, 1100000, 1300000, 1500000, 1700000, 1900000, 2100000, 2300000, 2500000],
      backgroundColor: COLORS.bitcoinOrange, // Bitcoin orange
      type: 'bar' as const,
      stack: 'Stack 0',
    },
    {
      label: 'Sats Stacked',
      data: [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000],
      backgroundColor: COLORS.secondary, // Secondary color from theme
      type: 'bar' as const,
      stack: 'Stack 0',
    },
  ],
};

export function InvestmentChart({ chartData, title, bitcoinUnit, showInflationAdjusted = true }: InvestmentChartProps) { // Renamed function and props type
  // Define chartOptions INSIDE the component to access chartData prop
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 5,
        right: 15
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: COLORS.chartText,
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: chartData && chartData.length > 40 ? 20 : 30,
        },
      },
      y: {
        stacked: true,
        grid: {
          color: COLORS.chartGrid,
        },
        ticks: {
          color: COLORS.chartText,
          callback: function(value: any) {
            if (bitcoinUnit === 'satoshi') {
              return formatNumber(value);
            } else {
              const btc = Number(value) / 100000000;
              return formatBTC(btc);
            }
          },
          padding: 10,
        },
        position: 'left' as const,
      },
      y1: {
        position: 'right' as const,
        display: true,
        grid: { drawOnChartArea: false, color: COLORS.background },
        ticks: {
          color: COLORS.chartText,
          callback: function(value: any) {
            if (typeof value === 'number') {
              return formatCurrency(value);
            }
            return value;
          },
          padding: 10,
        },
        max: chartData && chartData.length > 0
          ? Math.max(...chartData.map(point => point.cumulativeUsdValue || 0)) * 1.1
          : 5000,
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          color: COLORS.chartText,
          padding: 20,
          boxWidth: 15,
          boxHeight: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: function(chart: any) {
            const originalLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            return originalLabels.sort((a, b) => {
              if (a.text.includes('USD')) return 1;
              if (b.text.includes('USD')) return -1;
              if (a.text.includes('Accumulated')) return -1;
              if (b.text.includes('Accumulated')) return 1;
              return 0;
            });
          }
        }
      },
      tooltip: createInvestmentAccumulationTooltipConfig(chartData, bitcoinUnit),
    },
  };

  const chartConfig = chartData && chartData.length > 0 ? {
    labels: chartData.map(point => point.date),
    datasets: [
      {
        label: 'Total Accumulated',
        data: chartData.map(point => point.accumulatedSats),
        backgroundColor: COLORS.bitcoinOrange,
        pointBackgroundColor: COLORS.bitcoinOrange, // Solid color for tooltip indicator
        pointBorderColor: COLORS.bitcoinOrange, // Solid color for tooltip indicator
        type: 'bar' as const,
        stack: 'Stack 0',
        order: 2,
      },
      {
        label: 'Sats Stacked This Period',
        data: chartData.map(point => point.periodicSats),
        backgroundColor: COLORS.satStacked, // Use the new blue color from constants
        pointBackgroundColor: COLORS.satStacked, // Solid color for tooltip indicator
        pointBorderColor: COLORS.satStacked, // Solid color for tooltip indicator
        type: 'bar' as const,
        stack: 'Stack 0',
        order: 3,
      },
      {
        label: showInflationAdjusted ? 'USD Value (Inflation Adjusted)' : 'USD Value',
        data: chartData.map(point => point.cumulativeUsdValue || 0),
        backgroundColor: 'transparent',
        borderColor: COLORS.success,
        pointBackgroundColor: COLORS.success, // Solid color for tooltip indicator
        pointBorderColor: COLORS.success, // Solid color for tooltip indicator
        borderWidth: 2,
        type: 'line' as const,
        yAxisID: 'y1',
        pointRadius: 0,
        order: 1,
      }
    ],
  } : mockData;

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col overflow-hidden relative p-2">
      {title && (
        <div className="text-center text-base font-medium mb-2">{title}</div>
      )}
      <div className="flex-1">
        <ReactChart
          type="bar"
          options={chartOptions}
          data={chartConfig as any}
          height={"100%"}
        />
      </div>
    </div>
  );
} 