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
  ChartData
} from 'chart.js';
import { COLORS } from '../utils/color-constants';
import { ProjectionPoint } from '../types/calculator-types';
import { formatCurrency } from '../utils/format-utils';

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

interface ProjectionChartProps {
  data: ProjectionPoint[];
  showInflationAdjusted: boolean; // Prop to control adjusted line visibility
}

export function ProjectionChart({ data, showInflationAdjusted }: ProjectionChartProps) {

  // Base dataset for nominal value
  const nominalDataset = {
    label: 'Nominal Value',
    data: data.map(d => d.nominalValue),
    borderColor: COLORS.bitcoinOrange, // Bitcoin orange from theme
    backgroundColor: (context: any) => { 
      if (!context || !context.chart || !context.chart.ctx) {
        return COLORS.withOpacity(COLORS.bitcoinOrange, 0.2);
      }
      return COLORS.getGradient(context.chart.ctx, COLORS.bitcoinOrange);
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
    borderColor: COLORS.success, // Success color from theme
    backgroundColor: COLORS.withOpacity(COLORS.success, 0.1), // Light success color for fill
    tension: 0.1,
    fill: false, // Do not fill adjusted value area by default to avoid clutter
    pointRadius: 3,
    pointHoverRadius: 5,
    borderDash: [5, 5], // Make it a dashed line
    yAxisID: 'y', // Assign to the primary y-axis
  };

  const chartData = {
    labels: data.map(d => `${d.year}y`), // Shorter year labels like '0y', '1y'
    datasets: showInflationAdjusted ? [nominalDataset, adjustedDataset] : [nominalDataset], // Conditionally include adjusted dataset
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { // Improve tooltip interaction
        mode: 'index' as const, 
        intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false, // Keep X grid lines hidden
        },
        ticks: {
          color: COLORS.chartText, // Use chart text color
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: data.length > 15 ? 10 : data.length+1 // Show more ticks for shorter periods
        }
      },
      y: {
        grid: {
          color: COLORS.chartGrid, // Use chart grid color
        },
        ticks: {
          color: COLORS.chartText, // Use chart text color
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
        position: 'bottom' as const, // Position legend at the bottom
        labels: {
            color: COLORS.foreground, // Use foreground color from theme
            usePointStyle: true, // Use point style (circle) instead of box
            padding: 30 // Add padding around legend items
        }
      },
      tooltip: {
        backgroundColor: COLORS.background, // Use background color from theme
        titleColor: COLORS.foreground, // Use foreground color from theme
        bodyColor: COLORS.foreground, // Use foreground color from theme
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
        <Line options={chartOptions as any} data={chartData as any} />
      </div>
  );
} 