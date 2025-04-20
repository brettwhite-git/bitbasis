import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement, 
  Title,
  Tooltip,
  Legend
);

interface HistogramBarData {
  day: string;
  value: number;
  count: number;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      callbacks: {
        title: () => '',
        label: (context) => {
          const count = context.parsed.y;
          return `Buys: ${count}`;
        },
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#9ca3af",
      },
      border: {
        display: false,
      },
    },
    y: {
      display: false,
      beginAtZero: true,
      grid: {
        display: false,
      },
      ticks: {
        display: false,
      },
      border: {
        display: false,
      },
    },
  },
};

const BuyPatternHistogram: React.FC<{ className?: string }> = ({ className }) => {
  const { supabase } = useSupabase();
  const [chartData, setChartData] = useState<HistogramBarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuyData = async () => {
      console.log("[BuyPatternHistogram] Fetching buy data...");
      setLoading(true);
      setError(null);

      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('date')
        .eq('type', 'buy');

      console.log("[BuyPatternHistogram] Fetch result:", { orders, fetchError }); 

      if (fetchError) {
        console.error("[BuyPatternHistogram] Error fetching buy orders:", fetchError);
        setError("Failed to load buy pattern data.");
        setLoading(false);
        return;
      }

      if (!orders || orders.length === 0) {
        console.log("[BuyPatternHistogram] No buy orders found.");
        setChartData(dayLabels.map(day => ({ day, value: 0, count: 0 })));
        setLoading(false);
        return;
      }

      console.log(`[BuyPatternHistogram] Processing ${orders.length} buy orders.`);
      const dayCounts = Array(7).fill(0);
      orders.forEach(order => {
        try {
          const date = new Date(order.date);
          const dayIndex = date.getDay(); 
          if (dayIndex >= 0 && dayIndex <= 6) {
             dayCounts[dayIndex]++;
          } else {
             console.warn(`[BuyPatternHistogram] Invalid day index ${dayIndex} for date: ${order.date}`);
          }
        } catch (e) {
          console.warn(`[BuyPatternHistogram] Invalid date format found: ${order.date}`, e);
        }
      });

      console.log("[BuyPatternHistogram] Calculated dayCounts:", dayCounts);

      const processedData: HistogramBarData[] = dayCounts.map((count, index) => ({
        day: dayLabels[index] ?? '', 
        value: 0,
        count: count,
      }));
      
      console.log("[BuyPatternHistogram] Processed chart data:", processedData);

      setChartData(processedData);
      setLoading(false);
    };

    fetchBuyData();
  }, [supabase]);

  const data = {
    labels: chartData.map(d => d.day),
    datasets: [
      {
        label: 'Buys',
        data: chartData.map(d => d.count),
        backgroundColor: chartData.map(d => d.count > 0 ? '#F7931A' : '#374151'),
        borderColor: chartData.map(d => d.count > 0 ? '#F7931A' : '#374151'),
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        barThickness: 12,
      },
    ],
  };

  return (
    <Card className={cn("flex flex-col", className)}> 
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Weekly Buy Pattern</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center flex-grow pb-4"> 
        {loading ? (
          <div className="flex items-end justify-around h-24 w-full">
            {dayLabels.map((_, index) => (
              <Skeleton key={index} className="h-full w-3 bg-gray-700" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-24 w-full text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <div className="relative h-full w-full max-h-[100px]">
            <Bar options={options} data={data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BuyPatternHistogram; 