'use client';

import { Card, CardContent } from "@/components/ui";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "@/components/performance";
import { InvestmentInsights } from "@/components/performance";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { ReturnsOverview } from "@/components/performance";
import { DrawdownMetrics } from "@/components/performance";
import { PerformanceMetrics } from "@/lib/core/portfolio";
import { PerformanceData } from "@/hooks/usePerformanceData";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalInsightsProps {
  performance: PerformanceData['performance'];
  orders: any[];
  isLoading: boolean;
}

export function PersonalInsights({ performance, orders, isLoading }: PersonalInsightsProps) {
  if (isLoading) {
    return <PersonalInsightsSkeleton />;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[525px_1fr] gap-3">
      <div className="lg:row-span-1 flex">
        <InvestmentInsights 
          performance={performance}
          orders={orders} 
        />
      </div>
      
      <div className="space-y-3 flex flex-col">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-8 pb-4">
              <ReturnsOverview performance={performance} />
            </div>

            <div className="border-t border-border my-2"></div>

            <div className="grid grid-cols-3 gap-8 pt-4">
              <DrawdownMetrics performance={performance} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border flex-1 flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            <PerformanceContainer className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Performance Over Time</h3>
                  <p className="text-sm text-muted-foreground">Track your Bitcoin portfolio performance</p>
                </div>
                <PerformanceFilters />
              </div>
              <div className="w-full flex-1">
                <PerformanceChart />
              </div>
            </PerformanceContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PersonalInsightsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[525px_1fr] gap-3">
      <div className="lg:row-span-1 flex">
        <Skeleton className="w-full h-[600px]" />
      </div>
      
      <div className="space-y-3 flex flex-col">
        <Skeleton className="w-full h-[250px]" />
        <Skeleton className="w-full h-[400px]" />
      </div>
    </div>
  );
} 