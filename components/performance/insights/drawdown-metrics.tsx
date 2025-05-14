'use client';

import { memo, useMemo } from "react";
import { TrendingDownIcon } from "lucide-react";
import { formatCurrency, formatPercent, formatDateLong } from "@/lib/utils/utils";
import { PerformanceData } from "@/lib/hooks/usePerformanceData";
import { 
  calculateDrawdownFromATHRatio, 
  calculateDrawdownFromATHAmount, 
  calculateMaxDrawdownAmount,
  calculateDaysSinceATH,
  safeMetricValue
} from "@/lib/core/performance-utils";

interface DrawdownMetricsProps {
  performance: PerformanceData['performance'];
}

export const DrawdownMetrics = memo(function DrawdownMetrics({ performance }: DrawdownMetricsProps) {
  // Memoize calculations to avoid recalculating on each render
  const metrics = useMemo(() => {
    const athPrice = safeMetricValue(performance, 'allTimeHigh.price', 0);
    const athDate = safeMetricValue(performance, 'allTimeHigh.date', '');
    const currentPrice = safeMetricValue(performance, 'currentPrice', 0);
    const totalBTC = safeMetricValue(performance, 'totalBTC', 0);
    const maxDrawdownPercent = safeMetricValue(performance, 'maxDrawdown.percent', 0);
    
    // Calculate derived metrics
    const drawdownFromATHRatio = calculateDrawdownFromATHRatio(athPrice, currentPrice);
    const drawdownFromATHPercent = Math.max(0, drawdownFromATHRatio * 100);
    const drawdownFromATHAmount = calculateDrawdownFromATHAmount(athPrice, currentPrice, totalBTC);
    const maxDrawdownAmount = calculateMaxDrawdownAmount(athPrice, totalBTC, maxDrawdownPercent);
    const daysSinceATH = calculateDaysSinceATH(athDate);
    
    return {
      athDate,
      drawdownFromATHPercent,
      drawdownFromATHAmount,
      maxDrawdownPercent,
      maxDrawdownAmount,
      daysSinceATH
    };
  }, [performance]);
  
  return (
    <>
      {/* Days Since ATH */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-muted-foreground">Days Since ATH</div>
          <div className="px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center">
            <TrendingDownIcon className="h-3 w-3 mr-1" />
            {formatPercent(metrics.drawdownFromATHPercent)}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-error">{metrics.daysSinceATH}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Since {formatDateLong(metrics.athDate)}
          </div>
        </div>
      </div>

      {/* Drawdown from ATH */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-muted-foreground">ATH Drawdown</div>
          <div className="px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center">
            <TrendingDownIcon className="h-3 w-3 mr-1" />
            {formatPercent(metrics.drawdownFromATHPercent)}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-error">{formatCurrency(metrics.drawdownFromATHAmount)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            From Portfolio ATH
          </div>
        </div>
      </div>

      {/* Max Drawdown */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-muted-foreground">Max Drawdown</div>
          <div className="px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center">
            <TrendingDownIcon className="h-3 w-3 mr-1" />
            {formatPercent(metrics.maxDrawdownPercent)}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-error">{formatCurrency(metrics.maxDrawdownAmount)}</div>
          <div className="text-xs text-muted-foreground mt-1">Portfolio Peak to Trough</div>
        </div>
      </div>
    </>
  );
}); 