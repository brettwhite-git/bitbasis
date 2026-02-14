import { getPortfolioMetrics } from "@/lib/core/portfolio/metrics"
import { getPerformanceMetrics } from "@/lib/core/portfolio/performance"
import { OverviewLayout } from "@/components/dashboard/overview/overview-layout"
import { requireAuth } from "@/lib/auth/server-auth"

export default async function DashboardPage() {
  // Remove test logs
  // console.log("[DashboardPage] Starting server component render.")

  // Use requireAuth - don't catch redirect() errors, let them propagate
  // requireAuth() will redirect to sign-in if not authenticated
  const authResult = await requireAuth()
  const user = authResult.user
  const supabase = authResult.supabase
  
  // Verify user exists before trying to fetch metrics
  if (!user || !user.id) {
    console.error("[DashboardPage] No user ID available after requireAuth")
    return <div>Authentication error. Please try signing in again.</div>
  }
  
  // Fetch portfolio and performance metrics
  let metrics
  let performance
  try {
    [metrics, performance] = await Promise.all([
      getPortfolioMetrics(user.id, supabase),
      getPerformanceMetrics(user.id, supabase)
    ])
  } catch (error) {
    console.error("[DashboardPage] Error fetching metrics:", error)
    return <div>Error loading dashboard data. Please try again later.</div>
  }

  return <OverviewLayout metrics={metrics} performance={performance} />
}

