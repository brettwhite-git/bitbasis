'use client';

// Removed Card imports - using glass morphism styling
import { Skeleton } from "@/components/ui/skeleton";
import { BitcoinHoldingsWaterfall } from "./bitcoin-holdings-waterfall";
import { HodlAgeDistribution } from "./hodl-age-distribution";
import { BtcHeatmap } from "../insights/btc-heatmap";
import { PerformanceData } from "@/hooks/usePerformanceData";

interface HodlDistributionProps {
  performance: PerformanceData['performance'];
  isLoading: boolean;
}

export function HodlDistribution({ performance: _performance, isLoading }: HodlDistributionProps) {
  if (isLoading) {
    return <HodlDistributionSkeleton />;
  }
  
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <BitcoinHoldingsWaterfall />
        <HodlAgeDistribution />
      </div>
      
      <div className="w-full">
        <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
          <div className="pb-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Transaction Heatmap</h3>
            <p className="text-sm text-gray-400">Monthly buy/sell activity overview</p>
          </div>
          <BtcHeatmap />
        </div>
      </div>
    </>
  );
}

function HodlDistributionSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-[400px] bg-gray-700" />
        <Skeleton className="h-[400px] bg-gray-700" />
      </div>
      
      <Skeleton className="w-full h-[500px] bg-gray-700" />
    </>
  );
} 