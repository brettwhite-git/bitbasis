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
  ChartData,
  ChartOptions,
  Chart,
} from "chart.js"
import { Chart as ReactChart } from "react-chartjs-2"

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

// Define interfaces for chart data
export interface ChartDataPoint {
  date: string;
  accumulatedSats: number;
  periodicSats: number;
}

export interface CalculatorChartProps {
  chartData?: ChartDataPoint[];
  title?: string;
  btcPrice?: number;
}

// Mock data for initial display
const mockData = {
  labels: ['Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26'],
  datasets: [
    {
      label: 'Accumulated Sats',
      data: [100000, 300000, 500000, 700000, 900000, 1100000, 1300000, 1500000, 1700000, 1900000, 2100000, 2300000, 2500000],
      backgroundColor: '#F7931A', // Bitcoin orange
      type: 'bar' as const,
      stack: 'Stack 0',
    },
    {
      label: 'Sats Stacked',
      data: [50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000],
      backgroundColor: '#818CF8', // Indigo-400 for purple/blue look
      type: 'bar' as const,
      stack: 'Stack 0',
    },
  ],
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        color: '#94A3B8', // text-slate-400
      },
    },
    y: {
      stacked: true,
      grid: {
        color: '#1E293B', // slate-800
      },
      ticks: {
        color: '#94A3B8', // text-slate-400
        callback: function(value: any) {
          return value.toLocaleString() + ' sats'
        },
      },
      position: 'left' as const,
    },
    y1: {
      position: 'right' as const,
      grid: {
        drawOnChartArea: false, // only want the grid lines for one y-axis to show
        color: '#1E293B', // slate-800
      },
      ticks: {
        color: '#94A3B8', // text-slate-400
        callback: function(value: any) {
          return '$' + value.toLocaleString()
        },
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#94A3B8', // text-slate-400
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: '#1E293B', // slate-800
      titleColor: '#F1F5F9', // slate-100
      bodyColor: '#F1F5F9', // slate-100
      padding: 12,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.dataset.yAxisID === 'y1') {
            label += '$' + context.parsed.y.toLocaleString()
          } else {
            label += context.parsed.y.toLocaleString() + ' sats'
          }
          return label
        },
        // Add footer to display BTC equivalent
        footer: function(tooltipItems: any) {
          const sum = tooltipItems.reduce((acc: number, item: any) => acc + item.parsed.y, 0);
          const btc = sum / 100000000;
          return [`= ${btc.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`];
        }
      },
    },
  },
}

export function CalculatorChart({ chartData, title, btcPrice = 65000 }: CalculatorChartProps) {
  // Create a dynamic chart options object
  const chartOptions = {
    ...options,
    scales: options.scales ? {
      ...options.scales,
      y1: options.scales.y1 ? {
        ...options.scales.y1,
        // Set the max value based on the maximum satoshi value converted to USD
        suggestedMax: chartData ? 
          Math.max(...chartData.map(point => point.accumulatedSats)) * btcPrice / 100000000 * 1.1 : // Add 10% padding
          2500000 * btcPrice / 100000000 * 1.1, // Use mock data max if no real data
      } : {}
    } : {}
  };

  // Use provided data or fall back to mock data
  const chartConfig = chartData ? {
    labels: chartData.map(point => point.date),
    datasets: [
      {
        label: 'Accumulated Sats',
        data: chartData.map(point => point.accumulatedSats),
        backgroundColor: '#F7931A', // Bitcoin orange
        type: 'bar' as const,
        stack: 'Stack 0',
      },
      {
        label: 'Sats Stacked',
        data: chartData.map(point => point.periodicSats),
        backgroundColor: '#818CF8', // Indigo-400 for purple/blue look
        type: 'bar' as const,
        stack: 'Stack 0',
      },
      // Add a line dataset for USD value
      {
        label: 'USD Value',
        data: chartData.map(point => (point.accumulatedSats * btcPrice / 100000000)),
        type: 'line' as const,
        borderColor: '#10B981', // Green color for USD
        borderWidth: 2,
        backgroundColor: 'transparent',
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1', // Use the right y-axis
      }
    ],
  } : mockData;

  return (
    <div className="h-full w-full">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <ReactChart type="bar" options={chartOptions} data={chartConfig} />
    </div>
  )
} 