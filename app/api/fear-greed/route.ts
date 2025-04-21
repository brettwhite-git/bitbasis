import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Define the expected structure for the fear_greed_index table row
interface FearGreedIndexEntry {
  date: string; 
  value: number; 
  classification: string; 
  last_updated: string; 
  // Add other potential columns if known
}

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  if (!date) {
    console.error('formatDate called with null or undefined date');
    return new Date().toISOString().split('T')[0]!;
  }
  return date.toISOString().split('T')[0]!;
};

// Alternative Fear & Greed Index API (free, no API key required)
// Add limit=31 to get a month of historical data
const FEAR_GREED_API_URL = 'https://api.alternative.me/fng/?limit=31'

// Map value_classification based on the value
const getClassification = (value: number) => {
  if (value <= 25) return 'Extreme Fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme Greed'
}

// Helper function to find the closest date entry within a window
const findClosestDateEntry = (entries: FearGreedIndexEntry[], targetDate: string, windowDays: number = 2): FearGreedIndexEntry | undefined => {
  const target = new Date(targetDate);
  let closestEntry: FearGreedIndexEntry | undefined;
  let minDiff = Infinity;

  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const diffDays = Math.abs((target.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= windowDays && diffDays < minDiff) {
      minDiff = diffDays;
      closestEntry = entry;
    }
  });

  return closestEntry;
};

// Modify fetchFearGreedIndex to return the full array again
async function fetchFearGreedIndex(): Promise<FearGreedIndexEntry[]> {
  try {
    console.log('[fetchFearGreedIndex] Fetching from Alternative.me...');
    
    const response = await fetch(FEAR_GREED_API_URL)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Fear & Greed API Error:', {
        status: response.status,
        statusText: response.statusText,
        response: errorText
      })
      throw new Error(`API responded with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (!data.data?.[0]) {
      throw new Error('Fear and Greed data not available in API response')
    }

    // Process ALL data points from the API response
    const processedData = data.data.map((point: any) => {
      const value = parseInt(point.value);
      const timestamp = parseInt(point.timestamp) * 1000;
      const dateObj = new Date(timestamp);
      const dateString = formatDate(dateObj);

      return {
        date: dateString,
        value: value,
        classification: getClassification(value),
        last_updated: new Date(timestamp).toISOString()
      }
    });

    console.log(`[fetchFearGreedIndex] Processed ${processedData.length} data points.`);
    return processedData;

  } catch (error) {
    console.error('[fetchFearGreedIndex] Error:', error);
    throw error
  }
}

export async function GET() {
  console.log('\n[API /fear-greed] ====== Route handler started ======');
  try {
    // Use service_role to bypass RLS policies
    const supabase = createRouteHandlerClient({ cookies }, {
      options: {
        db: { schema: 'public' },
        auth: { persistSession: false },
        global: { headers: { 'X-Supabase-Role': 'service_role' } }
      }
    })

    // Check if we have recent data (last 24 hours)
    const { data: cachedData, error: cacheError } = await supabase
      .from('fear_greed_index')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cacheError) {
      console.error('[API /fear-greed] Supabase cache error:', cacheError)
    }

    let isCacheFresh = false;
    if (cachedData) {
      console.log('[API /fear-greed] Latest cache entry found:', {
        date: cachedData.date,
        value: cachedData.value,
        classification: cachedData.classification
      });
      const lastEntryDate = new Date(cachedData.date);
      const today = new Date();
      const diffDays = (today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) { 
        isCacheFresh = true;
        console.log('[API /fear-greed] Cache determined to be FRESH (diff days:', diffDays, ')');
      } else {
        console.log('[API /fear-greed] Cache determined to be STALE (diff days:', diffDays, ')');
      }
    } else {
      console.log('[API /fear-greed] No cache entry found. Cache is STALE.');
    }

    if (isCacheFresh && cachedData) {
      console.log('[API /fear-greed] Using CACHED data path');
      const lastUpdated = new Date(cachedData.last_updated)
      const now = new Date()
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

      if (hoursSinceUpdate < 24) {
        console.log('[API /fear-greed] Cache is fresh. Fetching historical points from DB...');
        
        // --- Calculate Dates --- 
        const today = new Date();
        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(today.getDate() - 1);
        const weekAgoDate = new Date(today);
        weekAgoDate.setDate(today.getDate() - 7);
        const monthAgoDate = new Date(today);
        monthAgoDate.setDate(today.getDate() - 30);

        console.log('[API /fear-greed] Calculated target dates:', {
          today: formatDate(today),
          yesterday: formatDate(yesterdayDate),
          weekAgo: formatDate(weekAgoDate),
          monthAgo: formatDate(monthAgoDate)
        });

        // Calculate date range for query - add buffer days
        const endDate = formatDate(today);
        const startDate = formatDate(new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000));

        const { data: historicalData, error: historicalError } = await supabase
          .from('fear_greed_index')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (!historicalError && historicalData) {
          const yesterday = findClosestDateEntry(historicalData, formatDate(yesterdayDate), 1);
          const weekAgo = findClosestDateEntry(historicalData, formatDate(weekAgoDate), 2);
          const monthAgo = findClosestDateEntry(historicalData, formatDate(monthAgoDate), 2);

          console.log('[API /fear-greed] Returning data from cache.');

          return NextResponse.json({
            ...cachedData,
            historical: {
              yesterday: yesterday ? {
                value: yesterday.value,
                classification: yesterday.classification,
                timestamp: yesterday.last_updated
              } : null,
              week_ago: weekAgo ? {
                value: weekAgo.value,
                classification: weekAgo.classification,
                timestamp: weekAgo.last_updated
              } : null,
              month_ago: monthAgo ? {
                value: monthAgo.value,
                classification: monthAgo.classification,
                timestamp: monthAgo.last_updated
              } : null
            }
          })
        } else {
          console.error('[API /fear-greed] Error fetching historical data:', historicalError);
          console.log('[API /fear-greed] Falling through to fetch new data due to cache read error.');
        }
      }
    }

    // --- Fetch New Data and Update Cache --- 
    console.log('\n[API /fear-greed] Using FRESH DATA path');
    const newDataArray = await fetchFearGreedIndex(); 
    console.log(`[API /fear-greed] Fetched ${newDataArray?.length ?? 0} new data points from API.`);
    
    if (!newDataArray || newDataArray.length === 0) {
      console.error('[API /fear-greed] No data received from fetchFearGreedIndex');
      throw new Error('No data received from fetchFearGreedIndex');
    }

    console.log('[API /fear-greed] First few entries from API:', 
      newDataArray.slice(0, 3).map(entry => ({
        date: entry.date,
        value: entry.value,
        classification: entry.classification
      }))
    );

    console.log('[API /fear-greed] Attempting to upsert new data into fear_greed_index table...');
    const { error: upsertError } = await supabase
      .from('fear_greed_index')
      .upsert(newDataArray, { onConflict: 'date' }); 

    if (upsertError) {
      console.error('[API /fear-greed] Supabase upsert ERROR:', upsertError);
      // Decide if we should throw or try to return potentially stale data? Let's throw.
      throw upsertError;
    }
    console.log(`[API /fear-greed] Successfully upserted ${newDataArray.length} records.`);

    // Construct the response from the newly fetched data array
    const current = newDataArray[0]; // Already checked array length > 0
    
    // Calculate target dates
    const today = new Date();
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    const weekAgoDate = new Date(today);
    weekAgoDate.setDate(today.getDate() - 7);
    const monthAgoDate = new Date(today);
    monthAgoDate.setDate(today.getDate() - 30);

    // Format dates for comparison
    const yesterdayStr = formatDate(yesterdayDate);
    const weekAgoStr = formatDate(weekAgoDate);
    const monthAgoStr = formatDate(monthAgoDate);

    // Find entries by exact date match with fallback to closest date
    const yesterday = findClosestDateEntry(newDataArray, yesterdayStr, 1);
    const weekAgo = findClosestDateEntry(newDataArray, weekAgoStr, 2);
    const monthAgo = findClosestDateEntry(newDataArray, monthAgoStr, 2);

    // Debug logging
    console.log('[API /fear-greed] Date matching:', {
      targetDates: {
        yesterday: yesterdayStr,
        weekAgo: weekAgoStr,
        monthAgo: monthAgoStr
      },
      availableDates: newDataArray.map(entry => entry.date).sort().join(', '),
      dateRange: {
        earliest: newDataArray[newDataArray.length - 1]?.date,
        latest: newDataArray[0]?.date,
      },
      matches: {
        yesterday: yesterday?.date,
        weekAgo: weekAgo?.date,
        monthAgo: monthAgo?.date
      }
    });
    
    // Type safety check, though unlikely after previous check
    if (!current) {
       console.error('[API /fear-greed] Current data point missing unexpectedly after upsert.');
       throw new Error('Failed processing current Fear & Greed data');
    }

    const formattedResponse = {
      value: current.value, // Safe due to check above
      classification: current.classification,
      last_updated: current.last_updated,
      historical: { // Construct historical object here
        yesterday: yesterday ? { value: yesterday.value, classification: yesterday.classification, timestamp: yesterday.last_updated } : null,
        week_ago: weekAgo ? { value: weekAgo.value, classification: weekAgo.classification, timestamp: weekAgo.last_updated } : null,
        month_ago: monthAgo ? { value: monthAgo.value, classification: monthAgo.classification, timestamp: monthAgo.last_updated } : null,
      }
    };

    console.log('[API /fear-greed] Returning newly fetched and cached data:', formattedResponse);
    return NextResponse.json(formattedResponse);

  } catch (error: any) {
    console.error('[API /fear-greed] Error in GET route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch Fear and Greed Index' },
      { status: 500 }
    )
  }
} 