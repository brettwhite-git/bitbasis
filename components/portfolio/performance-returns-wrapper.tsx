"use client"

import { usePerformanceMetrics } from "@/lib/hooks/usePerformanceMetrics"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CumulativeReturns } from "./performance/cumulative-returns"
import { CompoundGrowth } from "./performance/compound-growth"
import { ReturnsTable } from "./performance/returns-table"

export function PerformanceReturnsWrapper() {
  const { data, loading, error, refetch } = usePerformanceMetrics()

  if (loading) {
    return <PerformanceSkeleton />
  }
  
  if (error) {
    return <PerformanceError error={error} onRetry={refetch} />
  }
  
  if (!data) {
    return <PerformanceError error="No performance data available" onRetry={refetch} />
  }
  
  return (
    <Card>
      <CardHeader className="pb-0">
        <h2 className="text-xl font-semibold">Performance Metrics</h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Returns Table (Cost Basis Method Comparison) */}
        <ReturnsTable />

        {/* Cumulative Returns Table */}
        <CumulativeReturns data={data.cumulative} />

        {/* Compound Growth Rate Table */}
        <CompoundGrowth data={data.compoundGrowth} />
      </CardContent>
    </Card>
  )
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-[500px]" />
    </div>
  )
}

function PerformanceError({ error, onRetry }: { error: string, onRetry: () => Promise<void> }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4 mr-2" />
      <AlertDescription className="flex items-center justify-between">
        <span>Error loading performance data: {error}</span>
        <Button variant="outline" size="sm" onClick={() => onRetry()}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
} 