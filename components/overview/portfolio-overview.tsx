"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "2020", value: 0.15, color: "#F7931A" },
  { name: "2021", value: 0.12, color: "#FFA940" },
  { name: "2022", value: 0.08, color: "#D97706" },
  { name: "2023", value: 0.07, color: "#B45309" },
]

export function PortfolioOverview() {
  return (
    <ChartContainer
      config={{
        "2020": {
          label: "2020",
          color: "#F7931A",
        },
        "2021": {
          label: "2021",
          color: "#FFA940",
        },
        "2022": {
          label: "2022",
          color: "#D97706",
        },
        "2023": {
          label: "2023",
          color: "#B45309",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

