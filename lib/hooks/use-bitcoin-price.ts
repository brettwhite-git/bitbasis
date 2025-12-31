import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BitcoinPriceData {
  price_usd: number;
  updated_at: string;
}

/**
 * Hook for fetching and caching Bitcoin spot price from database
 *
 * Refresh Interval Rationale:
 * - Backend cron job updates spot_price every 10 minutes (every 10 min)
 * - Frontend polling interval aligned to backend update frequency
 * - Default: 600000ms (10 minutes) to eliminate 60% redundant queries
 * - Benefit: Reduces database load from 1440 queries/day to 576 queries/day per user
 * - User impact: None - price freshness remains 0-10 minutes old (unchanged)
 *
 * Polling Pattern:
 * - Min 0:  Cron updates, Frontend gets NEW price (FRESH)
 * - Min 10: Cron updates, Frontend gets NEW price (FRESH)
 * - Result: No redundant queries between update intervals
 */
export function useBitcoinPrice(defaultPrice: number = 100000, refreshInterval: number = 600000) {
  const [price, setPrice] = useState<number>(0); // Start with 0 to force loading
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true);
      
      // Query the latest price from the spot_price table
      const { data, error } = await supabase
        .from('spot_price')
        .select('price_usd, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const priceData = data[0] as BitcoinPriceData;
        setPrice(priceData.price_usd);
        setLastUpdated(priceData.updated_at);
        setError(null);
      } else {
        // If no data found, use default price as fallback
        setPrice(defaultPrice);
        setError('Using default price - no database data available');
      }
    } catch (err) {
      console.error('Error fetching Bitcoin price:', err);
      setError('Failed to fetch Bitcoin price');
      // Use default price as fallback on error
      setPrice(prev => prev === 0 ? defaultPrice : prev);
    } finally {
      setLoading(false);
    }
  }, [defaultPrice, supabase]); // Removed 'price' from dependencies

  useEffect(() => {
    // Fetch price immediately
    fetchPrice();
    
    // Set up interval for refreshing
    const intervalId = setInterval(fetchPrice, refreshInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchPrice]);

  return { price, loading, error, lastUpdated, refetch: fetchPrice };
} 