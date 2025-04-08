'use client';

import { useState, useEffect, useRef } from 'react';
import { getCurrentPrice, getHistoricalPrices, getAllTimeHighPrice } from '@/lib/bitcoin-prices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export function BitcoinPriceTest() {
  const [currentPrice, setCurrentPrice] = useState<{
    timestamp: number;
    price_usd: number;
    fetched_at: string;
  } | null>(null);
  
  const [allTimeHigh, setAllTimeHigh] = useState<{
    timestamp: number;
    price_usd: number;
    date: string;
  } | null>(null);
  
  const [historicalPrices, setHistoricalPrices] = useState<Array<{
    timestamp: number;
    price_usd: number;
  }>>([]);
  
  const [loading, setLoading] = useState({
    current: false,
    ath: false,
    historical: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch current price
  const fetchCurrentPrice = async () => {
    try {
      setLoading(prev => ({ ...prev, current: true }));
      setError(null);
      const price = await getCurrentPrice();
      setCurrentPrice(price);
    } catch (err) {
      setError(`Error fetching current price: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error fetching current price:', err);
    } finally {
      setLoading(prev => ({ ...prev, current: false }));
    }
  };

  // Fetch all-time high price
  const fetchAllTimeHigh = async () => {
    try {
      setLoading(prev => ({ ...prev, ath: true }));
      setError(null);
      const ath = await getAllTimeHighPrice();
      setAllTimeHigh(ath);
    } catch (err) {
      setError(`Error fetching ATH: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error fetching all-time high:', err);
    } finally {
      setLoading(prev => ({ ...prev, ath: false }));
    }
  };

  // Fetch historical prices for last 30 days
  const fetchHistoricalPrices = async () => {
    try {
      setLoading(prev => ({ ...prev, historical: true }));
      setError(null);
      
      // Calculate date range for last 30 days
      const endDate = Math.floor(Date.now() / 1000); // Current time in seconds
      const startDate = endDate - (30 * 24 * 60 * 60); // 30 days ago in seconds
      
      const prices = await getHistoricalPrices(startDate, endDate, 'day');
      setHistoricalPrices(prices);
    } catch (err) {
      setError(`Error fetching historical prices: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error fetching historical prices:', err);
    } finally {
      setLoading(prev => ({ ...prev, historical: false }));
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Initialize chart when historical prices are loaded
  useEffect(() => {
    if (historicalPrices.length > 0 && chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Prepare data for Chart.js
      const labels = historicalPrices.map(item => 
        new Date(item.timestamp * 1000).toLocaleDateString()
      );
      
      const dataPoints = historicalPrices.map(item => item.price_usd);
      
      // Create the chart
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'BTC Price (USD)',
            data: dataPoints,
            fill: false,
            backgroundColor: '#f7931a',
            borderColor: '#f7931a',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `$${Number(context.raw).toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => {
                  return `$${Number(value).toLocaleString()}`;
                }
              }
            }
          }
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [historicalPrices]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchCurrentPrice();
    fetchAllTimeHigh();
    fetchHistoricalPrices();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Bitcoin Price System Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Current Price Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Bitcoin Price</CardTitle>
            <CardDescription>Latest price from the database</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.current ? (
              <p>Loading...</p>
            ) : currentPrice ? (
              <div className="space-y-2">
                <p className="text-3xl font-bold">${currentPrice.price_usd.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  Last updated: {formatTimestamp(currentPrice.timestamp)}
                </p>
                <p className="text-sm text-gray-500">
                  Fetched at: {new Date(currentPrice.fetched_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <p>No data available</p>
            )}
            <Button 
              onClick={fetchCurrentPrice} 
              className="mt-4"
              disabled={loading.current}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
        
        {/* All-Time High Card */}
        <Card>
          <CardHeader>
            <CardTitle>All-Time High</CardTitle>
            <CardDescription>Highest Bitcoin price on record</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.ath ? (
              <p>Loading...</p>
            ) : allTimeHigh ? (
              <div className="space-y-2">
                <p className="text-3xl font-bold">${allTimeHigh.price_usd.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  Date: {allTimeHigh.date}
                </p>
                <p className="text-sm text-gray-500">
                  Timestamp: {formatTimestamp(allTimeHigh.timestamp)}
                </p>
              </div>
            ) : (
              <p>No data available</p>
            )}
            <Button 
              onClick={fetchAllTimeHigh} 
              className="mt-4"
              disabled={loading.ath}
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Historical Price Chart */}
      <Card className="col-span-1 md:col-span-3">
        <CardHeader>
          <CardTitle>30-Day Historical Prices</CardTitle>
          <CardDescription>Bitcoin price trend for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading.historical ? (
            <p>Loading chart data...</p>
          ) : historicalPrices.length > 0 ? (
            <div className="h-80">
              <canvas ref={chartRef} />
            </div>
          ) : (
            <p>No historical data available</p>
          )}
          <Button 
            onClick={fetchHistoricalPrices} 
            className="mt-4"
            disabled={loading.historical}
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Completed Data Checks:</h2>
        <ul className="list-disc list-inside">
          <li className="mb-1">Current price function: {currentPrice ? '✅ Working' : '❌ Failed'}</li>
          <li className="mb-1">All-time high function: {allTimeHigh ? '✅ Working' : '❌ Failed'}</li>
          <li className="mb-1">Historical prices function: {historicalPrices.length > 0 ? '✅ Working' : '❌ Failed'}</li>
        </ul>
      </div>
    </div>
  );
} 