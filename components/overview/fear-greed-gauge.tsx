'use client';

import { useEffect, useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GaugeChart from 'react-gauge-chart';

interface HistoricalValue {
  value: number;
  classification: string;
  timestamp: string;
}

interface FearGreedData {
  value: number;
  classification: string;
  last_updated: string;
  historical?: {
    yesterday: HistoricalValue | null;
    week_ago: HistoricalValue | null;
    month_ago: HistoricalValue | null;
  };
}

const COLORS = ['#EA4228', '#F58B19', '#F5CD19', '#5BE12C'];

const getClassificationColor = (classification: string): string => {
  switch (classification?.toLowerCase()) {
    case 'extreme fear':
      return '#EA4228';
    case 'fear':
      return '#F5CD19';
    case 'neutral':
      return '#F5CD19';
    case 'greed':
      return '#5BE12C';
    case 'extreme greed':
      return '#5BE12C';
    default:
      return '#6B7280';
  }
};

const MainGauge = memo(({ value, classification }: { value: number; classification: string }) => {
  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="w-[300px]">
        <GaugeChart 
          id="fear-greed-gauge"
          nrOfLevels={4}
          colors={COLORS}
          percent={value / 100}
          arcWidth={0.3}
          cornerRadius={0}
          textColor="transparent"
          needleColor="#6B7280"
          needleBaseColor="#6B7280"
          animate={true}
        />
      </div>
      <div className="absolute top-[55%] text-center">
        <span className="text-4xl font-bold text-white block">{value}</span>
        <span 
          className="text-xl font-semibold block"
          style={{ color: getClassificationColor(classification) }}
        >
          {classification}
        </span>
      </div>
    </div>
  );
});

MainGauge.displayName = 'MainGauge';

const SmallGauge = memo(({ value, label, classification }: { value: number; label: string; classification: string }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="text-base text-white mb-1">{label}</div>
      <div className="text-sm text-gray-400 mb-2">{classification}</div>
      <div className="relative w-[100px]">
        <GaugeChart 
          id={`historical-gauge-${label}`}
          nrOfLevels={4}
          colors={COLORS}
          percent={value / 100}
          arcWidth={0.25}
          cornerRadius={0}
          textColor="transparent"
          needleColor="#6B7280"
          needleBaseColor="#6B7280"
          hideText
          animate={true}
        />
        <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 text-center">
          <span className="text-2xl font-semibold text-white">{value}</span>
        </div>
      </div>
    </div>
  );
});

SmallGauge.displayName = 'SmallGauge';

const FearGreedGauge = () => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fear-greed');
        const result = await response.json();
        console.log('[FearGreedGauge] Data received from API:', result);
        if (result.error) {
          console.error('[FearGreedGauge] Error fetching Fear & Greed data:', result.error);
          setData(null);
          return;
        }
        setData(result);
      } catch (error) {
        console.error('[FearGreedGauge] Failed to fetch Fear & Greed data:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-left py-1.5">Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-8">
          <MainGauge 
            value={data?.value ?? 0} 
            classification={data?.classification ?? 'Loading...'}
          />
          
          {loading ? (
            <div className="flex justify-center items-center h-[150px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <SmallGauge 
                    value={data?.historical?.yesterday?.value ?? 0}
                    label="Yesterday"
                    classification={data?.historical?.yesterday?.classification ?? 'N/A'}
                  />
                  <SmallGauge 
                    value={data?.historical?.week_ago?.value ?? 0} 
                    label="7d ago"
                    classification={data?.historical?.week_ago?.classification ?? 'N/A'}
                  />
                  <SmallGauge 
                    value={data?.historical?.month_ago?.value ?? 0} 
                    label="1m ago"
                    classification={data?.historical?.month_ago?.classification ?? 'N/A'}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(FearGreedGauge); 