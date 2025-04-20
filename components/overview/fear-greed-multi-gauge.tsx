import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder data - replace with actual props/fetching later
const fearGreedData = {
  today: 37,
  yesterday: 32,
  '7d': 78,
  '1m': 21,
};

// Helper function to get color and label based on value
const getFearGreedStyle = (value: number): { colorClass: string; label: string } => {
  if (value <= 24) return { colorClass: 'stroke-red-500', label: 'Extreme Fear' };
  if (value <= 49) return { colorClass: 'stroke-orange-500', label: 'Fear' };
  if (value === 50) return { colorClass: 'stroke-yellow-500', label: 'Neutral' };
  if (value <= 74) return { colorClass: 'stroke-lime-500', label: 'Greed' };
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
  return (
    <Card className={className}> {/* Accept className for height */}
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-around items-center pt-2">
        {Object.entries(fearGreedData).map(([label, value]) => {
          const { label: valueLabel } = getFearGreedStyle(value);
          return (
            <div key={label} className="text-center flex flex-col items-center">
              <div className="text-xs text-muted-foreground uppercase mb-1">{label}</div>
              <div className="relative w-14 h-14"> {/* Container for gauge and text */}
                <MiniGauge value={value} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-medium text-white">{value}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{valueLabel}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default FearGreedMultiGauge; 