"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { formatBTC, formatCurrency } from "@/lib/utils/utils"

interface HoldingsTermProps {
  btcAmount: number
  btcPrice: number
  term: 'Long-Term' | 'Short-Term'
  isLoading?: boolean
}

export function HoldingsTerm({ btcAmount, btcPrice, term, isLoading = false }: HoldingsTermProps) {
  const value = btcAmount * btcPrice
  
  return (
    <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-gray-400">{term} Holdings</h3>
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
              {formatBTC(btcAmount)}
            </div>
            <p className="text-xs text-gray-400 pt-2">
              Value: {formatCurrency(value)}
            </p>
          </>
        )}
      </div>
    </div>
  )
} 