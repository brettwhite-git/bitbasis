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
  estimatedBtcPrice?: number; // Optional: Estimated BTC price for this period
  usdValueThisPeriod?: number; // Optional: USD value exchanged this period
  cumulativeUsdValue?: number; // Optional: Estimated cumulative USD value at this point
}

export interface CalculatorChartProps {
  chartData?: ChartDataPoint[];
  title?: string;
}

// Mock data structure (used only if chartData is not provided)
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
      backgroundColor: '#6366F1', // Indigo-500 for slight adjustment
      type: 'bar' as const,
      stack: 'Stack 0',
    },
  ],
}

// Moved helper formats inside or make them importable if used elsewhere
const formatNumber = (value: string | number, options?: Intl.NumberFormatOptions): string => {
  if (value === '' || value === undefined || value === null) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return typeof value === 'string' ? value : '';
  return num.toLocaleString('en-US', options);
};

const formatBTC = (btc: string | number): string => {
  if (!btc) return '0';
  const value = typeof btc === 'string' ? parseFloat(btc.replace(/,/g, '')) : btc;
  if (isNaN(value)) return '0';
  return value.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
};

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

export function CalculatorChart({ chartData, title }: CalculatorChartProps) {
  // Define chartOptions INSIDE the component to access chartData prop
  const chartOptions: ChartOptions<'bar'> = {
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
            // Convert sats to BTC for display
            const btc = value / 100000000;
            return btc.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 }) + ' BTC';
          },
        },
        position: 'left' as const,
      },
      y1: {
        position: 'right' as const,
        display: true, // Ensure axis is displayed
        grid: { drawOnChartArea: false, color: '#1E293B' }, // Draw grid lines behind bars if needed
        ticks: {
          color: '#94A3B8', // text-slate-400
          callback: function(value: any) {
            // Format the tick value as currency
            if (typeof value === 'number') {
              return formatCurrency(value); // Use the helper function
            }
            return value; // Fallback
          },
        },
        max: chartData && chartData.length > 0
           ? Math.max(...chartData.map(point => point.cumulativeUsdValue || 0)) * 1.1 // Use actual max value + 10% padding
           : 5000, // Default max if no data
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          color: '#94A3B8', // text-slate-400
          padding: 20,
          generateLabels: function(chart: any) {
            const originalLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
            // Reorder labels to put USD Value last
            return originalLabels.sort((a, b) => {
              if (a.text.includes('USD')) return 1;
              if (b.text.includes('USD')) return -1;
              // Keep original order for Total Accumulated and Sats Stacked
              if (a.text.includes('Accumulated')) return -1;
              if (b.text.includes('Accumulated')) return 1;
              return 0; // Should not happen with current labels
            });
          }
        }
      },
      tooltip: {
        backgroundColor: '#1E293B', // slate-800
        titleColor: '#F1F5F9', // slate-100
        bodyColor: '#F1F5F9', // slate-100
        padding: 12,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.yAxisID === 'y1') {
              label += '$0.00' // Default if needed
            } else {
              // Convert sats to BTC for tooltip
              const value = context.parsed.y;
              const btc = value / 100000000;
              // Check if it's the accumulated or periodic sats based on label
              if (label.includes('Total Accumulated')) {
                label += `${formatNumber(value)} sats (${formatBTC(btc)} BTC)`;
              } else if (label.includes('Sats Stacked')) {
                label += `${formatNumber(value)} sats`; // Keep it simpler for periodic
              } else {
                label += formatNumber(value) + ' sats'; // Fallback
              }
            }
            return label;
          },
          footer: function(tooltipItems: any) {
            // Find the data point index from the first tooltip item
            const pointIndex = tooltipItems[0]?.dataIndex;
            // IMPORTANT: Access chartData from the component's props scope
            if (pointIndex === undefined || !chartData || !chartData[pointIndex]) {
              return 'Total: N/A';
            }

            const point = chartData[pointIndex];
            const totalSats = point.accumulatedSats;
            const totalBtc = totalSats / 100000000;
            const estValue = point.cumulativeUsdValue;

            return [
              `Total: ${formatNumber(totalSats)} sats (${formatBTC(totalBtc)} BTC)`,
              `Est. Value: ${formatCurrency(estValue)}`,
            ];
          },
          title: (tooltipItems: any) => {
            // Add estimated price to title
            const pointIndex = tooltipItems[0]?.dataIndex;
            if (pointIndex !== undefined && chartData && chartData[pointIndex]) {
              const point = chartData[pointIndex];
              return `${point.date} (Est. Price: ${formatCurrency(point.estimatedBtcPrice)})`;
            }
            return tooltipItems[0]?.label || '';
          }
        },
      },
    },
  }

  // Use provided data or fall back to mock data
  const chartConfig: ChartData<'bar'> = chartData && chartData.length > 0 ? {
    labels: chartData.map(point => point.date),
    datasets: [
      {
        label: 'Total Accumulated',
        data: chartData.map(point => point.accumulatedSats),
        backgroundColor: '#F7931A', // Bitcoin orange
        type: 'bar' as const,
        stack: 'Stack 0',
        order: 2,
      },
      {
        label: 'Sats Stacked This Period',
        data: chartData.map(point => point.periodicSats),
        backgroundColor: '#6366F1', // Indigo-500
        type: 'bar' as const,
        stack: 'Stack 0', // Stack with accumulated sats
        order: 3, // Render behind the line
      },
      // Add a line dataset for USD value
      {
        label: 'USD Value',
        data: chartData.map(point => point.cumulativeUsdValue || 0),
        type: 'line' as const,
        borderColor: '#10B981', // Green color for USD
        borderWidth: 2,
        backgroundColor: 'transparent',
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1', // Use the right y-axis
        order: 1,
      },
    ],
  } : mockData; // Fallback to mock data structure if chartData is empty/undefined

  return (
    <div className="h-full w-full">
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <ReactChart type="bar" options={chartOptions} data={chartConfig} />
    </div>
  )
} 