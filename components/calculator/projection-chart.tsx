"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  DatasetChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Updated data point structure
interface ProjectionPoint {
    year: number;
    nominalValue: number;
    adjustedValue: number;
}

interface ProjectionChartProps {
  data: ProjectionPoint[];
  showInflationAdjusted: boolean; // Prop to control adjusted line visibility
}

// Helper to format currency for tooltips/axes
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '$0';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};

export function ProjectionChart({ data, showInflationAdjusted }: ProjectionChartProps) {

  // Base dataset for nominal value
  const nominalDataset = {
    label: 'Nominal Value',
    data: data.map(d => d.nominalValue),
    borderColor: '#F7931A', // Bitcoin orange
    backgroundColor: (context: any) => { // Gradient fill for nominal
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300); // Adjust gradient height
        gradient.addColorStop(0, 'rgba(247, 147, 26, 0.5)'); // Orange semi-transparent
        gradient.addColorStop(1, 'rgba(247, 147, 26, 0)'); // Fades to transparent
        return gradient;
    },
    tension: 0.1,
    fill: true, // Fill nominal value area
    pointRadius: 3,
    pointHoverRadius: 5,
    yAxisID: 'y', // Assign to the primary y-axis
  };

  // Dataset for inflation-adjusted value (conditionally added)
  const adjustedDataset = {
    label: 'Inflation-Adjusted',
    data: data.map(d => d.adjustedValue),
    borderColor: '#4ADE80', // A contrasting green color (e.g., Tailwind's green-400)
    backgroundColor: 'rgba(74, 222, 128, 0.1)', // Lighter green for potential fill (optional)
    tension: 0.1,
    fill: false, // Do not fill adjusted value area by default to avoid clutter
    pointRadius: 3,
    pointHoverRadius: 5,
    borderDash: [5, 5], // Make it a dashed line
    yAxisID: 'y', // Assign to the primary y-axis
  };

  const chartData: ChartData<'line'> = {
    labels: data.map(d => `${d.year}y`), // Shorter year labels like '0y', '1y'
    datasets: showInflationAdjusted ? [nominalDataset, adjustedDataset] : [nominalDataset], // Conditionally include adjusted dataset
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { // Improve tooltip interaction
        mode: 'index', 
        intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false, // Keep X grid lines hidden
          // color: '#334155', // slate-700 (if you want to show them)
          // borderColor: '#334155', // slate-700
        },
        ticks: {
          color: '#94A3B8', // text-slate-400
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: data.length > 15 ? 10 : data.length+1 // Show more ticks for shorter periods
        }
      },
      y: {
        // type: 'linear', // Ensure linear scale
        // display: true,
        // position: 'left',
        grid: {
          color: '#334155', // slate-700
          // borderColor: '#334155', // slate-700
        },
        ticks: {
          color: '#94A3B8', // text-slate-400
          callback: function(value: string | number) { // Type correction
            // Format ticks as compact currency (e.g., $10k, $1M)
            const numValue = Number(value);
            if (isNaN(numValue)) return '$0';
            if (numValue >= 1e6) return `$${(numValue / 1e6).toFixed(1)}M`;
            if (numValue >= 1e3) return `$${(numValue / 1e3).toFixed(0)}K`;
            return formatCurrency(numValue);
          }
        },
      },
    },
    plugins: {
      legend: {
        display: true, // Show legend now
        position: 'bottom', // Position legend at the bottom
        labels: {
            color: '#CBD5E1', // slate-300
            usePointStyle: true, // Use point style (circle) instead of box
            padding: 30 // Add padding around legend items
        }
      },
      tooltip: {
        backgroundColor: '#1E293B', // slate-800
        titleColor: '#F1F5F9', // slate-100
        bodyColor: '#F1F5F9', // slate-100
        padding: 15,
        boxPadding: 4,
        usePointStyle: true, // Use point style in tooltips
        callbacks: {
          label: function(context: any) { // Keep tooltip simple for now
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  return (
      <div className="h-full w-full">
        <Line options={chartOptions} data={chartData} />
      </div>
  );
} 