/**
 * Global Chart Tooltip Configuration
 * 
 * Provides consistent tooltip styling across all charts in the application
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TooltipOptions, TooltipItem } from 'chart.js'
import { formatCurrency, formatBTC } from '@/lib/utils/utils' // formatPercent not used

// Local formatNumber function since it's not exported from utils
const formatNumber = (value: number): string => {
  return value.toLocaleString()
}

// Global tooltip theme constants
export const TOOLTIP_THEME = {
  // Colors
  backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900 with opacity
  titleColor: '#F8FAFC', // slate-50
  bodyColor: '#F1F5F9', // slate-100
  borderColor: '#F7931A', // bitcoin-orange
  footerColor: '#CBD5E1', // slate-300
  
  // Styling
  borderWidth: 1,
  cornerRadius: 8,
  padding: 12,
  boxPadding: 6,
  
  // Typography
  titleFont: {
    size: 13,
    weight: 'bold' as const,
  },
  bodyFont: {
    size: 12,
    weight: 'normal' as const,
  },
  footerFont: {
    size: 11,
    weight: 'normal' as const,
  },
  
  // Interaction
  displayColors: true,
  usePointStyle: true,
  pointStyle: 'circle',
  
  // Animation
  animation: {
    duration: 200,
  },
} as const

/**
 * Base tooltip configuration that can be extended by specific charts
 */
export const createBaseTooltipConfig = (): Partial<TooltipOptions<any>> => ({
  backgroundColor: TOOLTIP_THEME.backgroundColor,
  titleColor: TOOLTIP_THEME.titleColor,
  bodyColor: TOOLTIP_THEME.bodyColor,
  borderColor: TOOLTIP_THEME.borderColor,
  borderWidth: TOOLTIP_THEME.borderWidth,
  cornerRadius: TOOLTIP_THEME.cornerRadius,
  padding: TOOLTIP_THEME.padding,
  boxPadding: TOOLTIP_THEME.boxPadding,
  titleFont: TOOLTIP_THEME.titleFont,
  bodyFont: TOOLTIP_THEME.bodyFont,
  footerFont: TOOLTIP_THEME.footerFont,
  footerColor: TOOLTIP_THEME.footerColor,
  displayColors: TOOLTIP_THEME.displayColors,
  usePointStyle: TOOLTIP_THEME.usePointStyle,
  mode: 'index' as const,
  intersect: false,
})

/**
 * Portfolio Summary Chart Tooltip Configuration
 */
export const createPortfolioSummaryTooltipConfig = (data?: any[]): Partial<TooltipOptions<'line'>> => ({
  ...createBaseTooltipConfig(),
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    title: function(tooltipItems: TooltipItem<'line'>[]) {
      if (tooltipItems.length > 0 && data) {
        const index = tooltipItems[0]?.dataIndex;
        if (index !== undefined && data[index] && data[index].date) {
          const date = new Date(data[index].date);
          return date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          });
        }
      }
      return tooltipItems[0]?.label || '';
    },
    label: function(context: any) {
      const value = context.parsed.y;
      if (value == null) return '';
      
      return `${context.dataset.label}: ${formatCurrency(value)}`;
    }
  }
})

/**
 * Weekly Buy Pattern Chart Tooltip Configuration
 */
export const createBuyPatternTooltipConfig = (): Partial<TooltipOptions<'bar'>> => ({
  ...createBaseTooltipConfig(),
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    title: function(tooltipItems: any) {
      const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const index = tooltipItems[0]?.dataIndex;
      return index !== undefined ? dayLabels[index] : '';
    },
    label: function(context: any) {
      const count = context.parsed.y;
      const dayLabel = context.label;
      return `${count} ${count === 1 ? 'buy' : 'buys'} on ${dayLabel}`;
    }
  }
})

/**
 * Performance Over Time Chart Tooltip Configuration
 */
export const createPerformanceTooltipConfig = (): Partial<TooltipOptions<'line'>> => ({
  ...createBaseTooltipConfig(),
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    label: function(context: any) {
      const value = context.parsed.y;
      if (value === null || typeof value === 'undefined') {
        return `${context.dataset.label}: N/A`;
      }
      return `${context.dataset.label}: ${formatCurrency(value)}`;
    }
  }
})

/**
 * Savings Goal Projection Chart Tooltip Configuration
 */
export const createSavingsGoalTooltipConfig = (): Partial<TooltipOptions<'line'>> => ({
  ...createBaseTooltipConfig(),
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    label: function(context: any) {
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
})

/**
 * Investment Accumulation Forecast Chart Tooltip Configuration
 */
export const createInvestmentAccumulationTooltipConfig = (
  chartData?: Record<string, unknown>[], 
  bitcoinUnit: 'satoshi' | 'bitcoin' = 'satoshi'
): Partial<TooltipOptions<'line'>> => ({
  ...createBaseTooltipConfig(),
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    title: function(tooltipItems: any) {
      const pointIndex = tooltipItems[0]?.dataIndex;
      if (pointIndex !== undefined && chartData && chartData[pointIndex]) {
        const point = chartData[pointIndex];
        return `${(point as any).date} (Est. Price: ${formatCurrency((point as any).estimatedBtcPrice)})`;
      }
      return tooltipItems[0]?.label || '';
    },
    label: function(context: any) {
      let label = context.dataset.label || '';
      if (label) {
        label += ': ';
      }
      if (context.dataset.yAxisID === 'y1') {
        label += formatCurrency(context.parsed.y);
      } else {
        const value = context.parsed.y;
        const btc = value / 100000000;
        if (label.includes('Total Accumulated')) {
          label += `${formatNumber(value)} sats (${formatBTC(btc)} BTC)`;
        } else if (label.includes('Sats Stacked')) {
          label += bitcoinUnit === 'satoshi'
            ? `${formatNumber(value)} sats`
            : `${formatBTC(btc)} BTC`;
        } else {
          label += formatNumber(value) + ' sats';
        }
      }
      return label;
    },
    footer: function(tooltipItems: any) {
      const pointIndex = tooltipItems[0]?.dataIndex;
      if (pointIndex === undefined || !chartData || !chartData[pointIndex]) {
        return 'Total: N/A';
      }

      const point = chartData[pointIndex] as any;
      const totalSats = Number(point.accumulatedSats) || 0;
      const totalBtc = totalSats / 100000000;
      const estValue = Number(point.cumulativeUsdValue) || 0;

      return [
        `Total: ${formatNumber(totalSats)} sats (${formatBTC(totalBtc)} BTC)`,
        `Est. Value: ${formatCurrency(estValue)}`,
      ];
    },
  },
})

/**
 * Bitcoin Holdings Waterfall Chart Tooltip Configuration
 */
export const createBitcoinHoldingsTooltipConfig = (): Partial<TooltipOptions<any>> => ({
  ...createBaseTooltipConfig(),
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    title: function(context: any[]) {
      const label = context?.[0]?.label;
      if (typeof label !== 'string') return '';
      return `Year: ${label}`;
    },
    label: function(context: any) {
      if (!context.raw) return [];
      const range = context.raw as number[];
      if (!Array.isArray(range) || range.length < 2) return [];
      
      const start = range[0] ?? 0;
      const end = range[1] ?? 0;
      const value = end - start;
      
      return [
        `Change: ${formatBTC(value)}`,
        `Total: ${formatBTC(end)}`
      ];
    },
  }
})

/**
 * HODL Age Distribution Chart Tooltip Configuration
 */
export const createHodlAgeTooltipConfig = (): Partial<TooltipOptions<any>> => ({
  ...createBaseTooltipConfig(),
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    title: function(tooltipItems) {
      return tooltipItems[0]?.label || '';
    },
    label: function(context) {
      const btc = context.parsed.x;
      return `${formatBTC(btc)}`;
    }
  }
})

/**
 * BTC Heatmap Tooltip Configuration (for ApexCharts)
 */
export const createBtcHeatmapTooltipConfig = () => ({
  theme: 'dark' as const,
  style: {
    fontSize: '12px',
    fontFamily: 'inherit',
  },
  custom: ({ seriesIndex, dataPointIndex, w }: any) => {
    const data = w.config.series[seriesIndex].data[dataPointIndex];
    const year = w.config.series[seriesIndex].name;
    const month = data.x;
    const buys = data.buys || 0;
    const sells = data.sells || 0;
    
    return `
      <div style="
        background: ${TOOLTIP_THEME.backgroundColor};
        border: ${TOOLTIP_THEME.borderWidth}px solid ${TOOLTIP_THEME.borderColor};
        border-radius: ${TOOLTIP_THEME.cornerRadius}px;
        padding: ${TOOLTIP_THEME.padding}px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ">
        <div style="
          color: ${TOOLTIP_THEME.titleColor};
          font-weight: ${TOOLTIP_THEME.titleFont.weight};
          font-size: ${TOOLTIP_THEME.titleFont.size}px;
          margin-bottom: 6px;
        ">${month} ${year}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div style="color: ${TOOLTIP_THEME.bodyColor};">Buys:</div>
          <div style="color: #F7931A; font-weight: 500;">${buys}</div>
          <div style="color: ${TOOLTIP_THEME.bodyColor};">Sells:</div>
          <div style="color: #E53E3E; font-weight: 500;">${sells}</div>
        </div>
      </div>
    `;
  }
})

/**
 * Utility function to merge custom tooltip config with base config
 */
export const mergeTooltipConfig = (
  baseConfig: Partial<TooltipOptions<any>>,
  customConfig: Partial<TooltipOptions<any>>
): Partial<TooltipOptions<any>> => ({
  ...baseConfig,
  ...customConfig,
  // @ts-expect-error Chart.js callback types are incomplete
  callbacks: {
    ...baseConfig.callbacks,
    ...customConfig.callbacks,
  },
}) 