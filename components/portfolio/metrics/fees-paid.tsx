"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/utils"

interface FeesPaidProps {
  totalFees: number
  totalCostBasis: number
  isLoading?: boolean
}

export function FeesPaid({ totalFees, totalCostBasis, isLoading = false }: FeesPaidProps) {
  const feePercentage = totalCostBasis > 0 ? (totalFees / totalCostBasis) * 100 : 0
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-bitcoin-orange">
              {formatCurrency(totalFees)}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {totalCostBasis > 0 
                ? `${feePercentage.toFixed(2)}% of total cost basis`
                : 'No purchases yet'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
} 