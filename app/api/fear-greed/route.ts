import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

async function fetchFearGreedIndex() {
  try {
    console.log('Fetching from Alternative.me Fear & Greed API')
    
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
    console.log('Fear & Greed API Response:', JSON.stringify(data, null, 2))

    if (!data.data?.[0]) {
      throw new Error('Fear and Greed data not available in API response')
    }

    // Process current and historical data
    const current = data.data[0]
    const yesterday = data.data[1]
    const weekAgo = data.data[7] // Index 7 for 7 days ago
    const monthAgo = data.data[30] // Index 30 for ~1 month ago

    const processDataPoint = (point: any) => ({
      value: parseInt(point.value),
      classification: getClassification(parseInt(point.value)),
      timestamp: new Date(parseInt(point.timestamp) * 1000).toISOString()
    })

    return {
      value: parseInt(current.value),
      classification: getClassification(parseInt(current.value)),
      last_updated: new Date().toISOString(),
      historical: {
        yesterday: processDataPoint(yesterday),
        week_ago: processDataPoint(weekAgo),
        month_ago: processDataPoint(monthAgo)
      }
    }
  } catch (error) {
    console.error('Error in fetchFearGreedIndex:', error)
    throw error
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if we have recent data (last 24 hours)
    const { data: cachedData, error: cacheError } = await supabase
      .from('fear_greed_index')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cacheError) {
      console.error('Supabase cache error:', cacheError)
    }

    if (cachedData) {
      const lastUpdated = new Date(cachedData.last_updated)
      const now = new Date()
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

      if (hoursSinceUpdate < 24) {
        // Get historical data from cache
        const { data: historicalData, error: historicalError } = await supabase
          .from('fear_greed_index')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(31)

        if (!historicalError && historicalData) {
          const yesterday = historicalData[1]
          const weekAgo = historicalData[7]
          const monthAgo = historicalData[30]

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
        }
      }
    }

    // Fetch new data if cache is old or doesn't exist
    const newData = await fetchFearGreedIndex()
    console.log('Fetched new data:', newData)

    // Update cache with current data
    const { data: updatedCache, error: updateError } = await supabase
      .from('fear_greed_index')
      .upsert({
        value: newData.value,
        classification: newData.classification,
        last_updated: newData.last_updated,
      })
      .select()
      .single()

    if (updateError) {
      console.error('Supabase update error:', updateError)
      throw updateError
    }

    console.log('Successfully updated cache:', updatedCache)
    return NextResponse.json({
      ...updatedCache,
      historical: newData.historical
    })
  } catch (error: any) {
    console.error('Error in GET route:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch Fear and Greed Index' },
      { status: 500 }
    )
  }
} 