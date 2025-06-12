'use client';

import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";
import { PerformanceData } from "@/lib/hooks/use-performance-data";
import { safeMetricValue } from "@/lib/core/performance-utils";
import { memo } from "react";

interface ReturnsOverviewProps {
  performance: PerformanceData['performance'];
}

export const ReturnsOverview = memo(function ReturnsOverview({ performance }: ReturnsOverviewProps) {
  // Helper function to get safe values and determine if they are positive
  const getValue = (path: string) => {
    return safeMetricValue(performance, path, 0);
  };
  
  const isPositive = (value: number) => value >= 0;
  
  const totalReturnPercent = getValue('cumulative.total.percent');
  const totalReturnDollar = getValue('cumulative.total.dollar');
  const monthReturnPercent = getValue('cumulative.month.percent');
  const monthReturnDollar = getValue('cumulative.month.dollar');
  const ytdReturnPercent = getValue('cumulative.ytd.percent');
  const ytdReturnDollar = getValue('cumulative.ytd.dollar');
  
  return (
    <>
      {/* Total Return */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-400">Total Return</div>
          <div className={isPositive(totalReturnPercent) ? "px-4 py-2 bg-success/20 rounded-full text-success text-xs font-medium flex items-center" : "px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center"}>
            {isPositive(totalReturnPercent) ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
            {formatPercent(totalReturnPercent)}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(totalReturnDollar)}</div>
        </div>
      </div>

      {/* 30-Day Return */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-400">30-Day Return</div>
          <div className={isPositive(monthReturnPercent) ? "px-4 py-2 bg-success/20 rounded-full text-success text-xs font-medium flex items-center" : "px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center"}>
            {isPositive(monthReturnPercent) ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
            {formatPercent(monthReturnPercent)}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(monthReturnDollar)}</div>
        </div>
      </div>

      {/* YTD Return */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-400">YTD Return</div>
          <div className={isPositive(ytdReturnPercent) ? "px-4 py-2 bg-success/20 rounded-full text-success text-xs font-medium flex items-center" : "px-4 py-2 bg-error/20 rounded-full text-error text-xs font-medium flex items-center"}>
            {isPositive(ytdReturnPercent) ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
            {formatPercent(ytdReturnPercent)}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-bitcoin-orange">{formatCurrency(ytdReturnDollar)}</div>
        </div>
      </div>
    </>
  );
}); 