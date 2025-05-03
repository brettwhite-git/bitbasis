'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BitcoinHoldingsWaterfall } from "@/components/performance/bitcoin-holdings-waterfall";
import { HodlAgeDistribution } from "@/components/performance/hodl-age-distribution";
import { BtcHeatmap } from "@/components/performance/btc-heatmap";
import { PerformanceData } from "@/hooks/usePerformanceData";
import { SkeletonCard } from "@/components/ui/skeleton";

interface HodlDistributionProps {
  performance: PerformanceData['performance'];
  isLoading: boolean;
}

export function HodlDistribution({ performance, isLoading }: HodlDistributionProps) {
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
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-foreground">Transaction Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly buy/sell activity overview</p>
          </CardHeader>
          <CardContent>
            <BtcHeatmap />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function HodlDistributionSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SkeletonCard className="h-[400px]" />
        <SkeletonCard className="h-[400px]" />
      </div>
      
      <SkeletonCard className="w-full h-[500px]" />
    </>
  );
} 