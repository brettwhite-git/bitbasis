'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for the fear & greed data
interface FearGreedData {
  today: number;
  yesterday: number;
  '7d': number;  // week ago
  '1m': number;  // month ago
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

  useEffect(() => {
    const fetchFearGreedData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/fear-greed');
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map API response to component data structure
        const formattedData: FearGreedData = {
          today: data.value || 50,
          yesterday: data.historical?.yesterday?.value || 50,
          '7d': data.historical?.week_ago?.value || 50,
          '1m': data.historical?.month_ago?.value || 50,
        };
        
        setFearGreedData(formattedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching fear & greed data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFearGreedData();
  }, []); // Empty dependency array means it runs once on mount

  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-around items-center pt-2">
        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-6 text-center text-red-500">{error}</div>
        ) : (
          Object.entries(fearGreedData).map(([label, value]) => {
            const { label: valueLabel } = getFearGreedStyle(value);
            return (
              <div key={label} className="text-center flex flex-col items-center">
                <div className="text-xs text-muted-foreground uppercase mb-2">{label}</div>
                <div className="relative w-14 h-14"> {/* Container for gauge and text */}
                  <MiniGauge value={value} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-medium text-white">{value}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">{valueLabel}</div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default FearGreedMultiGauge; 