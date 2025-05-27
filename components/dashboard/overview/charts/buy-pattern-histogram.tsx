import React, { useState, useEffect } from 'react';

import { cn } from "@/lib/utils/utils";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { createBuyPatternTooltipConfig } from "@/lib/utils/chart-tooltip-config";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const BuyPatternHistogram: React.FC<{ className?: string }> = ({ className }) => {
  const { supabase } = useSupabase();
  const [dayCounts, setDayCounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chart.js options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend
      },
      tooltip: createBuyPatternTooltipConfig(),
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: "#374151",
        },
        ticks: {
          color: "#9ca3af",
        }
      },
      y: {
        display: false, // Hide y-axis
        beginAtZero: true,
        grid: {
          display: false,
        }
      }
    },
  };

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
        setDayCounts([0, 0, 0, 0, 0, 0, 0]);
        setLoading(false);
        return;
      }

      // Process the data
      console.log(`[BuyPatternHistogram] Processing ${orders.length} buy orders.`);
      const counts = Array(7).fill(0);
      orders.forEach(order => {
        try {
          const date = new Date(order.date);
          const dayIndex = date.getDay();
          if (dayIndex >= 0 && dayIndex <= 6) {
            counts[dayIndex]++;
          } else {
            console.warn(`[BuyPatternHistogram] Invalid day index ${dayIndex} for date: ${order.date}`);
          }
        } catch (e) {
          console.warn(`[BuyPatternHistogram] Invalid date format found: ${order.date}`, e);
        }
      });

      console.log("[BuyPatternHistogram] Calculated dayCounts:", counts);
      setDayCounts(counts);
      setLoading(false);
    };

    fetchBuyData();
  }, [supabase]);

  // Prepare data for Chart.js
  const data = {
    labels: dayLabels,
    datasets: [
      {
        data: dayCounts,
        backgroundColor: '#F7931A', // Bitcoin orange
        borderRadius: 4, // Rounded bars
        borderSkipped: false, // Ensure all corners are rounded
        barPercentage: 0.6, // Bar width
        categoryPercentage: 0.3, // Bar spacing
      },
    ],
  };

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm flex flex-col ${className || ''}`}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="pb-4">
          <h3 className="text-sm font-bold text-white">Weekly Buy Pattern</h3>
        </div>
        <div className="flex flex-col justify-end flex-grow">
          {loading ? (
            <div className="flex items-center justify-center h-24 w-full">
              <Skeleton className="h-full w-full bg-gray-700" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-22 w-full text-red-500 text-sm">
              {error}
            </div>
          ) : (
            <div className="h-32 w-full">
              <Bar options={options} data={data} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyPatternHistogram; 