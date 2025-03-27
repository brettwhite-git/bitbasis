import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getPortfolioMetrics, getPerformanceMetrics } from "@/lib/portfolio"
import { DashboardContent } from "@/components/overview/dashboard-content"

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Fetch portfolio and performance metrics
  const [metrics, performance] = await Promise.all([
    getPortfolioMetrics(user.id, supabase),
    getPerformanceMetrics(user.id, supabase)
  ])

  return <DashboardContent metrics={metrics} performance={performance} />
}

