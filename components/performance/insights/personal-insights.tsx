'use client';

// Removed Card imports - using glass morphism styling
import { formatCurrency, formatPercent } from "@/lib/utils/utils";
import { PerformanceChart, PerformanceFilters, PerformanceContainer } from "../overview/exports";
import { InvestmentInsights } from "./investment-insights";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { ReturnsOverview } from "../overview/exports";
import { DrawdownMetrics } from "./drawdown-metrics";
import { PerformanceMetrics } from "@/lib/core/portfolio/types";
import { PerformanceData } from "@/hooks/usePerformanceData";
import { UnifiedTransaction } from "@/types/transactions";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalInsightsProps {
  performance: PerformanceData['performance'];
  transactions: UnifiedTransaction[];
  isLoading: boolean;
}

export function PersonalInsights({ performance, transactions, isLoading }: PersonalInsightsProps) {
  if (isLoading) {
    return <PersonalInsightsSkeleton />;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[525px_1fr] gap-3">
      <div className="lg:row-span-1 flex">
        <InvestmentInsights 
          performance={performance}
          transactions={transactions} 
        />
      </div>
      
      <div className="space-y-3 flex flex-col">
        <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
          <div className="grid grid-cols-3 gap-8 pb-4">
            <ReturnsOverview performance={performance} />
          </div>

          <div className="border-t border-gray-700 my-2"></div>

          <div className="grid grid-cols-3 gap-8 pt-4">
            <DrawdownMetrics performance={performance} />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl flex-1 flex flex-col">
          <PerformanceContainer className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Performance Over Time</h3>
                <p className="text-sm text-gray-400">Track your Bitcoin portfolio performance</p>
              </div>
              <div className="flex items-center">
                <PerformanceFilters />
              </div>
            </div>
            <div className="w-full flex-1">
              <PerformanceChart />
            </div>
          </PerformanceContainer>
        </div>
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