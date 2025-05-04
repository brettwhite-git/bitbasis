'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { BitcoinHoldingsWaterfall } from "./bitcoin-holdings-waterfall";
import { HodlAgeDistribution } from "./hodl-age-distribution";
import { BtcHeatmap } from "../insights/btc-heatmap";
import { PerformanceData } from "@/hooks/usePerformanceData";

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
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
      
      <Skeleton className="w-full h-[500px]" />
    </>
  );
} 