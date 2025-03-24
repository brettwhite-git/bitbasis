"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    date: "Jan",
    value: 15000,
    costBasis: 12000,
  },
  {
    date: "Feb",
    value: 16500,
    costBasis: 13000,
  },
  {
    date: "Mar",
    value: 14800,
    costBasis: 13500,
  },
  {
    date: "Apr",
    value: 17200,
    costBasis: 14000,
  },
  {
    date: "May",
    value: 19500,
    costBasis: 15000,
  },
  {
    date: "Jun",
    value: 21800,
    costBasis: 16000,
  },
  {
    date: "Jul",
    value: 24563,
    costBasis: 18420,
  },
]

export function PerformanceChart() {
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
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
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
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

