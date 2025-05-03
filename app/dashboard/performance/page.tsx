import { requireAuth } from "@/lib/auth/server-auth"
import { PerformanceOverview } from "@/components/performance"

export default async function PerformancePage() {
  const { user } = await requireAuth()
  
  return <PerformanceOverview user={user} />
}

