import { getPortfolioMetrics, getPerformanceMetrics } from "@/lib/portfolio"
import { DashboardContent } from "@/components/overview/dashboard-content"
import { requireAuth } from "@/lib/server-auth"

export default async function DashboardPage() {
  const { supabase, user } = await requireAuth()

  // Fetch portfolio and performance metrics
  const [metrics, performance] = await Promise.all([
    getPortfolioMetrics(user.id, supabase),
    getPerformanceMetrics(user.id, supabase)
  ])

  return <DashboardContent metrics={metrics} performance={performance} />
}

