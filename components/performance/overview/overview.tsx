'use client';

import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { usePerformanceData } from '@/lib/hooks';
import { UserMetadata } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load tab content components
const PersonalInsights = lazy(() => import('../insights/personal-insights').then(mod => ({ default: mod.PersonalInsights })));
const HodlDistribution = lazy(() => import('../holdings/hodl-distribution').then(mod => ({ default: mod.HodlDistribution })));

interface PerformanceOverviewProps {
  user: UserMetadata;
}

export function PerformanceOverview({ user }: PerformanceOverviewProps) {
  const [activeTab, setActiveTab] = useState<string>('performance');
  const performanceData = usePerformanceData(user.id);
  
  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-3xl font-bold tracking-tight text-white">Performance Overview</h1>
      </div>
      
      <Tabs 
        defaultValue="performance" 
        className="w-full" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <TabsList className="flex w-auto mb-4 bg-transparent p-0 h-auto justify-start gap-x-1 border-b border-border">
          <TabsTrigger 
            value="performance"
            className="relative overflow-hidden data-[state=active]:bg-gradient-to-r data-[state=active]:from-bitcoin-orange data-[state=active]:to-[#D4A76A] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-bitcoin-orange/30 data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-all duration-300 rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/20 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border group"
          >
            <span className="relative z-10">Personal Insights</span>
            <span className="absolute inset-0 bg-white opacity-0 data-[state=active]:group-hover:opacity-10 transition-opacity duration-100"></span>
          </TabsTrigger>
          <TabsTrigger 
            value="distribution"
            className="relative overflow-hidden data-[state=active]:bg-gradient-to-r data-[state=active]:from-bitcoin-orange data-[state=active]:to-[#D4A76A] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-bitcoin-orange/30 data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-all duration-300 rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/20 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border group"
          >
            <span className="relative z-10">HODL Distribution</span>
            <span className="absolute inset-0 bg-white opacity-0 data-[state=active]:group-hover:opacity-10 transition-opacity duration-100"></span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <Suspense fallback={<TabContentSkeleton />}>
            <PersonalInsights 
              performance={performanceData.performance}
              transactions={performanceData.transactions || []}
              isLoading={performanceData.isLoading}
            />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Suspense fallback={<TabContentSkeleton />}>
            <HodlDistribution
              performance={performanceData.performance}
              isLoading={performanceData.isLoading}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabContentSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Skeleton className="h-[400px] bg-gray-700" />
      <Skeleton className="h-[400px] bg-gray-700" />
      <Skeleton className="h-[300px] lg:col-span-2 bg-gray-700" />
    </div>
  );
} 