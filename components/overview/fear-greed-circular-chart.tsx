'use client';

import { useEffect, useState, memo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Dynamically import ReactApexChart with SSR disabled
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

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

// Classification colors for Fear & Greed Index
const FEAR_GREED_COLORS = {
  'Extreme Fear': '#EA4228', // Red
  'Fear': '#F58B19',        // Orange
  'Neutral': '#F5CD19',     // Yellow
  'Greed': '#90BE6D',       // Light Green
  'Extreme Greed': '#5BE12C', // Green
};

// Get color based on value for gradient coloring
const getColorByValue = (value: number): string => {
  if (value <= 25) return FEAR_GREED_COLORS['Extreme Fear'];
  if (value <= 45) return FEAR_GREED_COLORS['Fear'];
  if (value <= 55) return FEAR_GREED_COLORS['Neutral'];
  if (value <= 75) return FEAR_GREED_COLORS['Greed'];
  return FEAR_GREED_COLORS['Extreme Greed'];
};

const getChartOptions = (data: FearGreedData | null): ApexOptions => {
  if (!data) {
    return {
      chart: {
        type: 'radialBar',
        background: 'transparent',
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '30%',
          },
          track: {
            background: '#1A202C',
          },
        },
      },
      colors: ['#EA4228'],
      labels: ['Loading...'],
    };
  }

  // Prepare series data from Fear & Greed values
  const seriesData = [
    data.value,
    data.historical?.yesterday?.value || 0,
    data.historical?.week_ago?.value || 0, 
    data.historical?.month_ago?.value || 0
  ];

  // Prepare labels
  const labels = [
    'Today',
    'Yesterday',
    '7d ago',
    '1m ago'
  ];

  // Prepare colors based on Fear & Greed classifications
  const colors = [
    getColorByValue(data.value),
    getColorByValue(data.historical?.yesterday?.value || 0),
    getColorByValue(data.historical?.week_ago?.value || 0),
    getColorByValue(data.historical?.month_ago?.value || 0)
  ];

  return {
    series: seriesData,
    chart: {
      height: 350,
      type: 'radialBar',
      background: 'transparent',
      toolbar: {
        show: false
      },
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '40%',
          background: 'transparent',
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: false,
          }
        },
        barLabels: {
          enabled: true,
          useSeriesColors: true,
          offsetX: -20,
          fontSize: '16px',
          fontWeight: 'bold',
          formatter: function(seriesName: string, opts: any) {
            return seriesName + ": " + opts.w.globals.series[opts.seriesIndex]
          },
        },
        track: {
          background: '#1e293b',
          opacity: 0.9,
          strokeWidth: '97%',
          margin: 5,
          dropShadow: {
            enabled: false,
          }
        },
      }
    },
    colors: colors,
    labels: labels,
    stroke: {
      lineCap: 'round',
      width: 3,
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: false
    },
  };
};

const FearGreedCircularChart = () => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fear-greed');
        const result = await response.json();
        console.log('[FearGreedCircularChart] Data received from API:', result);
        if (result.error) {
          console.error('[FearGreedCircularChart] Error fetching Fear & Greed data:', result.error);
          setData(null);
          return;
        }
        setData(result);
      } catch (error) {
        console.error('[FearGreedCircularChart] Failed to fetch Fear & Greed data:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartOptions = getChartOptions(data);
  
  // Create series data for the chart
  const series = data ? [
    data.value,
    data.historical?.yesterday?.value || 0,
    data.historical?.week_ago?.value || 0,
    data.historical?.month_ago?.value || 0
  ] : [0, 0, 0, 0];

  // Create value info for custom rendering
  const valueInfo = data ? [
    {
      label: 'Today',
      value: data.value,
      classification: data.classification,
      color: getColorByValue(data.value)
    },
    {
      label: 'Yesterday',
      value: data.historical?.yesterday?.value || 0,
      classification: data.historical?.yesterday?.classification || 'N/A',
      color: getColorByValue(data.historical?.yesterday?.value || 0)
    },
    {
      label: '7d ago',
      value: data.historical?.week_ago?.value || 0,
      classification: data.historical?.week_ago?.classification || 'N/A',
      color: getColorByValue(data.historical?.week_ago?.value || 0)
    },
    {
      label: '1m ago',
      value: data.historical?.month_ago?.value || 0,
      classification: data.historical?.month_ago?.classification || 'N/A',
      color: getColorByValue(data.historical?.month_ago?.value || 0)
    }
  ] : [];

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="text-left py-1.5">Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex justify-center items-center h-[350px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col" ref={chartRef}>
            <div className="h-[350px] relative">
              {/* Main Chart */}
              {typeof window !== 'undefined' && (
                <ReactApexChart
                  options={chartOptions}
                  series={series}
                  type="radialBar"
                  height={365}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(FearGreedCircularChart); 