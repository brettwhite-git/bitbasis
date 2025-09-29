'use client';

import React, { useState, useEffect } from 'react';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Correct Supabase client import
import { formatDate, findClosestDateEntry } from '@/lib/utils/utils'; // Updated import path

// Define types for the fear & greed data
interface FearGreedData {
  today: number;
  yesterday: number;
  '7d': number;  // week ago
  '1m': number;  // month ago
}

// Define the expected structure for the fear_greed_index table row (consistent with API route)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FearGreedIndexEntry {
  id: number; // Assuming an id column exists
  date: string;
  value: number;
  classification: string;
  last_updated: string; // Or Date
  created_at: string; // Or Date
}

// Helper function to get color and label based on value
const getFearGreedStyle = (value: number): { colorClass: string; label: string } => {
  if (value <= 25) return { colorClass: 'stroke-red-500', label: 'Extreme Fear' };
  if (value <= 45) return { colorClass: 'stroke-orange-500', label: 'Fear' };
  if (value <= 54) return { colorClass: 'stroke-yellow-500', label: 'Neutral' };
  if (value <= 75) return { colorClass: 'stroke-lime-500', label: 'Greed' };
  return { colorClass: 'stroke-green-500', label: 'Extreme Greed' };
};

// Mini Radial Gauge Component
interface MiniGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

const MiniGauge: React.FC<MiniGaugeProps> = ({ value, size = 56, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const { colorClass } = getFearGreedStyle(value);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="stroke-gray-700" // Use theme background color
        fill="none"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className={colorClass}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};

const FearGreedMultiGauge: React.FC<{ className?: string }> = ({ className }) => {
  const [fearGreedData, setFearGreedData] = useState<FearGreedData>({
    today: 50, // Default neutral value
    yesterday: 50,
    '7d': 50,
    '1m': 50,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient(); // Use the correct function

  useEffect(() => {
    const fetchFearGreedData = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error on new fetch attempt

        // --- Calculate Dates ---
        const today = new Date();
        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(today.getDate() - 1);
        const weekAgoDate = new Date(today);
        weekAgoDate.setDate(today.getDate() - 7);
        const monthAgoDate = new Date(today);
        monthAgoDate.setDate(today.getDate() - 30);

        // Calculate date range for query - fetch last ~35 days to ensure we have data for targets
        const endDate = formatDate(today);
        const startDate = formatDate(new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000)); // ~35 days ago

        console.log('[FearGreedMultiGauge] Fetching data from Supabase between', startDate, 'and', endDate);

        // Fetch relevant data from Supabase
        const { data: historicalData, error: supabaseError } = await supabase
          .from('fear_greed_index')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false })
          .limit(35); // Limit to a reasonable number of recent entries

        if (supabaseError) {
          console.error('[FearGreedMultiGauge] Supabase query error:', supabaseError);
          throw new Error(`Failed to fetch data: ${supabaseError.message}`);
        }

        if (!historicalData || historicalData.length === 0) {
            console.warn('[FearGreedMultiGauge] No data returned from Supabase for the date range.');
            // Keep default values or set to a specific 'unavailable' state
            setError('No recent data available');
            // Optionally keep defaults:
             setFearGreedData({ today: 50, yesterday: 50, '7d': 50, '1m': 50 });
            return; // Exit early if no data
        }

        console.log(`[FearGreedMultiGauge] Received ${historicalData.length} entries from Supabase.`);

        // Find the closest entries for today, yesterday, 7d ago, 30d ago
        // Use a small window (e.g., 1 day for today/yesterday, 2 days for older dates)
        const todayEntry = findClosestDateEntry(historicalData, formatDate(today), 1);
        const yesterdayEntry = findClosestDateEntry(historicalData, formatDate(yesterdayDate), 1);
        const weekAgoEntry = findClosestDateEntry(historicalData, formatDate(weekAgoDate), 2);
        const monthAgoEntry = findClosestDateEntry(historicalData, formatDate(monthAgoDate), 2);

        // Map Supabase response to component data structure, using defaults if entry not found
        const formattedData: FearGreedData = {
          today: todayEntry?.value ?? 50,
          yesterday: yesterdayEntry?.value ?? 50,
          '7d': weekAgoEntry?.value ?? 50,
          '1m': monthAgoEntry?.value ?? 50,
        };

        console.log('[FearGreedMultiGauge] Formatted Data:', formattedData);
        setFearGreedData(formattedData);

      } catch (err: unknown) {
        console.error('[FearGreedMultiGauge] Error fetching fear & greed data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Keep existing/default data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchFearGreedData();
  }, [supabase]); // Add supabase client to dependency array

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm ${className || ''}`}>
      <div className="relative z-10">
        <div className="pb-4 flex flex-row items-center justify-between">
          <h3 className="text-md font-bold text-white">Fear & Greed Index</h3>
        </div>
        <div className="flex justify-around items-center">
          {isLoading ? (
            <div className="py-6 text-center text-gray-400">Loading...</div>
          ) : error ? (
            <div className="py-6 text-center text-red-500">{error}</div>
          ) : (
            Object.entries(fearGreedData).map(([label, value]) => {
              const { label: valueLabel } = getFearGreedStyle(value);
              return (
                <div key={label} className="text-center flex flex-col items-center">
                  <div className="text-xs text-gray-400 uppercase mb-2">{label}</div>
                  <div className="relative w-14 h-14"> {/* Container for gauge and text */}
                    <MiniGauge value={value} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-base font-medium text-white">{value}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">{valueLabel}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FearGreedMultiGauge; 