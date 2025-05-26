"use client"

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
    <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-gray-400">Total Fees Paid</h3>
      </div>
      <div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-[120px] bg-gray-700" />
            <Skeleton className="h-4 w-[100px] bg-gray-700" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-bitcoin-orange">
              {formatCurrency(totalFees)}
            </div>
            <p className="text-xs text-gray-400 pt-2">
              {totalCostBasis > 0 
                ? `${feePercentage.toFixed(2)}% of total cost basis`
                : 'No purchases yet'}
            </p>
          </>
        )}
      </div>
    </div>
  )
} 