"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PerformanceDetailChartProps {
  period: "1m" | "3m" | "1y" | "all"
}

export function PerformanceDetailChart({ period }: PerformanceDetailChartProps) {
  // This would be fetched based on the period in a real app
  const data = {
    "1m": [
      { date: "Jun 15", value: 21800, costBasis: 16000, btcPrice: 52000 },
      { date: "Jun 22", value: 22400, costBasis: 16000, btcPrice: 53500 },
      { date: "Jun 29", value: 23100, costBasis: 16000, btcPrice: 55000 },
      { date: "Jul 06", value: 23800, costBasis: 18420, btcPrice: 56700 },
      { date: "Jul 13", value: 24563, costBasis: 18420, btcPrice: 58500 },
    ],
    "3m": [
      { date: "Apr 15", value: 17200, costBasis: 14000, btcPrice: 41000 },
      { date: "May 01", value: 18300, costBasis: 14000, btcPrice: 43500 },
      { date: "May 15", value: 19500, costBasis: 15000, btcPrice: 46500 },
      { date: "Jun 01", value: 20400, costBasis: 15000, btcPrice: 48500 },
      { date: "Jun 15", value: 21800, costBasis: 16000, btcPrice: 52000 },
      { date: "Jul 01", value: 23500, costBasis: 18420, btcPrice: 56000 },
      { date: "Jul 13", value: 24563, costBasis: 18420, btcPrice: 58500 },
    ],
    "1y": [
      { date: "Jul 2022", value: 12500, costBasis: 10000, btcPrice: 25000 },
      { date: "Sep 2022", value: 10800, costBasis: 10000, btcPrice: 21600 },
      { date: "Nov 2022", value: 9500, costBasis: 10000, btcPrice: 19000 },
      { date: "Jan 2023", value: 11200, costBasis: 12000, btcPrice: 22400 },
      { date: "Mar 2023", value: 14800, costBasis: 13500, btcPrice: 29600 },
      { date: "May 2023", value: 19500, costBasis: 15000, btcPrice: 46500 },
      { date: "Jul 2023", value: 24563, costBasis: 18420, btcPrice: 58500 },
    ],
    all: [
      { date: "Jul 2020", value: 5200, costBasis: 5000, btcPrice: 10400 },
      { date: "Jan 2021", value: 18000, costBasis: 5000, btcPrice: 36000 },
      { date: "Jul 2021", value: 16500, costBasis: 8000, btcPrice: 33000 },
      { date: "Jan 2022", value: 21000, costBasis: 8000, btcPrice: 42000 },
      { date: "Jul 2022", value: 12500, costBasis: 10000, btcPrice: 25000 },
      { date: "Jan 2023", value: 11200, costBasis: 12000, btcPrice: 22400 },
      { date: "Jul 2023", value: 24563, costBasis: 18420, btcPrice: 58500 },
    ],
  }

  return (
    <ChartContainer
      config={{
        value: {
          label: "Portfolio Value",
          color: "#F7931A",
        },
        costBasis: {
          label: "Cost Basis",
          color: "#64748b",
        },
        btcPrice: {
          label: "BTC Price (USD)",
          color: "#0ea5e9",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data[period]} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <ReferenceLine y={0} stroke="#374151" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Portfolio Value"
          />
          <Line
            type="monotone"
            dataKey="costBasis"
            stroke="var(--color-costBasis)"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Cost Basis"
          />
          <Line
            type="monotone"
            dataKey="btcPrice"
            stroke="var(--color-btcPrice)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="BTC Price (USD)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

