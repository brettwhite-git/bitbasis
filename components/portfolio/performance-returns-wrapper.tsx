"use client"

import { PerformanceReturns } from "@/components/portfolio/performance-returns"
import SupabaseProvider from "@/components/providers/supabase-provider"

interface PerformanceData {
  cumulative: {
    total: { percent: number; dollar: number }
    day: { percent: number; dollar: number }
    week: { percent: number; dollar: number }
    month: { percent: number | null; dollar: number | null }
    ytd: { percent: number | null; dollar: number | null }
    threeMonth: { percent: number | null; dollar: number | null }
    year: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
  compoundGrowth: {
    total: number | null
    oneYear: number | null
    twoYear: number | null
    threeYear: number | null
    fourYear: number | null
    fiveYear: number | null
    sixYear: number | null
    sevenYear: number | null
    eightYear: number | null
  }
}

export function PerformanceReturnsWrapper({ data }: { data: PerformanceData }) {
  return (
    <SupabaseProvider>
      <PerformanceReturns data={data} />
    </SupabaseProvider>
  )
} 