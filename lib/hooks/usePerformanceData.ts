import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { getPerformanceMetrics } from '@/lib/core/portfolio/performance';
import { getPortfolioMetrics } from '@/lib/core/portfolio/metrics';
import { PerformanceMetrics } from '@/lib/core/portfolio/types';
import { useToast } from '@/lib/hooks/use-toast';

export interface PerformanceData {
  performance: PerformanceMetrics & {
    totalBTC: number;
    shortTermHoldings: number;
    longTermHoldings: number;
  };
  orders: any[] | null;
  isLoading: boolean;
  error: string | null;
}

export function usePerformanceData(userId: string): PerformanceData {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<PerformanceData['performance'] | null>(null);
  const [orders, setOrders] = useState<any[] | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setError('User ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: true });
        
        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
        
        // Fetch both performance metrics in parallel
        const [extendedMetrics, performanceMetrics] = await Promise.all([
          getPortfolioMetrics(userId, supabase),
          getPerformanceMetrics(userId, supabase)
        ]);
        
        // Combine metrics with proper type safety
        setPerformance({
          ...performanceMetrics,
          totalBTC: extendedMetrics.totalBtc ?? 0,
          shortTermHoldings: extendedMetrics.shortTermHoldings ?? 0,
          longTermHoldings: extendedMetrics.longTermHoldings ?? 0
        });
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setError('Failed to load performance data');
        toast({
          title: 'Error',
          description: 'Failed to load performance data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, supabase, toast]);

  return {
    performance: performance || {
      totalBTC: 0,
      shortTermHoldings: 0,
      longTermHoldings: 0,
      cumulative: {
        total: { percent: 0, dollar: 0 },
        day: { percent: 0, dollar: 0 },
        week: { percent: 0, dollar: 0 },
        month: { percent: null, dollar: null },
        ytd: { percent: null, dollar: null },
        threeMonth: { percent: null, dollar: null },
        year: { percent: null, dollar: null },
        twoYear: { percent: null, dollar: null },
        threeYear: { percent: null, dollar: null },
        fourYear: { percent: null, dollar: null },
        fiveYear: { percent: null, dollar: null }
      },
      compoundGrowth: {
        total: null, oneYear: null, twoYear: null, threeYear: null,
        fourYear: null, fiveYear: null, sixYear: null, sevenYear: null, eightYear: null
      },
      allTimeHigh: { price: 0, date: '' },
      maxDrawdown: {
        percent: 0,
        fromDate: '',
        toDate: '',
        portfolioATH: 0,
        portfolioLow: 0
      },
      hodlTime: 0,
      currentPrice: 0,
    },
    orders,
    isLoading,
    error
  };
} 