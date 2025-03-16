"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  {
    year: "2020",
    amount: 0.15,
  },
  {
    year: "2021",
    amount: 0.12,
  },
  {
    year: "2022",
    amount: 0.08,
  },
  {
    year: "2023",
    amount: 0.07,
  },
]

export function PortfolioYearlyChart() {
  return (
    <ChartContainer
      config={{
        amount: {
          label: "BTC Amount",
          color: "#F7931A",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="year" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="amount" fill="var(--color-amount)" name="BTC Amount" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

