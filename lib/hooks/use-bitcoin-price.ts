import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface BitcoinPriceData {
  price_usd: number;
  updated_at: string;
}

export function useBitcoinPrice(defaultPrice: number = 100000, refreshInterval: number = 240000) {
  const [price, setPrice] = useState<number>(0); // Start with 0 to force loading
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

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
      if (price === 0) {
        setPrice(defaultPrice);
      }
    } finally {
      setLoading(false);
    }
  }, [defaultPrice, supabase, price]);

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