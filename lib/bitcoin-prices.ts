import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { cache } from 'react';

// Initialize Supabase client (browser-side)
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Get the current Bitcoin price
export const getCurrentPrice = cache(async () => {
  try {
    const supabase = createSupabaseClient();
    
    // Get the most recent price entry
    const { data, error } = await supabase
      .from('historical_prices')
      .select('timestamp, price_usd')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching current Bitcoin price:', error);
      return null;
    }
    
    return {
      timestamp: data.timestamp,
      price_usd: parseFloat(data.price_usd),
      fetched_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Unexpected error fetching Bitcoin price:', error);
    return null;
  }
});

// Get historical Bitcoin prices for a date range
export const getHistoricalPrices = cache(async (
  startTimestamp: number, 
  endTimestamp: number,
  interval: 'hour' | 'day' | 'week' | 'month' = 'day'
) => {
  try {
    const supabase = createSupabaseClient();
    
    // For longer time ranges, optimize by reducing number of data points
    let query = supabase
      .from('historical_prices')
      .select('timestamp, price_usd');
    
    // Apply time range filter
    query = query
      .gte('timestamp', startTimestamp)
      .lte('timestamp', endTimestamp);
    
    // Optimize query based on interval to reduce data points
    if (interval === 'hour') {
      // For hourly data, get everything
      // No additional filtering
    } else if (interval === 'day') {
      // For daily data, get one point every 24 hours (approx)
      // In SQL: WHERE MOD(timestamp, 86400) < 3600
      // This gets points that are within the first hour of each day
      query = query.filter('timestamp', 'mod', '86400', 'lt', '3600');
    } else if (interval === 'week') {
      // For weekly data, get one point per day (approx)
      query = query.filter('timestamp', 'mod', '86400', 'lt', '3600');
    } else if (interval === 'month') {
      // For monthly data, get one point every 3 days (approx)
      query = query.filter('timestamp', 'mod', '259200', 'lt', '3600');
    }
    
    // Order by timestamp
    query = query.order('timestamp');
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching historical Bitcoin prices:', error);
      return [];
    }
    
    // Format data correctly
    return data.map(item => ({
      timestamp: item.timestamp,
      price_usd: parseFloat(item.price_usd)
    }));
  } catch (error) {
    console.error('Unexpected error fetching historical Bitcoin prices:', error);
    return [];
  }
});

// Get the all-time high price
export const getAllTimeHighPrice = cache(async () => {
  try {
    const supabase = createSupabaseClient();
    
    // Get the all-time high price
    const { data, error } = await supabase
      .from('historical_prices')
      .select('timestamp, price_usd')
      .order('price_usd', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching all-time high Bitcoin price:', error);
      return null;
    }
    
    return {
      timestamp: data.timestamp,
      price_usd: parseFloat(data.price_usd),
      date: new Date(data.timestamp * 1000).toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Unexpected error fetching all-time high Bitcoin price:', error);
    return null;
  }
}); 