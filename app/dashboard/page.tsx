import { getPortfolioMetrics } from "@/lib/core/portfolio/metrics"
import { getPerformanceMetrics } from "@/lib/core/portfolio/performance"
import { OverviewLayout } from "@/components/dashboard/overview/overview-layout"
import { requireAuth } from "@/lib/auth/server-auth"

export default async function DashboardPage() {
  // Remove test logs
  // console.log("[DashboardPage] Starting server component render.")

  // Use requireAuth 
  let user, supabase
  try {
    // console.log("[DashboardPage] Calling requireAuth()...")
    const authResult = await requireAuth()
    user = authResult.user
    supabase = authResult.supabase
    // console.log(`[DashboardPage] requireAuth() successful. User ID: ${user.id}`)
  } catch (error) {
    console.error("[DashboardPage] Error during requireAuth():", error)
    // Rely on requireAuth's redirect
    return <div>Redirecting to login...</div>
  }
  
  // Verify user exists before trying to fetch metrics
  if (!user || !user.id) {
    console.error("[DashboardPage] No user ID available after requireAuth")
    return <div>Authentication error. Please try signing in again.</div>
  }
  
  // Fetch portfolio and performance metrics
  try {
    // console.log("[DashboardPage] Calling Promise.all for metrics...")
    const [metrics, performance] = await Promise.all([
      getPortfolioMetrics(user.id, supabase),
      getPerformanceMetrics(user.id, supabase)
    ])
    // console.log("[DashboardPage] Promise.all for metrics successful.")
    
    // console.log("[DashboardPage] Rendering DashboardContent.")
    return <OverviewLayout metrics={metrics} performance={performance} />
  } catch (error) {
    console.error("[DashboardPage] Error fetching metrics:", error)
    return <div>Error loading dashboard data. Please try again later.</div>
  }
}

