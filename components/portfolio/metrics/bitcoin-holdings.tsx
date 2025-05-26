"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { formatBTC } from "@/lib/utils/utils"

interface BitcoinHoldingsProps {
  totalBtc: number
  totalTransactions: number
  isLoading?: boolean
}

export function BitcoinHoldings({ 
  totalBtc, 
  totalTransactions, 
  isLoading = false 
}: BitcoinHoldingsProps) {
  const displayBtc = Math.max(0, totalBtc)
  
  return (
    <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-gray-400">Total Bitcoin</h3>
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
              {formatBTC(displayBtc)}
            </div>
            <p className="text-xs text-gray-400 pt-2">
              {totalTransactions} total transactions
            </p>
          </>
        )}
      </div>
    </div>
  )
}
