'use client';

import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { usePerformanceData } from '@/lib/hooks/usePerformanceData';
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Performance Overview</h1>
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
            className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
          >
            Personal Insights
          </TabsTrigger>
          <TabsTrigger 
            value="distribution"
            className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
          >
            HODL Distribution
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <Suspense fallback={<TabContentSkeleton />}>
            <PersonalInsights 
              performance={performanceData.performance}
              orders={performanceData.orders || []}
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
      <Skeleton className="h-[400px]" />
      <Skeleton className="h-[400px]" />
      <Skeleton className="h-[300px] lg:col-span-2" />
    </div>
  );
} 