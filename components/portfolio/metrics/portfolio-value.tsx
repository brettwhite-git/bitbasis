"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/utils"

interface PortfolioValueProps {
  currentValue: number
  totalBtc: number
  isLoading?: boolean
}

export function PortfolioValue({ currentValue, totalBtc, isLoading = false }: PortfolioValueProps) {
  const displayValue = Math.max(0, currentValue)
  const btcPrice = totalBtc > 0 ? currentValue / totalBtc : 0
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
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
              {formatCurrency(displayValue)}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              BTC Price: {formatCurrency(btcPrice)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
