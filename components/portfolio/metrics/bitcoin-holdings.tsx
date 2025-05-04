"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Bitcoin</CardTitle>
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
              {formatBTC(displayBtc)}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {totalTransactions} total transactions
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
